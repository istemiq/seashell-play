import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Button,
  Cell,
  Footnote,
  FormItem,
  Group,
  GroupHeader,
  Input,
  Panel,
  PanelHeader,
  PanelHeaderBack,
} from '../components/Ui.jsx';
import {
  addAppAdmin,
  addPremiumGrantAdmin,
  fetchAdminAccess,
  removeAppAdmin,
  removePremiumGrantAdmin,
} from '../api/adminApi.js';
import { resetUserLimitsAdmin } from '../api/userApi.js';
import { useEscapeBack } from '../hooks/useEscapeBack.js';
import { usePremium } from '../hooks/usePremium.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useNavigateBackOrHome } from '../utils/useNavigateBackOrHome.js';

function sourceLabel(t, source) {
  if (source === 'owner') return t('admin.sourceOwner');
  if (source === 'env') return t('admin.sourceEnv');
  return t('admin.sourceDb');
}

export function AdminPage() {
  const navigate = useNavigate();
  const goBackOrHome = useNavigateBackOrHome();
  const { t } = useI18n();
  const { plan, loading: planLoading } = usePremium();
  useEscapeBack(goBackOrHome);

  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [premiumUserId, setPremiumUserId] = useState('');
  const [adminUserId, setAdminUserId] = useState('');
  const [resetUserId, setResetUserId] = useState('');
  const [busy, setBusy] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const next = await fetchAdminAccess();
      setAccess(next);
    } catch (e) {
      setAccess(null);
      setMessage(e?.message || t('admin.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (planLoading) return;
    if (!plan.admin) {
      navigate('/settings', { replace: true });
      return;
    }
    void reload();
  }, [navigate, plan.admin, planLoading, reload]);

  const runAction = async (key, fn) => {
    setBusy(key);
    setMessage('');
    try {
      await fn();
      await reload();
    } catch (e) {
      setMessage(e?.message || t('admin.actionFailed'));
    } finally {
      setBusy('');
    }
  };

  if (planLoading) {
    return (
      <Panel>
        <PanelHeader before={<PanelHeaderBack onClick={() => void goBackOrHome()} />}>
          {t('admin.title')}
        </PanelHeader>
        <Group>
          <FormItem>
            <Footnote>{t('admin.loading')}</Footnote>
          </FormItem>
        </Group>
      </Panel>
    );
  }

  if (!plan.admin) {
    return null;
  }

  return (
    <Panel>
      <PanelHeader before={<PanelHeaderBack onClick={() => void goBackOrHome()} />}>
        {t('admin.title')}
      </PanelHeader>

      <Group>
        <FormItem>
          <Footnote>{t('admin.hint')}</Footnote>
        </FormItem>
      </Group>

      <Group header={<GroupHeader mode="secondary">{t('admin.premiumSection')}</GroupHeader>}>
        <FormItem top={t('admin.userId')}>
          <Input
            type="number"
            inputMode="numeric"
            value={premiumUserId}
            onChange={(e) => setPremiumUserId(e.target.value)}
            placeholder={t('admin.userIdPlaceholder')}
          />
        </FormItem>
        <FormItem>
          <Button
            size="l"
            flat
            stretched
            loading={busy === 'premium-add'}
            disabled={!premiumUserId.trim()}
            i18nKey="admin.grantPremium"
            onClick={() =>
              void runAction('premium-add', async () => {
                await addPremiumGrantAdmin(premiumUserId.trim());
                setPremiumUserId('');
                setMessage(t('admin.premiumAdded'));
              })
            }
          />
        </FormItem>
        {loading ? (
          <FormItem>
            <Footnote>{t('admin.loading')}</Footnote>
          </FormItem>
        ) : null}
        {!loading && access?.premiumGrants?.length ? (
          access.premiumGrants.map((row) => (
            <Cell
              key={row.userId}
              subtitle={sourceLabel(t, row.source)}
              after={
                row.removable ? (
                  <Button
                    size="s"
                    mode="secondary"
                    loading={busy === `premium-${row.userId}`}
                    i18nKey="admin.remove"
                    onClick={() =>
                      void runAction(`premium-${row.userId}`, async () => {
                        await removePremiumGrantAdmin(row.userId);
                        setMessage(t('admin.premiumRemoved'));
                      })
                    }
                  />
                ) : null
              }
            >
              {row.userId}
            </Cell>
          ))
        ) : null}
        {!loading && !access?.premiumGrants?.length ? (
          <FormItem>
            <Footnote>{t('admin.premiumEmpty')}</Footnote>
          </FormItem>
        ) : null}
      </Group>

      {access?.isOwner ? (
        <Group header={<GroupHeader mode="secondary">{t('admin.adminsSection')}</GroupHeader>}>
          <FormItem top={t('admin.userId')}>
            <Input
              type="number"
              inputMode="numeric"
              value={adminUserId}
              onChange={(e) => setAdminUserId(e.target.value)}
              placeholder={t('admin.userIdPlaceholder')}
            />
          </FormItem>
          <FormItem>
            <Button
              size="l"
              flat
              stretched
              mode="secondary"
              loading={busy === 'admin-add'}
              disabled={!adminUserId.trim()}
              i18nKey="admin.grantAdmin"
              onClick={() =>
                void runAction('admin-add', async () => {
                  await addAppAdmin(adminUserId.trim());
                  setAdminUserId('');
                  setMessage(t('admin.adminAdded'));
                })
              }
            />
          </FormItem>
          {access?.admins?.length ? (
            access.admins.map((row) => (
              <Cell
                key={row.userId}
                subtitle={sourceLabel(t, row.source)}
                after={
                  row.removable ? (
                    <Button
                      size="s"
                      mode="secondary"
                      loading={busy === `admin-${row.userId}`}
                      i18nKey="admin.remove"
                      onClick={() =>
                        void runAction(`admin-${row.userId}`, async () => {
                          await removeAppAdmin(row.userId);
                          setMessage(t('admin.adminRemoved'));
                        })
                      }
                    />
                  ) : null
                }
              >
                {row.userId}
              </Cell>
            ))
          ) : (
            <FormItem>
              <Footnote>{t('admin.adminsEmpty')}</Footnote>
            </FormItem>
          )}
        </Group>
      ) : null}

      <Group header={<GroupHeader mode="secondary">{t('admin.limitsSection')}</GroupHeader>}>
        <FormItem top={t('admin.userId')}>
          <Input
            type="number"
            inputMode="numeric"
            value={resetUserId}
            onChange={(e) => setResetUserId(e.target.value)}
            placeholder={t('admin.userIdPlaceholder')}
          />
        </FormItem>
        <FormItem>
          <Button
            size="l"
            flat
            stretched
            mode="secondary"
            loading={busy === 'reset-limits'}
            disabled={!resetUserId.trim()}
            i18nKey="admin.resetLimits"
            onClick={() =>
              void runAction('reset-limits', async () => {
                await resetUserLimitsAdmin(resetUserId.trim());
                setResetUserId('');
                setMessage(t('admin.limitsReset'));
              })
            }
          />
        </FormItem>
      </Group>

      {message ? (
        <Group>
          <FormItem>
            <Footnote>{message}</Footnote>
          </FormItem>
        </Group>
      ) : null}
    </Panel>
  );
}
