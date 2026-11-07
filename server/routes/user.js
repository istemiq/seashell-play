/**
 * Роуты пользователя: профиль, план, аватар, billing invoice, лимиты, награды за рекламу.
 */
import {
  getUserProfileResponse,
  setPlatformDisplayName,
} from '../platformUsersDb.js';
import { assertAllowedUserContent } from '../contentPolicy.js';
import { buildUserPlanResponse, isPremiumForUi } from '../entitlements.js';
import { isAppAdmin, isAppOwner } from '../adminAuth.js';
import { fetchTelegramUserProfilePhoto } from '../telegramProfilePhoto.js';
import {
  BILLING_PRODUCT_SUBSCRIPTION,
  BILLING_PRODUCT_TOPUP,
} from '../billingPolicy.js';
import { createStarsInvoiceLink } from '../telegramBilling.js';
import { recordAdView } from '../db.js';
import { getPracticeQuotaStatus, getWordsQuotaStatus } from '../routeHelpers.js';

export function registerUserRoutes(app) {
  app.get('/api/user/profile', async (req, res) => {
    try {
      const profile = await getUserProfileResponse(req.vkUserId);
      res.json(profile);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  app.patch('/api/user/profile', async (req, res) => {
    try {
      const displayName = req.body?.displayName;
      const pol = assertAllowedUserContent(String(displayName ?? ''));
      if (!pol.ok) return res.status(400).json({ error: pol.error || 'Invalid display name' });
      const saved = await setPlatformDisplayName(req.vkUserId, displayName);
      res.json({ userId: req.vkUserId, displayName: saved, needsOnboarding: false });
    } catch (e) {
      if (e.status === 400 || e.status === 403 || e.status === 404) {
        return res.status(e.status).json({ error: e.message });
      }
      console.error(e);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  app.get('/api/user/plan', async (req, res) => {
    try {
      const plan = await buildUserPlanResponse(req.vkUserId);
      plan.admin = isAppAdmin(req.vkUserId);
      plan.adminOwner = isAppOwner(req.vkUserId);
      plan.superAccount = plan.adminOwner;
      res.json(plan);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to fetch plan' });
    }
  });

  app.get('/api/user/avatar', async (req, res) => {
    try {
      const photo = await fetchTelegramUserProfilePhoto(req.vkUserId);
      if (!photo) return res.status(404).end();
      res.set('Cache-Control', 'private, max-age=3600');
      res.set('Content-Type', photo.contentType);
      return res.send(photo.buffer);
    } catch (e) {
      console.error('[avatar]', e);
      return res.status(500).end();
    }
  });

  app.post('/api/billing/invoice', async (req, res) => {
    const product = String(req.body?.product ?? BILLING_PRODUCT_SUBSCRIPTION).trim();
    if (product !== BILLING_PRODUCT_SUBSCRIPTION && product !== BILLING_PRODUCT_TOPUP) {
      return res.status(400).json({ error: 'Invalid product' });
    }
    if (!String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim()) {
      return res.status(503).json({ error: 'Billing is not configured' });
    }
    try {
      const invoiceUrl = await createStarsInvoiceLink(req.vkUserId, product);
      res.json({ invoiceUrl, product });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e?.message || 'Failed to create invoice' });
    }
  });

  app.get('/api/user/limits', async (req, res) => {
    const premium = await isPremiumForUi(req.vkUserId);
    if (premium) {
      const plan = await buildUserPlanResponse(req.vkUserId);
      return res.json({
        premium: true,
        subscription: plan.subscription,
      });
    }
    try {
      const [words, practice] = await Promise.all([
        getWordsQuotaStatus(req.vkUserId),
        getPracticeQuotaStatus(req.vkUserId),
      ]);

      res.json({
        premium: false,
        words,
        practice,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to fetch limits' });
    }
  });

  app.post('/api/ads/reward', async (req, res) => {
    const type = req.body?.type;
    if (type !== 'words' && type !== 'practice') {
      return res.status(400).json({ error: 'Invalid reward type' });
    }
    try {
      await recordAdView(req.vkUserId, type);
      const status = type === 'words'
        ? await getWordsQuotaStatus(req.vkUserId)
        : await getPracticeQuotaStatus(req.vkUserId);

      res.json({
        success: true,
        adViews: status.adViews,
        limit: status.limit,
        used: status.used,
        bonusPerAd: status.bonusPerAd,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to record ad view' });
    }
  });
}
