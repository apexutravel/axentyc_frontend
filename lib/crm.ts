import { API_URL } from "@/config/api";

/** The API wraps payloads as { data }. */
export const unwrap = <T = any>(res: any): T => (res?.data ?? res) as T;

export const errorMessage = (e: any, fallback: string): string => e?.response?.data?.message || e?.message || fallback;

export const money = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);

export const moneyUnits = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount || 0);

/** "12.5" / "12,50" -> 1250 cents. Returns null when it is not a valid non-negative amount. */
export const toCents = (input: string | number): number | null => {
  const n = typeof input === "number" ? input : Number(String(input).replace(/,/g, ".").trim());
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
};

export const fromCents = (cents: number) => (cents / 100).toFixed(2);

export const fmtDate = (iso?: string | Date | null, withTime = false) =>
  iso
    ? new Date(iso).toLocaleString("es", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" })
    : "-";

export const activeWorkspaceId = (): string | null =>
  typeof window === "undefined" ? null : window.localStorage.getItem("axentyc.activeWorkspaceId");

/** Authenticated file download (PDF / CSV). Plain fetch because the body is not JSON. */
export async function download(path: string, fallbackName: string): Promise<void> {
  const ws = activeWorkspaceId();
  const url = `${API_URL}${path}${path.includes("?") ? "&" : "?"}workspaceId=${ws || ""}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Error ${res.status}`);
  }
  const disposition = res.headers.get("content-disposition") || "";
  const name = /filename="?([^";]+)"?/i.exec(disposition)?.[1] || fallbackName;
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  dueAt?: string;
  status: "open" | "done";
  priority: "low" | "medium" | "high";
  assignedTo?: { _id: string; firstName?: string; lastName?: string } | string;
  contactId?: { _id: string; name: string; avatar?: string } | string;
  source?: string;
}

export interface Note {
  _id: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  authorId?: { firstName?: string; lastName?: string };
}

export interface TimelineItem {
  type: "note" | "task" | "conversation" | "lead" | "deal" | "quote" | "invoice" | "payment";
  at: string;
  title: string;
  detail?: string;
  refId: string;
}

export interface SalesLine {
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountPct?: number;
  taxable: boolean;
  amountCents: number;
  productId?: string;
}

export interface SalesPayment {
  _id: string;
  amountCents: number;
  method: string;
  date: string;
  reference?: string;
  note?: string;
}

export interface SalesDoc {
  _id: string;
  type: "quote" | "invoice";
  number: string;
  status: string;
  displayStatus: string;
  contactId: { _id: string; name: string; company?: string; email?: string; phone?: string } | string;
  dealId?: string;
  convertedToId?: string;
  sourceQuoteId?: string;
  issueDate: string;
  dueDate?: string;
  currency: string;
  language: "es" | "en";
  lines: SalesLine[];
  discountPct: number;
  taxRatePct: number;
  taxName?: string;
  taxIncluded: boolean;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  amountPaidCents: number;
  balanceCents: number;
  payments: SalesPayment[];
  notes?: string;
  terms?: string;
  sentAt?: string;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  sku?: string;
  unitPriceCents: number;
  taxable: boolean;
  isActive: boolean;
}

export const PAYMENT_METHODS: Record<string, string> = {
  zelle: "Zelle",
  cash: "Efectivo",
  transfer: "Transferencia",
  check: "Cheque",
  card: "Tarjeta",
  paypal: "PayPal",
  other: "Otro",
};

export const DOC_STATUS: Record<string, { label: string; color: "default" | "primary" | "success" | "warning" | "danger" | "secondary" }> = {
  draft: { label: "Borrador", color: "default" },
  sent: { label: "Enviada", color: "primary" },
  accepted: { label: "Aceptada", color: "success" },
  rejected: { label: "Rechazada", color: "danger" },
  expired: { label: "Vencida", color: "warning" },
  partial: { label: "Pago parcial", color: "secondary" },
  paid: { label: "Pagada", color: "success" },
  overdue: { label: "Atrasada", color: "danger" },
  void: { label: "Anulada", color: "default" },
};

/** Minimal RFC-4180 CSV parser (quotes, escaped quotes, CRLF, BOM). Delimiter `,` or `;` is auto-detected. */
export function parseCsv(text: string): Record<string, string>[] {
  const src = text.replace(/^\uFEFF/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] || "";
  const delimiter = (firstLine.match(/;/g)?.length || 0) > (firstLine.match(/,/g)?.length || 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  if (rows.length < 2) return [];

  const ALIASES: Record<string, string> = {
    nombre: "name", name: "name", correo: "email", email: "email", "e-mail": "email",
    telefono: "phone", "teléfono": "phone", celular: "phone", phone: "phone",
    empresa: "company", company: "company", etiquetas: "tags", tags: "tags", notas: "notes", notes: "notes",
  };
  const keys = rows[0].map((h) => ALIASES[h.trim().toLowerCase()] || "");
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    keys.forEach((k, i) => { if (k && r[i] !== undefined) obj[k] = r[i].trim(); });
    return obj;
  });
}

export interface EditorLine {
  description: string;
  quantity: string;
  price: string; // dollars, as typed
  discountPct: string;
  taxable: boolean;
  productId?: string;
}

/** Client preview of the totals. Mirrors backend `computeTotals` so what you see is what is stored. */
export function previewTotals(lines: EditorLine[], opts: { discountPct: number; taxRatePct: number; taxIncluded: boolean }) {
  let subtotal = 0;
  let taxableNet = 0;
  for (const l of lines) {
    const qty = Number(l.quantity);
    const price = toCents(l.price);
    const disc = Math.min(100, Math.max(0, Number(l.discountPct) || 0));
    if (!Number.isFinite(qty) || qty <= 0 || price === null) continue;
    const gross = Math.round(qty * price);
    const net = gross - Math.round((gross * disc) / 100);
    subtotal += net;
    if (l.taxable) taxableNet += net;
  }
  const discountCents = Math.round((subtotal * opts.discountPct) / 100);
  const base = taxableNet - Math.round((taxableNet * opts.discountPct) / 100);
  const taxCents = opts.taxIncluded ? base - Math.round(base / (1 + opts.taxRatePct / 100)) : Math.round((base * opts.taxRatePct) / 100);
  const totalCents = opts.taxIncluded ? subtotal - discountCents : subtotal - discountCents + taxCents;
  return { subtotalCents: subtotal, discountCents, taxCents, totalCents };
}
