import { useCallback, useState } from 'react';



import { Button, Box, Footnote, FormItem, Group, GroupHeader, Panel, PanelHeader, PanelHeaderBack, Text } from '../components/Ui.jsx';

import { createBillingInvoice } from '../api/billingApi.js';

import { usePremium } from '../hooks/usePremium.js';

import { useEscapeBack } from '../hooks/useEscapeBack.js';

import { useI18n } from '../i18n/I18nContext.jsx';

import { openStarsInvoice } from '../utils/starsInvoice.js';

import { useNavigateBackOrHome } from '../utils/useNavigateBackOrHome.js';



export function PremiumPage() {

  const goBackOrHome = useNavigateBackOrHome();

  const { t, locale } = useI18n();

  useEscapeBack(goBackOrHome);

  const { plan, reloadPlan } = usePremium();

  const [billingLoading, setBillingLoading] = useState(false);

  const [billingMessage, setBillingMessage] = useState('');



  const formatUntil = useCallback(

    (ms) => {

      if (!ms) return '';

      return new Date(ms).toLocaleDateString(locale || 'ru', {

        day: 'numeric',

        month: 'long',

        year: 'numeric',

      });

    },

    [locale],

  );



  const runBilling = useCallback(

    async (product) => {

      if (!plan.billing?.enabled) {

        setBillingMessage(t('billing.unavailable'));

        return;

      }

      setBillingLoading(true);

      setBillingMessage('');

      try {

        const { invoiceUrl } = await createBillingInvoice(product);

        const status = await openStarsInvoice(invoiceUrl);

        if (status === 'paid') {

          setBillingMessage(t('billing.paid'));

          await reloadPlan();

        } else if (status === 'cancelled') {

          setBillingMessage(t('billing.cancelled'));

        } else {

          setBillingMessage(t('billing.failed'));

        }

      } catch (e) {

        setBillingMessage(e?.message || t('billing.failed'));

      } finally {

        setBillingLoading(false);

      }

    },

    [plan.billing?.enabled, reloadPlan, t],

  );



  const stars = plan.billing?.subscriptionStars ?? 145;

  const rubApprox = Math.round(stars * 1.72);

  const showSubscribe = !plan.premium;

  const showTopUp = plan.premium && !plan.bypass;



  return (

    <Panel>

      <PanelHeader before={<PanelHeaderBack onClick={() => void goBackOrHome()} />}>

        {t('billing.title')}

      </PanelHeader>



      <Group>

        <FormItem>

          <Text>{plan.premium ? t('billing.premiumActive') : t('billing.premiumInactive')}</Text>

          {plan.premium && plan.subscription?.credits != null ? (

            <Footnote className="ss-mt-sm">

              {t('billing.credits', {

                left: plan.subscription.credits,

                total: plan.subscription.creditsMonthly ?? 120,

              })}

            </Footnote>

          ) : null}

          {plan.subscription?.until ? (

            <Footnote className="ss-mt-6">

              {t('billing.until', { date: formatUntil(plan.subscription.until) })}

            </Footnote>

          ) : null}

        </FormItem>

      </Group>



      {showSubscribe ? (

        <Group header={<GroupHeader mode="secondary">{t('billing.subscribe', { stars })}</GroupHeader>}>

          <Button

            size="l"

            flat

            stretched

            loading={billingLoading}

            disabled={!plan.billing?.enabled}

            i18nKey="billing.subscribe"

            i18nParams={{ stars }}

            onClick={() => void runBilling('sub_month')}

          />

          <Box className="ss-vpad-block-sm">

            <Footnote>

              {t('billing.subscribeHint', {

                rub: rubApprox,

                credits: plan.subscription?.creditsMonthly ?? 120,

              })}

            </Footnote>

          </Box>

          {billingMessage ? (

            <Box className="ss-vpad-block">

              <Footnote>{billingMessage}</Footnote>

            </Box>

          ) : null}

        </Group>

      ) : null}



      {showTopUp ? (

        <Group header={<GroupHeader mode="secondary">{t('billing.manageCredits')}</GroupHeader>}>

          <Button

            size="l"

            flat

            stretched

            mode="secondary"

            loading={billingLoading}

            disabled={!plan.billing?.enabled}

            i18nKey="billing.topUp"

            i18nParams={{

              stars: plan.billing?.topUpStars ?? 69,

              credits: plan.billing?.topUpCredits ?? 60,

            }}

            onClick={() => void runBilling('topup_credits')}

          />

          {billingMessage ? (

            <Box className="ss-vpad-block">

              <Footnote>{billingMessage}</Footnote>

            </Box>

          ) : null}

        </Group>

      ) : null}

    </Panel>

  );

}


