import { API_ENDPOINTS } from '@/config/api';
import { api } from './api';

export interface Workspace {
  _id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  logoUrl?: string;
  businessEmail?: string;
  phone?: string;
  website?: string;
  industry?: string;
  currency?: string;
  timezone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  taxSettings?: {
    taxId?: string;
    taxName?: string;
    taxRate?: number;
    taxIncluded?: boolean;
  };
  documentSettings?: {
    quoteTerms?: string;
    invoiceTerms?: string;
    paymentTerms?: string;
    footerNote?: string;
    language?: string;
    invoicePrefix?: string;
    quotePrefix?: string;
    paymentDays?: string;
  };
  businessHours?: Record<string, any>;
  type: 'default' | 'brand' | 'client' | 'branch';
  isActive: boolean;
}

export const WorkspaceService = {
  list: () => api.get<Workspace[]>(API_ENDPOINTS.workspaces.list),
  create: (data: Partial<Workspace>) => api.post<Workspace>(API_ENDPOINTS.workspaces.create, data),
  update: (id: string, data: Partial<Workspace>) => api.patch<Workspace>(API_ENDPOINTS.workspaces.update(id), data),
  remove: (id: string) => api.delete<void>(API_ENDPOINTS.workspaces.delete(id)),
  myAccess: () => api.get(API_ENDPOINTS.memberships.myWorkspaces),
};
