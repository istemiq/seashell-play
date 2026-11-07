/**
 * Админские роуты: /api/admin/stats (Bearer, до auth-middleware) и
 * /api/admin/* (управление доступом, после auth-middleware).
 */
import { getDbPool, resetUserQuotaForAdmin } from '../db.js';
import { fetchUsageStats } from '../usageStats.js';
import { clientIp } from '../securityHelpers.js';
import {
  verifyAdminStatsToken,
  adminStatsToken,
  isAppAdmin,
  isAppOwner,
} from '../adminAuth.js';
import {
  buildAdminAccessPayload,
  grantAppAdmin,
  grantPremiumAccess,
  parsePositiveUserId,
  revokeAppAdmin,
  revokePremiumAccess,
} from '../appAccess.js';
import { makeRateLimiter, respondDatabaseError } from '../routeHelpers.js';

/** Usage counters for admins (Bearer ADMIN_STATS_TOKEN). No user PII beyond numeric ids. */
export function registerAdminStatsRoute(app) {
  const limitAdminStats = makeRateLimiter({
    windowMs: 60_000,
    max: 15,
    keyFn: (req) => `admin-stats:${clientIp(req)}`,
  });

  app.get('/api/admin/stats', limitAdminStats, async (req, res) => {
    if (!adminStatsToken()) {
      return res.status(503).json({ error: 'Admin stats not configured (ADMIN_STATS_TOKEN)' });
    }
    if (!verifyAdminStatsToken(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const stats = await fetchUsageStats(getDbPool());
      res.json(stats);
    } catch (e) {
      respondDatabaseError(res, e);
    }
  });
}

export function registerAdminRoutes(app) {
  app.post('/api/admin/reset-limits', async (req, res) => {
    if (!isAppAdmin(req.vkUserId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const targetId = parsePositiveUserId(req.body?.targetUserId);
    if (!targetId) {
      return res.status(400).json({ error: 'Invalid target user id' });
    }
    try {
      await resetUserQuotaForAdmin(targetId);
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to reset limits' });
    }
  });

  app.get('/api/admin/access', async (req, res) => {
    if (!isAppAdmin(req.vkUserId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    try {
      res.json(await buildAdminAccessPayload(req.vkUserId));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to load admin access' });
    }
  });

  app.post('/api/admin/admins', async (req, res) => {
    if (!isAppOwner(req.vkUserId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const targetId = parsePositiveUserId(req.body?.userId);
    if (!targetId) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    if (targetId === req.vkUserId) {
      return res.status(400).json({ error: 'Owner is already an admin' });
    }
    try {
      await grantAppAdmin(targetId, req.vkUserId);
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to add admin' });
    }
  });

  app.delete('/api/admin/admins/:userId', async (req, res) => {
    if (!isAppOwner(req.vkUserId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const targetId = parsePositiveUserId(req.params.userId);
    if (!targetId) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    if (isAppOwner(targetId)) {
      return res.status(400).json({ error: 'Cannot remove owner' });
    }
    try {
      const removed = await revokeAppAdmin(targetId);
      if (!removed) {
        return res.status(404).json({ error: 'Admin not found' });
      }
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to remove admin' });
    }
  });

  app.post('/api/admin/premium-grants', async (req, res) => {
    if (!isAppAdmin(req.vkUserId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const targetId = parsePositiveUserId(req.body?.userId);
    if (!targetId) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    try {
      await grantPremiumAccess(targetId, req.vkUserId);
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to grant premium' });
    }
  });

  app.delete('/api/admin/premium-grants/:userId', async (req, res) => {
    if (!isAppAdmin(req.vkUserId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const targetId = parsePositiveUserId(req.params.userId);
    if (!targetId) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    try {
      const removed = await revokePremiumAccess(targetId);
      if (!removed) {
        return res.status(404).json({ error: 'Premium grant not found' });
      }
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to revoke premium' });
    }
  });
}
