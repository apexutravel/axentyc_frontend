"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Switch } from "@heroui/switch";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Handshake, MessageSquare, Pencil, Plus, Receipt, Trash2, UserPlus, XCircle, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { API_URL } from "@/config/api";
import { errorMessage, fmtDate, unwrap } from "@/lib/crm";
import { useBilling } from "@/contexts/BillingContext";
import { useWorkspaces } from "@/contexts/WorkspaceContext";
import { formatLimit } from "@/lib/billing";

type Trigger = "message.received" | "conversation.created" | "contact.created" | "lead.created" | "deal.stage_changed" | "deal.updated" | "invoice.paid";
type ActionType = "auto_reply" | "assign_agent" | "create_task" | "send_notification" | "add_tag" | "update_status" | "create_lead" | "create_deal" | "send_webhook";

interface ActionDef { type: ActionType; config: Record<string, any> }
interface Automation {
  _id: string;
  name: string;
  description?: string;
  trigger: Trigger;
  conditions?: { channel?: string; keywords?: string[]; tags?: string[]; stage?: string; cooldownMinutes?: number };
  actions: ActionDef[];
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: string;
}
interface Run { _id: string; automationName: string; trigger: string; status: "success" | "partial" | "failed"; createdAt: string; durationMs: number; results: { type: string; ok: boolean; detail?: string }[] }

const TRIGGERS: Record<Trigger, { label: string; icon: any; hint: string }> = {
  "message.received": { label: "Llega un mensaje", icon: MessageSquare, hint: "Cada vez que un cliente escribe: mensaje directo o comentario (Facebook, Instagram) o chat web. La respuesta automática solo aplica a mensajes directos." },
  "conversation.created": { label: "Nueva conversación", icon: MessageSquare, hint: "Cuando un cliente escribe por primera vez" },
  "contact.created": { label: "Contacto nuevo", icon: UserPlus, hint: "Cuando se crea un contacto" },
  "lead.created": { label: "Lead nuevo", icon: UserPlus, hint: "Cuando se crea un lead" },
  "deal.stage_changed": { label: "Deal cambia de etapa", icon: Handshake, hint: "Cuando un deal avanza o retrocede en el pipeline" },
  "deal.updated": { label: "Deal actualizado", icon: Handshake, hint: "Cuando se edita un deal" },
  "invoice.paid": { label: "Factura pagada", icon: Receipt, hint: "Cuando una factura se paga por completo" },
};

const ACTIONS: Record<ActionType, { label: string; needsConversation?: boolean }> = {
  auto_reply: { label: "Responder automáticamente", needsConversation: true },
  create_task: { label: "Crear tarea" },
  add_tag: { label: "Agregar etiqueta" },
  assign_agent: { label: "Asignar a un agente" },
  update_status: { label: "Cambiar estado" },
  create_lead: { label: "Crear lead" },
  create_deal: { label: "Crear deal" },
  send_notification: { label: "Notificar al equipo" },
  send_webhook: { label: "Enviar a un webhook" },
};

const STAGES: Record<string, string> = { new_lead: "Nuevo lead", contacted: "Contactado", proposal: "Propuesta", negotiation: "Negociación", closed_won: "Ganado", closed_lost: "Perdido" };
const CONV_STATUS: Record<string, string> = { open: "Abierta", pending: "Pendiente", assigned: "Asignada", in_progress: "En progreso", resolved: "Resuelta", closed: "Cerrada" };
const LEAD_STATUS: Record<string, string> = { new: "Nuevo", contacted: "Contactado", qualified: "Calificado", unqualified: "No calificado", lost: "Perdido" };
const CHANNELS: Record<string, string> = { any: "Cualquier canal", facebook: "Facebook", instagram: "Instagram", web_chat: "Widget web" };

const defaultConfig = (type: ActionType): Record<string, any> =>
  ({
    auto_reply: { message: "Hola {{contact.firstName}}, gracias por escribirnos. Te respondemos en breve." },
    create_task: { title: "Dar seguimiento a {{contact.name}}", dueInHours: 24 },
    add_tag: { tag: "" },
    assign_agent: { userId: "" },
    update_status: { target: "conversation", status: "in_progress" },
    create_lead: { title: "Lead de {{contact.name}}", estimatedValue: 0 },
    create_deal: { title: "Deal de {{contact.name}}", value: 0 },
    send_notification: { message: "Nueva actividad de {{contact.name}}" },
    send_webhook: { url: "https://" },
  })[type];

const emptyForm = () => ({
  name: "",
  trigger: "message.received" as Trigger,
  channel: "any",
  keywords: "",
  tags: "",
  stage: "any",
  cooldownMinutes: 60,
  actions: [{ type: "auto_reply" as ActionType, config: defaultConfig("auto_reply") }] as ActionDef[],
});

function describeAction(a: ActionDef): string {
  const c = a.config || {};
  switch (a.type) {
    case "auto_reply": return `Responder: “${String(c.message || "").slice(0, 50)}”`;
    case "create_task": return `Tarea: ${c.title}`;
    case "add_tag": return `Etiqueta: ${c.tag}`;
    case "update_status": return `Estado → ${c.status}`;
    case "create_lead": return "Crear lead";
    case "create_deal": return "Crear deal";
    case "assign_agent": return "Asignar agente";
    case "send_notification": return "Notificar al equipo";
    case "send_webhook": return "Enviar webhook";
  }
}

export default function AutomationsPage() {
  const { subscription } = useBilling();
  const { canManage } = useWorkspaces();
  const [items, setItems] = useState<Automation[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [users, setUsers] = useState<{ _id: string; firstName?: string; lastName?: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const limit = subscription?.plan.limits.maxAutomations ?? 0;
  const used = subscription?.usage.automations ?? items.length;
  const atLimit = limit !== -1 && used >= limit;

  const load = useCallback(async () => {
    try {
      const [a, r] = await Promise.all([api.get(`${API_URL}/automations`), api.get(`${API_URL}/automations/runs?limit=50`)]);
      setItems(unwrap<Automation[]>(a) || []);
      setRuns(unwrap<Run[]>(r) || []);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudieron cargar las automatizaciones"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    api.get(`${API_URL}/users`, { skipWorkspace: true }).then((r) => setUsers(unwrap(r) || [])).catch(() => undefined);
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (a: Automation) => {
    setEditing(a);
    setForm({
      name: a.name,
      trigger: a.trigger,
      channel: a.conditions?.channel || "any",
      keywords: (a.conditions?.keywords || []).join(", "),
      tags: (a.conditions?.tags || []).join(", "),
      stage: a.conditions?.stage || "any",
      cooldownMinutes: a.conditions?.cooldownMinutes ?? 60,
      actions: a.actions.map((x) => ({ type: x.type, config: { ...x.config } })),
    });
    setOpen(true);
  };

  const canReply = form.trigger === "message.received" || form.trigger === "conversation.created";
  const availableActions = (Object.keys(ACTIONS) as ActionType[]).filter((t) => !ACTIONS[t].needsConversation || canReply);

  const setTrigger = (trigger: Trigger) =>
    setForm((f) => {
      const reply = trigger === "message.received" || trigger === "conversation.created";
      return { ...f, trigger, actions: reply ? f.actions : f.actions.filter((a) => a.type !== "auto_reply") };
    });

  const patchAction = (i: number, config: Record<string, any>) =>
    setForm((f) => ({ ...f, actions: f.actions.map((a, idx) => (idx === i ? { ...a, config: { ...a.config, ...config } } : a)) }));

  const payload = () => {
    const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
    const conditions: Record<string, any> = {};
    if (form.channel !== "any" && (form.trigger === "message.received" || form.trigger === "conversation.created")) conditions.channel = form.channel;
    if (form.trigger === "message.received" && split(form.keywords).length) conditions.keywords = split(form.keywords);
    if (split(form.tags).length) conditions.tags = split(form.tags);
    if (form.trigger === "deal.stage_changed" && form.stage !== "any") conditions.stage = form.stage;
    if (form.trigger === "message.received") conditions.cooldownMinutes = Math.max(0, Number(form.cooldownMinutes) || 0);
    return {
      name: form.name.trim(),
      trigger: form.trigger,
      conditions,
      actions: form.actions.map((a) => ({
        type: a.type,
        config: Object.fromEntries(Object.entries(a.config).map(([k, v]) => [k, ["dueInHours", "estimatedValue", "value"].includes(k) ? Number(v) || 0 : v])),
      })),
    };
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return "Ponle un nombre a la automatización";
    if (form.actions.length === 0) return "Agrega al menos una acción";
    for (const a of form.actions) {
      const c = a.config;
      if (a.type === "auto_reply" && !String(c.message || "").trim()) return "Escribe el mensaje de la respuesta automática";
      if (a.type === "create_task" && !String(c.title || "").trim()) return "La tarea necesita un título";
      if (a.type === "add_tag" && !String(c.tag || "").trim()) return "Escribe la etiqueta";
      if (a.type === "assign_agent" && !c.userId) return "Elige el agente";
      if (a.type === "send_notification" && !String(c.message || "").trim()) return "Escribe el mensaje de la notificación";
      if (a.type === "send_webhook" && !/^https:\/\/.+/i.test(String(c.url || ""))) return "El webhook debe ser una URL https válida";
    }
    return null;
  };

  const save = async () => {
    const problem = validate();
    if (problem) return toast.error(problem);
    setSaving(true);
    try {
      if (editing) await api.patch(`${API_URL}/automations/${editing._id}`, payload());
      else await api.post(`${API_URL}/automations`, payload());
      toast.success(editing ? "Automatización actualizada" : "Automatización creada");
      setOpen(false);
      window.dispatchEvent(new Event("axentyc:billing-changed"));
      await load();
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo guardar"));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (a: Automation, isActive: boolean) => {
    setItems((prev) => prev.map((x) => (x._id === a._id ? { ...x, isActive } : x)));
    try {
      await api.patch(`${API_URL}/automations/${a._id}`, { isActive });
    } catch (e) {
      setItems((prev) => prev.map((x) => (x._id === a._id ? { ...x, isActive: !isActive } : x)));
      toast.error(errorMessage(e, "No se pudo cambiar el estado"));
    }
  };

  const remove = async (a: Automation) => {
    if (!window.confirm(`¿Eliminar "${a.name}"?`)) return;
    try {
      await api.delete(`${API_URL}/automations/${a._id}`);
      toast.success("Automatización eliminada");
      window.dispatchEvent(new Event("axentyc:billing-changed"));
      await load();
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo eliminar"));
    }
  };

  const overLimit = useMemo(() => {
    if (limit === -1) return 0;
    return Math.max(0, items.filter((i) => i.isActive).length - limit);
  }, [items, limit]);

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-6" initial={{ opacity: 0, y: 20 }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Automatizaciones</h1>
          <p className="mt-1 text-sm text-default-500">Reglas &quot;cuando pase X, haz Y&quot;. Usadas {used} de {formatLimit(limit)} en tu plan.</p>
        </div>
        {canManage && (
          <Button color="primary" isDisabled={atLimit} startContent={<Plus size={16} />} onPress={openCreate}>
            Nueva automatización
          </Button>
        )}
      </div>

      {atLimit && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 shrink-0 text-warning" size={18} />
          <p>
            {limit === 0 ? "Tu plan no incluye automatizaciones." : `Llegaste al límite de ${limit} automatizaciones de tu plan.`}{" "}
            <NextLink className="font-semibold text-primary underline" href="/account?tab=billing">Mejorar plan</NextLink>
          </p>
        </div>
      )}
      {overLimit > 0 && (
        <p className="text-xs text-warning-600">Tu plan actual solo ejecuta {limit} automatizaciones activas (las más antiguas). Las demás están en pausa.</p>
      )}

      <Tabs radius="full" variant="light">
        <Tab key="rules" title={`Reglas (${items.length})`}>
          {loading ? (
            <div className="flex h-40 items-center justify-center"><Spinner /></div>
          ) : items.length === 0 ? (
            <Card className="mt-4 border border-dashed border-divider">
              <CardBody className="items-center gap-2 p-10 text-center">
                <Zap className="text-primary" size={30} />
                <p className="font-bold">Aún no tienes automatizaciones</p>
                <p className="max-w-md text-sm text-default-500">Ejemplo: cuando alguien escriba &quot;precio&quot;, responder con tu lista de precios y crear una tarea de seguimiento.</p>
              </CardBody>
            </Card>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {items.map((a) => {
                const T = TRIGGERS[a.trigger] || { label: a.trigger, icon: Zap, hint: "" };
                const Icon = T.icon;
                return (
                  <Card key={a._id} className="border border-divider">
                    <CardBody className="gap-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`rounded-lg p-2 ${a.isActive ? "bg-primary/10 text-primary" : "bg-default-100 text-default-400"}`}><Icon size={20} /></div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{a.name}</p>
                            <p className="text-xs text-default-400">Cuando: {T.label}</p>
                          </div>
                        </div>
                        <Switch isDisabled={!canManage} isSelected={a.isActive} size="sm" onValueChange={(v) => toggle(a, v)} />
                      </div>
                      <ul className="space-y-1 text-xs text-default-600">
                        {a.actions.map((x, i) => (
                          <li key={i} className="flex gap-2"><span className="text-default-400">{i + 1}.</span>{describeAction(x)}</li>
                        ))}
                      </ul>
                      <div className="flex items-center justify-between text-xs text-default-400">
                        <span>{a.executionCount} ejecuciones{a.lastExecutedAt ? ` · última ${fmtDate(a.lastExecutedAt, true)}` : ""}</span>
                        {canManage && (
                          <span className="flex gap-1">
                            <Button isIconOnly size="sm" variant="light" onPress={() => openEdit(a)}><Pencil size={14} /></Button>
                            <Button isIconOnly color="danger" size="sm" variant="light" onPress={() => remove(a)}><Trash2 size={14} /></Button>
                          </span>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </Tab>

        <Tab key="runs" title="Historial">
          <Card className="mt-4 border border-divider">
            <CardBody className="divide-y divide-divider p-0">
              {runs.length === 0 ? (
                <p className="p-8 text-center text-sm text-default-500">Todavía no se ejecutó ninguna automatización. El historial guarda los últimos 30 días.</p>
              ) : (
                runs.map((r) => (
                  <div key={r._id} className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {r.status === "success" ? <CheckCircle2 className="text-success" size={16} /> : r.status === "partial" ? <AlertTriangle className="text-warning" size={16} /> : <XCircle className="text-danger" size={16} />}
                        <p className="text-sm font-semibold">{r.automationName}</p>
                        <Chip size="sm" variant="flat">{TRIGGERS[r.trigger as Trigger]?.label || r.trigger}</Chip>
                      </div>
                      <ul className="mt-1.5 space-y-0.5 text-xs">
                        {r.results.map((x, i) => (
                          <li key={i} className={x.ok ? "text-default-500" : "text-danger"}>{x.ok ? "✓" : "✗"} {ACTIONS[x.type as ActionType]?.label || x.type}{x.detail ? ` — ${x.detail}` : ""}</li>
                        ))}
                      </ul>
                    </div>
                    <span className="shrink-0 text-xs text-default-400">{fmtDate(r.createdAt, true)} · {r.durationMs} ms</span>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      <Modal isOpen={open} onOpenChange={setOpen} scrollBehavior="inside" size="3xl">
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>{editing ? "Editar automatización" : "Nueva automatización"}</ModalHeader>
              <ModalBody className="gap-5">
                <Input label="Nombre" placeholder="Ej. Responder consultas de precio" value={form.name} variant="bordered" onValueChange={(v) => setForm((f) => ({ ...f, name: v }))} />

                <section className="space-y-3 rounded-2xl border border-divider p-4">
                  <p className="text-sm font-bold">1 · Cuando…</p>
                  <Select aria-label="Disparador" description={TRIGGERS[form.trigger].hint} isDisabled={!!editing} selectedKeys={[form.trigger]} variant="bordered" onSelectionChange={(k) => { const v = Array.from(k)[0] as Trigger; if (v) setTrigger(v); }}>
                    {(Object.keys(TRIGGERS) as Trigger[]).map((t) => <SelectItem key={t}>{TRIGGERS[t].label}</SelectItem>)}
                  </Select>
                  {(form.trigger === "message.received" || form.trigger === "conversation.created") && (
                    <Select label="Canal" selectedKeys={[form.channel]} variant="bordered" onSelectionChange={(k) => { const v = Array.from(k)[0] as string; if (v) setForm((f) => ({ ...f, channel: v })); }}>
                      {Object.entries(CHANNELS).map(([k, l]) => <SelectItem key={k}>{l}</SelectItem>)}
                    </Select>
                  )}
                  {form.trigger === "message.received" && (
                    <>
                      <Input description="Separadas por coma. Si el mensaje contiene alguna, se ejecuta. Vacío = todos los mensajes." label="Palabras clave" placeholder="precio, costo, cuánto cuesta" value={form.keywords} variant="bordered" onValueChange={(v) => setForm((f) => ({ ...f, keywords: v }))} />
                      <Input description="Evita responder varias veces a la misma conversación. 0 = siempre." label="Esperar entre ejecuciones (minutos)" min={0} type="number" value={String(form.cooldownMinutes)} variant="bordered" onValueChange={(v) => setForm((f) => ({ ...f, cooldownMinutes: Number(v) }))} />
                    </>
                  )}
                  {form.trigger === "deal.stage_changed" && (
                    <Select label="Cuando pase a la etapa" selectedKeys={[form.stage]} variant="bordered" onSelectionChange={(k) => { const v = Array.from(k)[0] as string; if (v) setForm((f) => ({ ...f, stage: v })); }}>
                      {[["any", "Cualquier etapa"], ...Object.entries(STAGES)].map(([k, l]) => <SelectItem key={k}>{l}</SelectItem>)}
                    </Select>
                  )}
                  <Input description="Opcional: solo contactos con alguna de estas etiquetas" label="Etiquetas del contacto" placeholder="vip, cliente" value={form.tags} variant="bordered" onValueChange={(v) => setForm((f) => ({ ...f, tags: v }))} />
                </section>

                <section className="space-y-3 rounded-2xl border border-divider p-4">
                  <p className="text-sm font-bold">2 · Entonces…</p>
                  <p className="text-xs text-default-500">Variables: <code>{"{{contact.firstName}}"}</code> <code>{"{{contact.name}}"}</code> <code>{"{{message}}"}</code></p>
                  {form.actions.map((a, i) => (
                    <div key={i} className="space-y-2 rounded-xl bg-content2/60 p-3">
                      <div className="flex items-center gap-2">
                        <Select aria-label="Acción" className="flex-1" selectedKeys={[a.type]} size="sm" variant="bordered" onSelectionChange={(k) => { const v = Array.from(k)[0] as ActionType; if (v) setForm((f) => ({ ...f, actions: f.actions.map((x, idx) => (idx === i ? { type: v, config: defaultConfig(v) } : x)) })); }}>
                          {availableActions.map((t) => <SelectItem key={t}>{ACTIONS[t].label}</SelectItem>)}
                        </Select>
                        <Button isIconOnly color="danger" isDisabled={form.actions.length === 1} size="sm" variant="light" onPress={() => setForm((f) => ({ ...f, actions: f.actions.filter((_, idx) => idx !== i) }))}><Trash2 size={14} /></Button>
                      </div>
                      {a.type === "auto_reply" && <Textarea label="Mensaje" minRows={2} value={a.config.message || ""} variant="bordered" onValueChange={(v) => patchAction(i, { message: v })} />}
                      {a.type === "create_task" && (
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                          <Input className="md:col-span-2" label="Título" value={a.config.title || ""} variant="bordered" onValueChange={(v) => patchAction(i, { title: v })} />
                          <Input label="Vence en (horas)" min={0} type="number" value={String(a.config.dueInHours ?? 24)} variant="bordered" onValueChange={(v) => patchAction(i, { dueInHours: v })} />
                        </div>
                      )}
                      {a.type === "add_tag" && <Input label="Etiqueta" value={a.config.tag || ""} variant="bordered" onValueChange={(v) => patchAction(i, { tag: v })} />}
                      {a.type === "assign_agent" && (
                        <Select label="Agente" selectedKeys={a.config.userId ? [a.config.userId] : []} variant="bordered" onSelectionChange={(k) => patchAction(i, { userId: Array.from(k)[0] as string })}>
                          {users.map((u) => <SelectItem key={u._id}>{`${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email}</SelectItem>)}
                        </Select>
                      )}
                      {a.type === "update_status" && (
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          <Select label="Qué cambiar" selectedKeys={[a.config.target || "conversation"]} variant="bordered" onSelectionChange={(k) => { const t = Array.from(k)[0] as string; if (t) patchAction(i, { target: t, status: t === "conversation" ? "in_progress" : t === "lead" ? "contacted" : "contacted" }); }}>
                            <SelectItem key="conversation">Conversación</SelectItem>
                            <SelectItem key="lead">Lead</SelectItem>
                            <SelectItem key="deal">Deal</SelectItem>
                          </Select>
                          <Select label="Nuevo estado" selectedKeys={[a.config.status]} variant="bordered" onSelectionChange={(k) => patchAction(i, { status: Array.from(k)[0] as string })}>
                            {Object.entries(a.config.target === "lead" ? LEAD_STATUS : a.config.target === "deal" ? STAGES : CONV_STATUS).map(([k, l]) => <SelectItem key={k}>{l}</SelectItem>)}
                          </Select>
                        </div>
                      )}
                      {a.type === "create_lead" && (
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                          <Input className="md:col-span-2" label="Título" value={a.config.title || ""} variant="bordered" onValueChange={(v) => patchAction(i, { title: v })} />
                          <Input label="Valor estimado" min={0} type="number" value={String(a.config.estimatedValue ?? 0)} variant="bordered" onValueChange={(v) => patchAction(i, { estimatedValue: v })} />
                        </div>
                      )}
                      {a.type === "create_deal" && (
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                          <Input className="md:col-span-2" label="Título" value={a.config.title || ""} variant="bordered" onValueChange={(v) => patchAction(i, { title: v })} />
                          <Input label="Valor" min={0} type="number" value={String(a.config.value ?? 0)} variant="bordered" onValueChange={(v) => patchAction(i, { value: v })} />
                        </div>
                      )}
                      {a.type === "send_notification" && <Input label="Mensaje" value={a.config.message || ""} variant="bordered" onValueChange={(v) => patchAction(i, { message: v })} />}
                      {a.type === "send_webhook" && <Input description="Solo https y direcciones públicas. Recibe un POST con los datos del evento." label="URL del webhook" value={a.config.url || ""} variant="bordered" onValueChange={(v) => patchAction(i, { url: v })} />}
                    </div>
                  ))}
                  <Button size="sm" startContent={<Plus size={14} />} variant="flat" onPress={() => setForm((f) => ({ ...f, actions: [...f.actions, { type: availableActions[0], config: defaultConfig(availableActions[0]) }] }))}>
                    Agregar acción
                  </Button>
                </section>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={close}>Cancelar</Button>
                <Button color="primary" isLoading={saving} onPress={save}>{editing ? "Guardar cambios" : "Crear automatización"}</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </motion.div>
  );
}
