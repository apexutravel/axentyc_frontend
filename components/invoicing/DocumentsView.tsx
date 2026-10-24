"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Lock, Package, Plus, Receipt, FileText, Search } from "lucide-react";
import { api } from "@/lib/api";
import { API_URL } from "@/config/api";
import { DOC_STATUS, errorMessage, fmtDate, money, SalesDoc, unwrap } from "@/lib/crm";
import { useBilling } from "@/contexts/BillingContext";
import { useWorkspaces } from "@/contexts/WorkspaceContext";
import DocumentEditor from "./DocumentEditor";
import DocumentDetail from "./DocumentDetail";
import ProductsManager from "./ProductsManager";

const FILTERS: Record<"quote" | "invoice", [string, string][]> = {
  invoice: [["all", "Todas"], ["draft", "Borradores"], ["sent", "Enviadas"], ["partial", "Pago parcial"], ["overdue", "Atrasadas"], ["paid", "Pagadas"], ["void", "Anuladas"]],
  quote: [["all", "Todas"], ["draft", "Borradores"], ["sent", "Enviadas"], ["accepted", "Aceptadas"], ["rejected", "Rechazadas"], ["expired", "Vencidas"], ["void", "Anuladas"]],
};

export default function DocumentsView({ type }: { type: "quote" | "invoice" }) {
  const { can, isLoading: billingLoading } = useBilling();
  const { activeWorkspace } = useWorkspaces();
  const searchParams = useSearchParams();
  const isInvoice = type === "invoice";
  const currency = (activeWorkspace?.currency || "USD").toUpperCase();

  const [docs, setDocs] = useState<SalesDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SalesDoc | null>(null);
  const [editing, setEditing] = useState<{ doc: SalesDoc | null } | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setDocs(unwrap<SalesDoc[]>(await api.get(`${API_URL}/sales-documents?type=${type}`)) || []);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudieron cargar los documentos"));
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (can("invoicing")) load();
    else setLoading(false);
  }, [load, can]);

  const openById = useCallback(async (id: string) => {
    try {
      setSelected(unwrap<SalesDoc>(await api.get(`${API_URL}/sales-documents/${id}`)));
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo abrir el documento"));
    }
  }, []);

  // Deep link, e.g. coming from a deal: /invoices?open=<id>
  const deepLink = searchParams.get("open");
  useEffect(() => {
    if (deepLink) openById(deepLink);
  }, [deepLink, openById]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) => {
      if (filter !== "all" && d.displayStatus !== filter) return false;
      if (!q) return true;
      const name = typeof d.contactId === "object" ? d.contactId.name : "";
      return d.number.toLowerCase().includes(q) || name.toLowerCase().includes(q);
    });
  }, [docs, filter, query]);

  const stats = useMemo(() => {
    const sum = (f: (d: SalesDoc) => boolean, v: (d: SalesDoc) => number) => docs.filter(f).reduce((s, d) => s + v(d), 0);
    if (isInvoice) {
      return [
        { label: "Por cobrar", value: money(sum((d) => ["sent", "partial"].includes(d.status), (d) => d.balanceCents), currency) },
        { label: "Atrasado", value: money(sum((d) => d.displayStatus === "overdue", (d) => d.balanceCents), currency), danger: true },
        { label: "Cobrado", value: money(sum((d) => d.status !== "void", (d) => d.amountPaidCents), currency) },
        { label: "Facturas", value: String(docs.filter((d) => d.status !== "void").length) },
      ];
    }
    return [
      { label: "Abiertas", value: String(docs.filter((d) => d.status === "sent").length) },
      { label: "Valor abierto", value: money(sum((d) => d.status === "sent", (d) => d.totalCents), currency) },
      { label: "Aceptadas", value: money(sum((d) => d.status === "accepted", (d) => d.totalCents), currency) },
      { label: "Total cotizaciones", value: String(docs.filter((d) => d.status !== "void").length) },
    ];
  }, [docs, isInvoice, currency]);

  const upsert = (doc: SalesDoc | null, previousId?: string) => {
    if (!doc) {
      setDocs((prev) => prev.filter((d) => d._id !== (previousId || selected?._id)));
      setSelected(null);
      return;
    }
    // mutations return the contact as a bare id: keep the populated one we already have
    const known = docs.find((d) => d._id === doc._id) || (selected?._id === doc._id ? selected : null);
    const merged: SalesDoc = typeof doc.contactId === "string" && known && typeof known.contactId === "object" ? { ...doc, contactId: known.contactId } : doc;
    setDocs((prev) => (prev.some((d) => d._id === merged._id) ? prev.map((d) => (d._id === merged._id ? merged : d)) : [merged, ...prev]));
    setSelected(merged);
  };

  if (!billingLoading && !can("invoicing")) {
    return (
      <Card className="mx-auto mt-10 max-w-lg border border-divider">
        <CardBody className="items-center gap-3 p-10 text-center">
          <Lock className="text-primary" size={32} />
          <h2 className="text-xl font-bold">Cotizaciones y facturas</h2>
          <p className="text-sm text-default-500">Tu plan actual no las incluye. Mejora a Starter o superior para crear cotizaciones y facturas con PDF, enviarlas por email y registrar pagos.</p>
          <Button as={NextLink} color="primary" href="/account?tab=billing">Ver planes</Button>
        </CardBody>
      </Card>
    );
  }

  const Icon = isInvoice ? Receipt : FileText;

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-6" initial={{ opacity: 0, y: 20 }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Chip color="primary" size="sm" startContent={<Icon size={14} />} variant="flat">{activeWorkspace?.name}</Chip>
          <h1 className="mt-2 text-2xl font-bold">{isInvoice ? "Facturas" : "Cotizaciones"}</h1>
          <p className="mt-1 max-w-2xl text-sm text-default-500">
            {isInvoice ? "Factura a tus clientes, envía el PDF por email y registra los pagos (Zelle, efectivo, transferencia, cheque…)." : "Envía propuestas con PDF y conviértelas en factura cuando el cliente acepte."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button startContent={<Package size={16} />} variant="flat" onPress={() => setCatalogOpen(true)}>Catálogo</Button>
          <Button color="primary" startContent={<Plus size={16} />} onPress={() => setEditing({ doc: null })}>{isInvoice ? "Nueva factura" : "Nueva cotización"}</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border border-divider">
            <CardBody className="gap-1 p-5">
              <p className="text-xs text-default-500">{s.label}</p>
              <p className={`text-2xl font-black tabular-nums ${(s as any).danger && s.value !== money(0, currency) ? "text-danger" : ""}`}>{s.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs radius="full" selectedKey={filter} size="sm" variant="light" onSelectionChange={(k) => setFilter(String(k))}>
          {FILTERS[type].map(([key, label]) => <Tab key={key} title={label} />)}
        </Tabs>
        <Input className="max-w-xs" isClearable placeholder="Buscar por número o cliente" size="sm" startContent={<Search size={14} />} value={query} variant="bordered" onClear={() => setQuery("")} onValueChange={setQuery} />
      </div>

      <Card className="border border-divider">
        <CardBody className="p-0">
          {loading ? (
            <div className="flex h-40 items-center justify-center"><Spinner /></div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-default-500">
              <Icon className="opacity-40" size={32} />
              <p className="text-sm">{docs.length === 0 ? `Aún no has creado ${isInvoice ? "facturas" : "cotizaciones"}.` : "Nada coincide con el filtro."}</p>
              {docs.length === 0 && <Button color="primary" size="sm" onPress={() => setEditing({ doc: null })}>{isInvoice ? "Crear la primera factura" : "Crear la primera cotización"}</Button>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-content2 text-xs text-default-500">
                  <tr>
                    <th className="p-3 text-left">Número</th>
                    <th className="p-3 text-left">Cliente</th>
                    <th className="p-3 text-left">Fecha</th>
                    <th className="p-3 text-left">{isInvoice ? "Vence" : "Válida hasta"}</th>
                    <th className="p-3 text-right">Total</th>
                    {isInvoice && <th className="p-3 text-right">Saldo</th>}
                    <th className="p-3 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((d) => {
                    const st = DOC_STATUS[d.displayStatus] || DOC_STATUS.draft;
                    return (
                      <tr key={d._id} className="cursor-pointer border-t border-divider hover:bg-content2/60" onClick={() => setSelected(d)}>
                        <td className="p-3 font-semibold">{d.number}</td>
                        <td className="p-3">{typeof d.contactId === "object" ? d.contactId.name : "-"}</td>
                        <td className="p-3 text-default-500">{fmtDate(d.issueDate)}</td>
                        <td className="p-3 text-default-500">{fmtDate(d.dueDate)}</td>
                        <td className="p-3 text-right tabular-nums">{money(d.totalCents, d.currency)}</td>
                        {isInvoice && <td className="p-3 text-right tabular-nums">{d.status === "void" ? "-" : money(d.balanceCents, d.currency)}</td>}
                        <td className="p-3"><Chip color={st.color} size="sm" variant="flat">{st.label}</Chip></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <DocumentDetail
        doc={selected}
        onChanged={(d) => upsert(d, selected?._id)}
        onClose={() => setSelected(null)}
        onEdit={(d) => setEditing({ doc: d })}
        onOpenOther={(id) => {
          // the other document may belong to the other list (quote -> invoice)
          const here = docs.find((x) => x._id === id);
          if (here) setSelected(here);
          else window.location.href = `${isInvoice ? "/quotes" : "/invoices"}?open=${id}`;
        }}
      />
      <DocumentEditor doc={editing?.doc} isOpen={!!editing} type={type} onClose={() => setEditing(null)} onSaved={(d) => upsert(d)} />
      <ProductsManager currency={currency} isOpen={catalogOpen} onClose={() => setCatalogOpen(false)} />
    </motion.div>
  );
}
