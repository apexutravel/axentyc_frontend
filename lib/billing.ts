import { API_ENDPOINTS } from '@/config/api';
import { api } from './api';

export type BillingCycle = 'monthly' | 'yearly';

export interface PlanLimits {
  maxUsers: number;
  maxWorkspaces: number;
  maxConnectedAssets: number;
  maxAutomations: number;
  maxConversationsMonthly: number;
}

export interface PlanFeatures {
  invoicing: boolean;
  deals: boolean;
  teamRoles: boolean;
  removeBranding: boolean;
  prioritySupport: boolean;
}

export interface PlanDefinition {
  key: string;
  name: string;
  tagline: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
  limits: PlanLimits;
  features: PlanFeatures;
  highlights: string[];
  recommended?: boolean;
}

export type AccessState =
  | 'free'
  | 'trialing'
  | 'trial_expired'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'locked';

export interface AccessInfo {
  state: AccessState;
  readOnly: boolean;
  paymentRequired: boolean;
  trialEndsAt?: string;
  trialDaysLeft?: number;
  graceEndsAt?: string;
  endsAt?: string;
}

export interface Usage {
  users: number;
  workspaces: number;
  connectedAssets: { total: number; socialAccounts: number; emailIntegrations: number; widgets: number };
  automations: number;
  conversationsThisMonth: number;
}

export interface SubscriptionInfo {
  tenantId: string;
  plan: PlanDefinition;
  subscription: {
    planKey: string;
    status: string;
    billingCycle?: BillingCycle;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd: boolean;
    provider?: string;
    complimentary: boolean;
    hasPaymentMethod: boolean;
  } | null;
  access: AccessInfo;
  isReadOnly: boolean;
  usage: Usage;
}

export interface PaymentConfig {
  provider: 'stripe' | 'none';
  paymentsEnabled: boolean;
  devSelfActivation: boolean;
  currency: string;
}

export type ChangePlanResult =
  | { action: 'checkout'; url: string }
  | { action: 'updated'; message: string }
  | { action: 'scheduled_cancel'; message: string };

/** -1 means unlimited */
export const UNLIMITED = -1;
export const formatLimit = (value: number) => (value === UNLIMITED ? 'Ilimitado' : value.toLocaleString('en-US'));

export const BillingService = {
  plans: () => api.get<PlanDefinition[]>(API_ENDPOINTS.billing.plans, { skipAuth: true, skipWorkspace: true }),
  subscription: () => api.get<SubscriptionInfo>(API_ENDPOINTS.billing.subscription, { skipWorkspace: true }),
  paymentConfig: () => api.get<PaymentConfig>(API_ENDPOINTS.billing.paymentConfig, { skipWorkspace: true }),
  changePlan: (planKey: string, billingCycle: BillingCycle) =>
    api.post<ChangePlanResult>(API_ENDPOINTS.billing.changePlan, { planKey, billingCycle }, { skipWorkspace: true }),
  portal: () => api.post<{ url: string }>(API_ENDPOINTS.billing.portal, undefined, { skipWorkspace: true }),
  cancel: () => api.post(API_ENDPOINTS.billing.cancel, undefined, { skipWorkspace: true }),
  reactivate: () => api.post(API_ENDPOINTS.billing.reactivate, undefined, { skipWorkspace: true }),
};
