"use client";

import { useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Building2, CalendarClock, CheckCircle2, CheckSquare, Handshake, Inbox, MessageSquare, Plug, Receipt, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { API_URL } from "@/config/api";
import { fmtDate, money, moneyUnits, unwrap } from "@/lib/crm";
import { useAuth } from "@/contexts/AuthContext";
import { useBilling } from "@/contexts/BillingContext";
import { useWorkspaces } from "@/contexts/WorkspaceContext";

interface ConvItem {
  _id: string;
  channel: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  contactId?: { name?: string } | null;
}

interface Summary {
  unread: { conversations: number; messages: number; items: ConvItem[] };
  tasks: { today: number; overdue: number; mine: { _id: string; title: string; dueAt?: string; priority: string }[] };
  week: { leads: number; contacts: number };
  openDeals: { currency: string; count: number; value: number }[];
  invoices: { currency: string; count: number; outstandingCents: number; overdueCount: number }[];
  recent: ConvItem[];
}

const CHANNEL: Record<string, string> = { facebook: "Facebook", instagram: "Instagram", web_chat: "Chat web", email: "Email", whatsapp: "WhatsApp" };

function Kpi({ href, icon: Icon, label, value, hint, tone = "primary" }: { href: string; icon: any; label: string; value: string; hint?: string; tone?: "primary" | "danger" | "success" | "warning" }) {
  const tones = { primary: "bg-primary/10 text-primary", danger: "bg-danger/10 text-danger", success: "bg-success/10 text-success", warning: "bg-warning/10 text-warning" };
  return (
    <NextLink href={href}>
      <Card className="h-full border border-divider transition hover:border-primary/40">
        <CardBody className="gap-2 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-default-500">{label}</p>
            <div className={`rounded-lg p-1.5 ${tones[tone]}`}><Icon size={16} /></div>
          </div>
          <p className="text-2xl font-black tabular-nums">{value}</p>
          {hint && <p className="text-xs text-default-400">{hint}</p>}
        </CardBody>
      </Card>
    </NextLink>
  );
}

function ConvRow({ c }: { c: ConvItem }) {
  return (
    <NextLink href="/contact-center">
      <div className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-content2/60">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{c.contactId?.name || "Cliente"}</p>
          <p className="truncate text-xs text-default-500">{c.lastMessage || "—"}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Chip size="sm" variant="flat">{CHANNEL[c.channel] || c.channel}</Chip>
          {c.unreadCount ? <span className="rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">{c.unreadCount}</span> : <span className="text-[11px] text-default-400">{fmtDate(c.lastMessageAt, true)}</span>}
        </div>
      </div>
    </NextLink>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { can, subscription } = useBilling();
  const { activeWorkspace, activeWorkspaceId } = useWorkspaces();
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setData(unwrap<Summary>(await api.get(`${API_URL}/reports/dashboard`)));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load, activeWorkspaceId]);

  const channels = subscription?.usage.connectedAssets.total ?? 0;
  const cur = (activeWorkspace?.currency || "USD").toUpperCase();
  const inv = data?.invoices.find((i) => i.currency === cur) || data?.invoices[0];
  const deals = data?.openDeals.find((d) => d.currency === cur) || data?.openDeals[0];
  const greeting = new Date().getHours() < 12 ? "Buenos días" : new Date().getHours() < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-6" initial={{ opacity: 0, y: 20 }}>
      <section className="relative overflow-hidden rounded-3xl border border-divider bg-gradient-to-br from-primary/15 via-content1 to-secondary/10 p-6 md:p-8">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <Chip color="primary" startContent={<Building2 size={14} />} variant="flat">{activeWorkspace?.name}</Chip>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">{greeting}{user?.firstName ? `, ${user.firstName}` : ""}</h1>
            <p className="mt-1 text-sm text-default-500">Esto es lo que necesita tu atención hoy.</p>
          </div>
          {subscription && <Chip variant="flat">Plan {subscription.plan.name}</Chip>}
        </div>
      </section>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Spinner size="lg" /></div>
      ) : !data ? (
        <Card className="border border-divider"><CardBody className="p-8 text-center text-sm text-default-500">No pudimos cargar el resumen. Intenta recargar la página.</CardBody></Card>
      ) : (
        <>
          {channels === 0 && (
            <Card className="border border-primary/30 bg-primary/5">
              <CardBody className="flex-row flex-wrap items-center justify-between gap-3 p-5">
                <div className="flex items-center gap-3">
                  <Plug className="text-primary" size={22} />
                  <div>
                    <p className="font-bold">Conecta tu primer canal</p>
                    <p className="text-sm text-default-500">Facebook, Instagram, email o el chat de tu web: los mensajes aparecerán aquí.</p>
                  </div>
                </div>
                <NextLink className="inline-flex items-center gap-1 text-sm font-semibold text-primary" href="/integrations">Ir a Integraciones <ArrowRight size={14} /></NextLink>
              </CardBody>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi hint={`${data.unread.conversations} conversaciones`} href="/contact-center" icon={MessageSquare} label="Mensajes sin leer" tone={data.unread.messages > 0 ? "danger" : "success"} value={String(data.unread.messages)} />
            <Kpi hint={data.tasks.overdue ? `${data.tasks.overdue} vencidas` : "Sin vencidas"} href="/tasks" icon={CalendarClock} label="Tareas para hoy" tone={data.tasks.overdue ? "warning" : "primary"} value={String(data.tasks.today)} />
            <Kpi hint={`${data.week.contacts} contactos nuevos`} href="/leads" icon={UserPlus} label="Leads (7 días)" value={String(data.week.leads)} />
            {can("invoicing") ? (
              <Kpi hint={inv ? `${inv.count} facturas${inv.overdueCount ? ` · ${inv.overdueCount} atrasadas` : ""}` : "Nada pendiente"} href="/invoices" icon={Receipt} label="Por cobrar" tone={inv?.overdueCount ? "danger" : "primary"} value={money(inv?.outstandingCents || 0, inv?.currency || cur)} />
            ) : can("deals") ? (
              <Kpi hint={`${deals?.count || 0} oportunidades`} href="/deals" icon={Handshake} label="Pipeline abierto" value={moneyUnits(deals?.value || 0, deals?.currency || cur)} />
            ) : (
              <Kpi href="/contacts" icon={UserPlus} label="Contactos nuevos (7 días)" value={String(data.week.contacts)} />
            )}
          </div>

          {can("invoicing") && can("deals") && deals && (
            <p className="text-sm text-default-500">
              Pipeline abierto: <b>{moneyUnits(deals.value, deals.currency)}</b> en {deals.count} oportunidades. <NextLink className="text-primary" href="/deals">Ver deals</NextLink>
            </p>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border border-divider">
              <CardBody className="p-0">
                <div className="flex items-center justify-between px-4 pt-4"><h2 className="text-base font-bold">Esperan tu respuesta</h2><NextLink className="text-xs font-semibold text-primary" href="/contact-center">Abrir bandeja</NextLink></div>
                <div className="divide-y divide-divider pt-2">
                  {data.unread.items.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 p-8 text-center text-default-500"><CheckCircle2 className="text-success" size={26} /><p className="text-sm">Estás al día. No hay mensajes sin responder.</p></div>
                  ) : data.unread.items.map((c) => <ConvRow key={c._id} c={c} />)}
                </div>
              </CardBody>
            </Card>

            <Card className="border border-divider">
              <CardBody className="p-0">
                <div className="flex items-center justify-between px-4 pt-4"><h2 className="text-base font-bold">Mis tareas</h2><NextLink className="text-xs font-semibold text-primary" href="/tasks">Ver todas</NextLink></div>
                <div className="divide-y divide-divider pt-2">
                  {data.tasks.mine.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 p-8 text-center text-default-500"><CheckSquare className="opacity-50" size={26} /><p className="text-sm">No tienes tareas pendientes.</p></div>
                  ) : data.tasks.mine.map((t) => {
                    const late = t.dueAt && new Date(t.dueAt).getTime() < Date.now();
                    return (
                      <NextLink key={t._id} href="/tasks">
                        <div className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-content2/60">
                          <p className="truncate text-sm font-medium">{t.title}</p>
                          {t.dueAt && <span className={`shrink-0 text-xs ${late ? "inline-flex items-center gap-1 font-semibold text-danger" : "text-default-500"}`}>{late && <AlertTriangle size={12} />}{fmtDate(t.dueAt, true)}</span>}
                        </div>
                      </NextLink>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </div>

          <Card className="border border-divider">
            <CardBody className="p-0">
              <div className="flex items-center gap-2 px-4 pt-4"><Inbox className="text-default-400" size={16} /><h2 className="text-base font-bold">Actividad reciente</h2></div>
              <div className="divide-y divide-divider pt-2">
                {data.recent.length === 0 ? <p className="p-8 text-center text-sm text-default-500">Todavía no hay conversaciones.</p> : data.recent.map((c) => <ConvRow key={c._id} c={c} />)}
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </motion.div>
  );
}
