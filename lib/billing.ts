import { API_ENDPOINTS } from '@/config/api';
import { api } from './api';

export interface PlanLimits {
  maxUsers: number;
  maxWorkspaces: number;
  maxConnectedAssets: number;
  maxSocialAccounts: number;
  maxEmailIntegrations: number;
  maxWidgets: number;
  maxConversationsMonthly: number;
  automationsEnabled: boolean;
  teamRolesEnabled: boolean;
  whiteLabelEnabled: boolean;
}

export interface PlanDefinition {
  key: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
  limits: PlanLimits;
  features: string[];
  recommended?: boolean;
}

export const BillingService = {
  plans: () => api.get<PlanDefinition[]>(API_ENDPOINTS.billing.plans, { skipAuth: true, skipWorkspace: true }),
  subscription: () => api.get(API_ENDPOINTS.billing.subscription, { skipWorkspace: true }),
  changePlan: (planKey: string, billingCycle: 'monthly' | 'yearly') =>
    api.post(API_ENDPOINTS.billing.changePlan, { planKey, billingCycle }, { skipWorkspace: true }),
  cancel: () => api.post(API_ENDPOINTS.billing.cancel, undefined, { skipWorkspace: true }),
  reactivate: () => api.post(API_ENDPOINTS.billing.reactivate, undefined, { skipWorkspace: true }),
};
