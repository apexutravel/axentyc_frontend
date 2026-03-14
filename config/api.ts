export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  auth: {
    login: `${API_URL}/auth/login`,
    register: `${API_URL}/auth/register`,
    profile: `${API_URL}/auth/profile`,
    refresh: `${API_URL}/auth/refresh`,
    logout: `${API_URL}/auth/logout`,
  },
  widget: {
    get: `${API_URL}/chat-widget`,
    save: `${API_URL}/chat-widget/save`,
    script: `${API_URL}/chat-widget/script`,
    regenerate: `${API_URL}/chat-widget/regenerate`,
    publicConfig: (widgetId: string) => `${API_URL}/chat-widget/config/${widgetId}`,
    sendMessage: `${API_URL}/chat-widget/message`,
    messages: (widgetId: string) => `${API_URL}/chat-widget/messages/${widgetId}`,
  },
  conversations: {
    list: `${API_URL}/conversations`,
    detail: (id: string) => `${API_URL}/conversations/${id}`,
    messages: (id: string) => `${API_URL}/conversations/${id}/messages`,
    markRead: (id: string) => `${API_URL}/conversations/${id}/read`,
    delete: (id: string) => `${API_URL}/conversations/${id}`,
    update: (id: string) => `${API_URL}/conversations/${id}`,
  },
  contacts: {
    list: `${API_URL}/contacts`,
    create: `${API_URL}/contacts`,
    detail: (id: string) => `${API_URL}/contacts/${id}`,
    update: (id: string) => `${API_URL}/contacts/${id}`,
    delete: (id: string) => `${API_URL}/contacts/${id}`,
  },
  leads: {
    list: `${API_URL}/leads`,
    create: `${API_URL}/leads`,
    detail: (id: string) => `${API_URL}/leads/${id}`,
  },
  deals: {
    list: `${API_URL}/deals`,
    create: `${API_URL}/deals`,
    detail: (id: string) => `${API_URL}/deals/${id}`,
  },
  users: {
    list: `${API_URL}/users`,
    create: `${API_URL}/users`,
    detail: (id: string) => `${API_URL}/users/${id}`,
    update: (id: string) => `${API_URL}/users/${id}`,
    delete: (id: string) => `${API_URL}/users/${id}`,
    changePassword: (id: string) => `${API_URL}/users/${id}/change-password`,
    changeRole: (id: string) => `${API_URL}/users/${id}/role`,
    invite: `${API_URL}/users/invite`,
    invitations: `${API_URL}/users/invitations`,
    cancelInvitation: (id: string) => `${API_URL}/users/invitations/${id}`,
  },
  invitations: {
    verify: (token: string) => `${API_URL}/auth/verify-invite/${token}`,
    accept: `${API_URL}/auth/accept-invite`,
  },
  tenants: {
    current: `${API_URL}/tenants/current`,
    update: (id: string) => `${API_URL}/tenants/${id}`,
  },
  chatWidget: {
    get: `${API_URL}/chat-widget`,
    save: `${API_URL}/chat-widget/save`,
    script: `${API_URL}/chat-widget/script`,
    regenerate: `${API_URL}/chat-widget/regenerate`,
    publicConfig: (widgetId: string) => `${API_URL}/chat-widget/config/${widgetId}`,
    sendMessage: `${API_URL}/chat-widget/message`,
    messages: (widgetId: string) => `${API_URL}/chat-widget/messages/${widgetId}`,
  },
} as const;
