"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AccessInfo, BillingService, PlanFeatures, SubscriptionInfo } from "@/lib/billing";

interface BillingContextType {
  subscription: SubscriptionInfo | null;
  access: AccessInfo | null;
  isLoading: boolean;
  /** Plan includes this feature */
  can: (feature: keyof PlanFeatures) => boolean;
  refresh: () => Promise<void>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export function BillingProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setSubscription(null);
      return;
    }
    setIsLoading(true);
    try {
      const res = await BillingService.subscription();
      setSubscription(((res as any)?.data ?? res) as SubscriptionInfo);
    } catch {
      // keep the previous value: a transient error must not flash the "blocked" state
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setSubscription(null);
      return;
    }
    refresh();
  }, [authLoading, isAuthenticated, user?.tenantId, refresh]);

  // Refresh when something might have changed the plan or the usage
  useEffect(() => {
    const onBlocked = () => refresh();
    const onFocus = () => refresh();
    window.addEventListener("axentyc:billing-blocked", onBlocked);
    window.addEventListener("axentyc:billing-changed", onBlocked);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("axentyc:billing-blocked", onBlocked);
      window.removeEventListener("axentyc:billing-changed", onBlocked);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const value = useMemo<BillingContextType>(
    () => ({
      subscription,
      access: subscription?.access ?? null,
      isLoading,
      // Until the plan is known, do not hide anything
      can: (feature) => (subscription ? !!subscription.plan.features[feature] : true),
      refresh,
    }),
    [subscription, isLoading, refresh],
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) throw new Error("useBilling must be used within a BillingProvider");
  return context;
}
