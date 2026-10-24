"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock, DollarSign, MessageSquare, Target, TrendingUp, Users } from "lucide-react";
import { api } from "@/lib/api";
import { API_URL } from "@/config/api";
import { errorMessage, money, moneyUnits, unwrap } from "@/lib/crm";
import { useWorkspaces } from "@/contexts/WorkspaceContext";
import { useBilling } from "@/contexts/BillingContext";

interface Overview {
  range: { from: string; to: string };
  conversations: { total: number; byChannel: { channel: string; count: number }[]; daily: { date: string; count: number }[] };
  response: { measured: number; answered: number; answerRate: number; avgMinutes: number; medianMinutes: number; humanAvgMinutes: number };
  agents: { userId: string; name: string; replies: number; conversations: number }[];
  funnel: {
    contacts: number; leads: number; leadsByStatus: Record<string, number>; leadConversionRate: number; dealsCreated: number;
    dealsWon: { currency: string; count: number; value: number }[]; openPipeline: { currency: string; count: number; value: number }[];
  };
  sales: { currency: string; invoicedCents: number; invoices: number; collectedCents: number; outstandingCents: number; overdueCents: number; monthly: { month: string; amountCents: number }[] }[];
}

const CHANNELS: Record<string, { label: string; color: string }> = {
  facebook: { label: "Facebook", color: "#1877f2" },
  instagram: { label: "Instagram", color: "#e1306c" },
  web_chat: { label: "Widget web", color: "#7c3aed" },
  whatsapp: { label: "WhatsApp", color: "#25d366" },
  email: { label: "Email", color: "#f59e0b" },
  tiktok: { label: "TikTok", color: "#111827" },
};

const fmtMinutes = (m: number) => {
  if (!m) return "-";
  if (m < 1) return "< 1 min";
  if (m < 60) return `${Math.round(m)} min`;
  const h = m / 60;
  return h < 24 ? `${h.toFixed(1)} h` : `${(h / 24).toFixed(1)} d`;
};

function Metric({ icon: Icon, label, value, hint, tone = "primary" }: { icon: any; label: string; value: string; hint?: string; tone?: "primary" | "success" | "warning" | "danger" }) {
  const tones = { primary: "bg-primary/10 text-primary", success: "bg-success/10 text-success", warning: "bg-warning/10 text-warning", danger: "bg-danger/10 text-danger" };
  return (
    <Card className="border border-divider">
      <CardBody className="gap-2 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-default-500">{label}</p>
          <div className={`rounded-lg p-1.5 ${tones[tone]}`}><Icon size={16} /></div>
        </div>
        <p className="text-2xl font-black tabular-nums">{value}</p>
        {hint && <p className="text-xs text-default-400">{hint}</p>}
      </CardBody>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { activeWorkspace } = useWorkspaces();
  const { can } = useBilling();
  const [days, setDays] = useState("30");
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const to = new Date();
      const from = new Date(to.getTime() - Number(days) * 86400000);
      setData(unwrap<Overview>(await api.get(`${API_URL}/reports/overview?from=${from.toISOString()}&to=${to.toISOString()}`)));
    } catch (e) {
      toast.error(errorMessage(e, "No se pudieron cargar los reportes"));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const daily = useMemo(() => (data?.conversations.daily || []).map((d) => ({ ...d, label: d.date.slice(5) })), [data]);
  const sales = data?.sales[0];
  const cur = sales?.currency || (activeWorkspace?.currency || "USD").toUpperCase();
  const won = data?.funnel.dealsWon[0];
  const pipeline = data?.funnel.openPipeline[0];

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-6" initial={{ opacity: 0, y: 20 }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="mt-1 text-sm text-default-500">Cómo atiendes y cuánto vendes en {activeWorkspace?.name || "tu empresa"}.</p>
        </div>
        <Tabs radius="full" selectedKey={days} size="sm" variant="light" onSelectionChange={(k) => setDays(String(k))}>
          <Tab key="7" title="7 días" />
          <Tab key="30" title="30 días" />
          <Tab key="90" title="90 días" />
          <Tab key="365" title="1 año" />
        </Tabs>
      </div>

      {loading || !data ? (
        <div className="flex h-60 items-center justify-center"><Spinner size="lg" /></div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-default-500">Atención al cliente</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Metric icon={MessageSquare} label="Conversaciones nuevas" value={String(data.conversations.total)} />
              <Metric hint={data.response.answered ? `Mediana ${fmtMinutes(data.response.medianMinutes)}` : "Sin respuestas aún"} icon={Clock} label="Primera respuesta (promedio)" tone={data.response.avgMinutes > 60 ? "warning" : "success"} value={fmtMinutes(data.response.avgMinutes)} />
              <Metric hint={`${data.response.answered} de ${data.response.measured} conversaciones`} icon={TrendingUp} label="Conversaciones respondidas" tone={data.response.answerRate < 80 && data.response.measured > 0 ? "danger" : "success"} value={`${data.response.answerRate}%`} />
              <Metric hint="Solo respuestas de personas (sin automatizaciones)" icon={Users} label="Primera respuesta humana" value={fmtMinutes(data.response.humanAvgMinutes)} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="border border-divider lg:col-span-2">
                <CardBody className="gap-3 p-5">
                  <p className="text-sm font-bold">Conversaciones por día</p>
                  {daily.length === 0 ? <p className="py-10 text-center text-sm text-default-500">Sin conversaciones en este período.</p> : (
                    <div className="h-56">
                      <ResponsiveContainer height="100%" width="100%">
                        <BarChart data={daily}>
                          <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                          <XAxis dataKey="label" fontSize={11} tickLine={false} />
                          <YAxis allowDecimals={false} fontSize={11} tickLine={false} width={28} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#2563eb" name="Conversaciones" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardBody>
              </Card>
              <Card className="border border-divider">
                <CardBody className="gap-3 p-5">
                  <p className="text-sm font-bold">Por canal</p>
                  {data.conversations.byChannel.length === 0 ? <p className="py-10 text-center text-sm text-default-500">Sin datos.</p> : (
                    <ul className="space-y-3">
                      {data.conversations.byChannel.map((c) => {
                        const meta = CHANNELS[c.channel] || { label: c.channel, color: "#64748b" };
                        const pct = data.conversations.total ? Math.round((c.count / data.conversations.total) * 100) : 0;
                        return (
                          <li key={c.channel}>
                            <div className="mb-1 flex justify-between text-xs"><span className="font-medium">{meta.label}</span><span className="text-default-500">{c.count} · {pct}%</span></div>
                            <div className="h-2 overflow-hidden rounded-full bg-default-100"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta.color }} /></div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </div>

            {data.agents.length > 0 && (
              <Card className="border border-divider">
                <CardBody className="gap-3 p-5">
                  <p className="text-sm font-bold">Respuestas por agente</p>
                  <table className="w-full text-sm">
                    <thead className="text-xs text-default-500"><tr><th className="py-1 text-left">Agente</th><th className="py-1 text-right">Respuestas</th><th className="py-1 text-right">Conversaciones</th></tr></thead>
                    <tbody>{data.agents.map((a) => <tr key={a.userId} className="border-t border-divider"><td className="py-2">{a.name}</td><td className="py-2 text-right tabular-nums">{a.replies}</td><td className="py-2 text-right tabular-nums">{a.conversations}</td></tr>)}</tbody>
                  </table>
                </CardBody>
              </Card>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-default-500">Embudo de ventas</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Metric icon={Users} label="Contactos nuevos" value={String(data.funnel.contacts)} />
              <Metric hint={`${data.funnel.leadConversionRate}% convertidos`} icon={Target} label="Leads nuevos" value={String(data.funnel.leads)} />
              <Metric hint={can("deals") ? `${data.funnel.dealsCreated} deals creados` : "Pipeline disponible en Pro"} icon={TrendingUp} label="Deals ganados" tone="success" value={won ? `${won.count} · ${moneyUnits(won.value, won.currency)}` : "0"} />
              <Metric icon={DollarSign} label="Pipeline abierto" value={pipeline ? `${moneyUnits(pipeline.value, pipeline.currency)}` : "$0"} hint={pipeline ? `${pipeline.count} oportunidades` : undefined} />
            </div>
          </section>

          {can("invoicing") && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-default-500">Facturación</h2>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Metric hint={`${sales?.invoices || 0} facturas`} icon={DollarSign} label="Facturado" value={money(sales?.invoicedCents || 0, cur)} />
                <Metric icon={DollarSign} label="Cobrado" tone="success" value={money(sales?.collectedCents || 0, cur)} />
                <Metric icon={Clock} label="Por cobrar" tone="warning" value={money(sales?.outstandingCents || 0, cur)} />
                <Metric icon={Clock} label="Atrasado" tone="danger" value={money(sales?.overdueCents || 0, cur)} />
              </div>
              {sales && sales.monthly.length > 0 && (
                <Card className="border border-divider">
                  <CardBody className="gap-3 p-5">
                    <p className="text-sm font-bold">Cobros por mes</p>
                    <div className="h-52">
                      <ResponsiveContainer height="100%" width="100%">
                        <BarChart data={sales.monthly.map((m) => ({ month: m.month, amount: m.amountCents / 100 }))}>
                          <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                          <XAxis dataKey="month" fontSize={11} tickLine={false} />
                          <YAxis fontSize={11} tickFormatter={(v) => `$${v}`} tickLine={false} width={52} />
                          <Tooltip formatter={(v) => moneyUnits(Number(v), cur)} />
                          <Bar dataKey="amount" name="Cobrado" radius={[4, 4, 0, 0]}>
                            {sales.monthly.map((_, i) => <Cell key={i} fill="#16a34a" />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardBody>
                </Card>
              )}
              {data.sales.length > 1 && <Chip color="warning" size="sm" variant="flat">Tienes documentos en varias monedas; se muestra {cur}.</Chip>}
            </section>
          )}
        </>
      )}
    </motion.div>
  );
}
