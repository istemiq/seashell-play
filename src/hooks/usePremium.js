import { useCallback, useEffect, useState } from 'react';
import { fetchUserPlan } from '../api/userApi.js';
import { usePlatformUser } from './usePlatformUser.js';

const EMPTY_PLAN = {
  premium: false,
  admin: false,
  bypass: false,
  subscription: { active: false, until: null, credits: null, creditsMonthly: 120 },
  billing: { enabled: false, subscriptionStars: 145, topUpStars: 69, topUpCredits: 60 },
};

export function usePremium() {
  const { ready } = usePlatformUser();
  const [plan, setPlan] = useState(EMPTY_PLAN);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchUserPlan();
      setPlan({ ...EMPTY_PLAN, ...next, subscription: { ...EMPTY_PLAN.subscription, ...next?.subscription }, billing: { ...EMPTY_PLAN.billing, ...next?.billing } });
    } catch {
      setPlan(EMPTY_PLAN);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    void (async () => {
      await reload();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, reload]);

  return {
    premium: Boolean(plan.premium),
    plan,
    loading,
    reloadPlan: reload,
  };
}
