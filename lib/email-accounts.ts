/** Shared types and helpers for the multi-mailbox email feature. */

export type EmailAccountStatus = "connected" | "disconnected" | "error";

export interface EmailAccount {
  _id: string;
  workspaceId?: string;
  label: string;
  emailAddress: string;
  isDefault: boolean;
  status: EmailAccountStatus;
  lastTestAt?: string;
  lastSyncAt?: string;
  lastError?: string | null;
  connectedAt?: string;
  unreadCount?: number;
  smtp: { host?: string; port?: number; secure?: boolean; user?: string; fromName?: string; fromAddress?: string };
  imap: { host?: string; port?: number; secure?: boolean; user?: string };
}

export interface ProviderPreset {
  key: string;
  name: string;
  domains: string[];
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  hint?: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    key: "gmail", name: "Gmail / Google Workspace", domains: ["gmail.com", "googlemail.com"],
    smtpHost: "smtp.gmail.com", smtpPort: 587, smtpSecure: false,
    imapHost: "imap.gmail.com", imapPort: 993, imapSecure: true,
    hint: "Requiere verificación en 2 pasos y una contraseña de aplicación (no tu contraseña normal).",
  },
  {
    key: "outlook", name: "Outlook / Microsoft 365", domains: ["outlook.com", "hotmail.com", "live.com", "office365.com"],
    smtpHost: "smtp.office365.com", smtpPort: 587, smtpSecure: false,
    imapHost: "outlook.office365.com", imapPort: 993, imapSecure: true,
    hint: "Microsoft 365 debe tener habilitado SMTP autenticado e IMAP para el buzón.",
  },
  {
    key: "yahoo", name: "Yahoo Mail", domains: ["yahoo.com", "ymail.com"],
    smtpHost: "smtp.mail.yahoo.com", smtpPort: 465, smtpSecure: true,
    imapHost: "imap.mail.yahoo.com", imapPort: 993, imapSecure: true,
    hint: "Genera una contraseña de aplicación en la seguridad de tu cuenta Yahoo.",
  },
  {
    key: "icloud", name: "iCloud Mail", domains: ["icloud.com", "me.com"],
    smtpHost: "smtp.mail.me.com", smtpPort: 587, smtpSecure: false,
    imapHost: "imap.mail.me.com", imapPort: 993, imapSecure: true,
    hint: "Usa una contraseña específica de app generada en appleid.apple.com.",
  },
  {
    key: "zoho", name: "Zoho Mail", domains: ["zoho.com", "zohomail.com"],
    smtpHost: "smtp.zoho.com", smtpPort: 465, smtpSecure: true,
    imapHost: "imap.zoho.com", imapPort: 993, imapSecure: true,
  },
  {
    key: "custom", name: "Otro proveedor (manual)", domains: [],
    smtpHost: "", smtpPort: 587, smtpSecure: false,
    imapHost: "", imapPort: 993, imapSecure: true,
  },
];

export function detectPreset(email: string): ProviderPreset | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  return PROVIDER_PRESETS.find((p) => p.domains.includes(domain)) || null;
}

// Stable colour per mailbox so users can tell accounts apart at a glance
const ACCOUNT_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6"];

export function accountColor(id: string | undefined): string {
  if (!id) return "#94a3b8";
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return ACCOUNT_COLORS[hash % ACCOUNT_COLORS.length];
}

export function unwrap<T = any>(res: any): T {
  return (res?.data ?? res) as T;
}
