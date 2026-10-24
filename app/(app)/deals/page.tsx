"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Spinner } from "@heroui/spinner";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { FileText, Lock, Plus, Receipt, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { API_URL } from "@/config/api";
import { errorMessage, moneyUnits, unwrap } from "@/lib/crm";
import { useBilling } from "@/contexts/BillingContext";
import { useWorkspaces } from "@/contexts/WorkspaceContext";
import ActivityPanel from "@/components/crm/ActivityPanel";

interface Deal {
  _id: string;
  title: string;
  description?: string;
  stage: string;
  value: number;
  currency: string;
  probability: number;
  contactId: { _id: string; name: string; company?: string } | string;
}

const STAGES: { key: string; label: string; color: string; probability: number }[] = [
  { key: "new_lead", label: "Nuevo lead", color: "bg-blue-500", probability: 10 },
  { key: "contacted", label: "Contactado", color: "bg-yellow-500", probability: 25 },
  { key: "proposal", label: "Propuesta", color: "bg-purple-500", probability: 50 },
  { key: "negotiation", label: "Negociación", color: "bg-orange-500", probability: 75 },
  { key: "closed_won", label: "Ganado", color: "bg-green-500", probability: 100 },
  { key: "closed_lost", label: "Perdido", color: "bg-red-500", probability: 0 },
];

const contactName = (d: Deal) => (typeof d.contactId === "object" ? d.contactId.name : "-");

export default function DealsPage() {
  const router = useRouter();
  const { can, isLoading: billingLoading } = useBilling();
  const { activeWorkspace } = useWorkspaces();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [selected, setSelected] = useState<Deal | null>(null);
  const [creating, setCreating] = useState(false);
  const [contacts, setContacts] = useState<{ _id: string; name: string }[]>([]);
  const [form, setForm] = useState({ title: "", value: "", contactId: "", stage: "new_lead" });
  const [saving, setSaving] = useState(false);
  const [busyDoc, setBusyDoc] = useState<string | null>(null);

  const allowed = can("deals");

  const load = useCallback(async () => {
    try {
      setDeals(unwrap<Deal[]>(await api.get(`${API_URL}/deals`)) || []);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudieron cargar los deals"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) load();
    else setLoading(false);
  }, [allowed, load]);

  const byStage = useMemo(() => {
    const map: Record<string, Deal[]> = {};
    STAGES.forEach((s) => (map[s.key] = []));
    deals.forEach((d) => (map[d.stage] ||= []).push(d));
    return map;
  }, [deals]);

  const moveTo = async (deal: Deal, stage: string) => {
    if (deal.stage === stage) return;
    const stageDef = STAGES.find((s) => s.key === stage)!;
    let lostReason: string | undefined;
    if (stage === "closed_lost") {
      const reason = window.prompt("¿Por qué se perdió? (opcional)");
      if (reason === null) return;
      lostReason = reason.trim() || undefined;
    }
    const previous = deals;
    setDeals((prev) => prev.map((d) => (d._id === deal._id ? { ...d, stage, probability: stageDef.probability } : d)));
    try {
      await api.patch(`${API_URL}/deals/${deal._id}`, { stage, probability: stageDef.probability, ...(lostReason ? { lostReason } : {}) });
    } catch (e) {
      setDeals(previous);
      toast.error(errorMessage(e, "No se pudo mover el deal"));
    }
  };

  const openCreate = () => {
    setForm({ title: "", value: "", contactId: "", stage: "new_lead" });
    setCreating(true);
    api.get(`${API_URL}/contacts`).then((r) => setContacts(unwrap(r) || [])).catch(() => undefined);
  };

  const create = async () => {
    const value = Number(form.value.replace(/,/g, "."));
    if (!form.title.trim()) return toast.error("Ponle un título al deal");
    if (!form.contactId) return toast.error("Elige el contacto");
    if (!Number.isFinite(value) || value < 0) return toast.error("Valor inválido");
    setSaving(true);
    try {
      const stage = STAGES.find((s) => s.key === form.stage)!;
      await api.post(`${API_URL}/deals`, { title: form.title.trim(), value, contactId: form.contactId, stage: form.stage, probability: stage.probability, currency: (activeWorkspace?.currency || "USD").toUpperCase() });
      toast.success("Deal creado");
      setCreating(false);
      await load();
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo crear el deal"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (deal: Deal) => {
    if (!window.confirm(`¿Eliminar "${deal.title}"?`)) return;
    try {
      await api.delete(`${API_URL}/deals/${deal._id}`);
      setDeals((prev) => prev.filter((d) => d._id !== deal._id));
      setSelected(null);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo eliminar"));
    }
  };

  const makeDocument = async (deal: Deal, type: "quote" | "invoice") => {
    setBusyDoc(type);
    try {
      const doc = unwrap<{ _id: string }>(await api.post(`${API_URL}/sales-documents/from-deal/${deal._id}`, { type }));
      router.push(`${type === "invoice" ? "/invoices" : "/quotes"}?open=${doc._id}`);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo crear el documento"));
    } finally {
      setBusyDoc(null);
    }
  };

  if (!billingLoading && !allowed) {
    return (
      <Card className="mx-auto mt-10 max-w-lg border border-divider">
        <CardBody className="items-center gap-3 p-10 text-center">
          <Lock className="text-primary" size={32} />
          <h2 className="text-xl font-bold">Pipeline de deals</h2>
          <p className="text-sm text-default-500">Tu plan actual no incluye el pipeline de ventas. Mejora a Pro para seguir tus oportunidades por etapas y convertir leads en deals.</p>
          <Button as={NextLink} color="primary" href="/account?tab=billing">Ver planes</Button>
        </CardBody>
      </Card>
    );
  }

  const open = deals.filter((d) => !["closed_won", "closed_lost"].includes(d.stage));
  const cur = (activeWorkspace?.currency || "USD").toUpperCase();

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-6" initial={{ opacity: 0, y: 20 }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Deals</h1>
          <p className="mt-1 text-sm text-default-500">
            {open.length} abiertos · {moneyUnits(open.reduce((s, d) => s + d.value, 0), cur)} en pipeline. Arrastra las tarjetas entre etapas.
          </p>
        </div>
        <Button color="primary" startContent={<Plus size={16} />} onPress={openCreate}>Nuevo deal</Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Spinner /></div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const items = byStage[stage.key] || [];
            return (
              <div
                key={stage.key}
                className={`flex w-72 shrink-0 flex-col rounded-2xl border bg-content2/40 p-3 transition-colors ${overStage === stage.key ? "border-primary bg-primary/5" : "border-divider"}`}
                onDragLeave={() => setOverStage((s) => (s === stage.key ? null : s))}
                onDragOver={(e) => { e.preventDefault(); setOverStage(stage.key); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setOverStage(null);
                  const deal = deals.find((d) => d._id === dragId);
                  setDragId(null);
                  if (deal) moveTo(deal, stage.key);
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold"><span className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />{stage.label}</span>
                  <span className="text-xs text-default-500">{items.length} · {moneyUnits(items.reduce((s, d) => s + d.value, 0), cur)}</span>
                </div>
                <div className="flex min-h-[80px] flex-1 flex-col gap-2">
                  {items.map((d) => (
                    <Card key={d._id} isPressable className={`border border-divider ${dragId === d._id ? "opacity-40" : ""}`} draggable onDragEnd={() => setDragId(null)} onDragStart={() => setDragId(d._id)} onPress={() => setSelected(d)}>
                      <CardBody className="gap-1.5 p-3">
                        <p className="text-sm font-semibold">{d.title}</p>
                        <p className="text-xs text-default-500">{contactName(d)}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold tabular-nums">{moneyUnits(d.value, d.currency)}</span>
                          <Chip size="sm" variant="flat">{d.probability}%</Chip>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={creating} size="lg" onOpenChange={setCreating}>
        <ModalContent>
          <ModalHeader>Nuevo deal</ModalHeader>
          <ModalBody className="gap-3">
            <Input autoFocus label="Título" value={form.title} variant="bordered" onValueChange={(v) => setForm((f) => ({ ...f, title: v }))} />
            <Autocomplete label="Contacto" selectedKey={form.contactId || null} variant="bordered" onSelectionChange={(k) => setForm((f) => ({ ...f, contactId: (k as string) || "" }))}>
              {contacts.map((c) => <AutocompleteItem key={c._id}>{c.name}</AutocompleteItem>)}
            </Autocomplete>
            <div className="grid grid-cols-2 gap-3">
              <Input inputMode="decimal" label={`Valor (${cur})`} value={form.value} variant="bordered" onValueChange={(v) => setForm((f) => ({ ...f, value: v }))} />
              <Select label="Etapa" selectedKeys={[form.stage]} variant="bordered" onSelectionChange={(k) => { const v = Array.from(k)[0] as string; if (v) setForm((f) => ({ ...f, stage: v })); }}>
                {STAGES.map((s) => <SelectItem key={s.key}>{s.label}</SelectItem>)}
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setCreating(false)}>Cancelar</Button>
            <Button color="primary" isLoading={saving} onPress={create}>Crear deal</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={!!selected} scrollBehavior="inside" size="2xl" onOpenChange={(o) => !o && setSelected(null)}>
        <ModalContent>
          {selected && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {selected.title}
                <span className="text-sm font-normal text-default-500">{contactName(selected)} · {moneyUnits(selected.value, selected.currency)}</span>
              </ModalHeader>
              <ModalBody className="gap-4">
                <Select label="Etapa" selectedKeys={[selected.stage]} variant="bordered" onSelectionChange={(k) => { const v = Array.from(k)[0] as string; if (v) { moveTo(selected, v); setSelected({ ...selected, stage: v }); } }}>
                  {STAGES.map((s) => <SelectItem key={s.key}>{s.label}</SelectItem>)}
                </Select>
                {selected.description && <Textarea isReadOnly label="Descripción" minRows={1} value={selected.description} variant="flat" />}
                {can("invoicing") && (
                  <div className="flex flex-wrap gap-2">
                    <Button isLoading={busyDoc === "quote"} size="sm" startContent={<FileText size={14} />} variant="flat" onPress={() => makeDocument(selected, "quote")}>Crear cotización</Button>
                    <Button color="primary" isLoading={busyDoc === "invoice"} size="sm" startContent={<Receipt size={14} />} onPress={() => makeDocument(selected, "invoice")}>Crear factura</Button>
                  </div>
                )}
                {typeof selected.contactId === "object" && <ActivityPanel contactId={selected.contactId._id} />}
              </ModalBody>
              <ModalFooter className="justify-between">
                <Button color="danger" size="sm" startContent={<Trash2 size={14} />} variant="light" onPress={() => remove(selected)}>Eliminar</Button>
                <Button onPress={() => setSelected(null)}>Cerrar</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </motion.div>
  );
}
