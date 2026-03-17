function safeUrl(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  try {
    const u = new URL(raw);
    // If host exists but missing port and raw ends with ':' (malformed), fallback
    if (!u.host || /:\s*$/.test(raw)) return fallback;
    return raw;
  } catch {
    return fallback;
  }
}

const DEFAULT_API_URL = 'http://localhost:3003/api/v1';
export const API_URL = safeUrl(process.env.NEXT_PUBLIC_API_URL, DEFAULT_API_URL);

const derivedWs = API_URL.replace(/\/api\/v1\/?$/, '');
export const WS_URL = safeUrl(process.env.NEXT_PUBLIC_WS_URL, derivedWs);

export const API_ENDPOINTS = {
  upload: `${API_URL}/upload`,
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
    bulkDelete: `${API_URL}/contacts/bulk-delete`,
  },
  leads: {
    list: `${API_URL}/leads`,
    create: `${API_URL}/leads`,
    detail: (id: string) => `${API_URL}/leads/${id}`,
    update: (id: string) => `${API_URL}/leads/${id}`,
    delete: (id: string) => `${API_URL}/leads/${id}`,
    bulkDelete: `${API_URL}/leads/bulk-delete`,
    convert: (id: string) => `${API_URL}/leads/${id}/convert`,
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
  integrations: {
    email: {
      test: `${API_URL}/integrations/email/test`,
      testSmtp: `${API_URL}/integrations/email/test-smtp`,
      testImap: `${API_URL}/integrations/email/test-imap`,
      connect: `${API_URL}/integrations/email/connect`,
      status: `${API_URL}/integrations/email/status`,
      disconnect: `${API_URL}/integrations/email/disconnect`,
      debug: `${API_URL}/integrations/email/debug`,
    },
    facebook: {
      config: `${API_URL}/integrations/facebook/config`,
      oauthUrl: `${API_URL}/integrations/facebook/oauth-url`,
      exchangeToken: `${API_URL}/integrations/facebook/exchange-token`,
      connectPage: `${API_URL}/integrations/facebook/connect-page`,
      status: `${API_URL}/integrations/facebook/status`,
      disconnect: (id: string) => `${API_URL}/integrations/facebook/disconnect/${id}`,
    },
  },
  emails: {
    list: `${API_URL}/emails`,
    get: (id: string) => `${API_URL}/emails/${id}`,
    send: `${API_URL}/emails/send`,
    sync: `${API_URL}/emails/sync`,
    folders: `${API_URL}/emails/folders`,
    unreadCount: `${API_URL}/emails/unread-count`,
    markRead: (id: string) => `${API_URL}/emails/${id}/read`,
    delete: (id: string) => `${API_URL}/emails/${id}`,
    bulkDelete: `${API_URL}/emails/bulk-delete`,
    purge: `${API_URL}/emails/purge`,
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
