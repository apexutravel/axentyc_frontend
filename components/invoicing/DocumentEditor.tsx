"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { API_URL } from "@/config/api";
import { EditorLine, errorMessage, fromCents, money, previewTotals, Product, SalesDoc, toCents, unwrap } from "@/lib/crm";
import { useWorkspaces } from "@/contexts/WorkspaceContext";

interface Props {
  isOpen: boolean;
  type: "quote" | "invoice";
  /** Draft being edited; when empty a new document is created */
  doc?: SalesDoc | null;
  onClose: () => void;
  onSaved: (doc: SalesDoc) => void;
}

const dateInput = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");
const emptyLine = (): EditorLine => ({ description: "", quantity: "1", price: "", discountPct: "0", taxable: true });

export default function DocumentEditor({ isOpen, type, doc, onClose, onSaved }: Props) {
  const { activeWorkspace } = useWorkspaces();
  const ws: any = activeWorkspace;
  const [contacts, setContacts] = useState<{ _id: string; name: string; email?: string }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contactId, setContactId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [lines, setLines] = useState<EditorLine[]>([emptyLine()]);
  const [discountPct, setDiscountPct] = useState("0");
  const [taxRate, setTaxRate] = useState("0");
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [saving, setSaving] = useState(false);

  const currency = (doc?.currency || ws?.currency || "USD").toUpperCase();
  const isInvoice = type === "invoice";

  useEffect(() => {
    if (!isOpen) return;
    api.get(`${API_URL}/contacts`).then((r) => setContacts(unwrap<any[]>(r) || [])).catch(() => undefined);
    api.get(`${API_URL}/products`).then((r) => setProducts(unwrap<Product[]>(r) || [])).catch(() => undefined);

    if (doc) {
      setContactId(typeof doc.contactId === "object" ? doc.contactId._id : doc.contactId);
      setIssueDate(dateInput(doc.issueDate));
      setDueDate(dateInput(doc.dueDate));
      setLanguage(doc.language);
      setLines(doc.lines.map((l) => ({ description: l.description, quantity: String(l.quantity), price: fromCents(l.unitPriceCents), discountPct: String(l.discountPct || 0), taxable: l.taxable, productId: l.productId })));
      setDiscountPct(String(doc.discountPct || 0));
      setTaxRate(String(doc.taxRatePct || 0));
      setTaxIncluded(doc.taxIncluded);
      setNotes(doc.notes || "");
      setTerms(doc.terms || "");
    } else {
      const days = Number.parseInt(ws?.documentSettings?.paymentDays || "", 10) || (isInvoice ? 15 : 30);
      setContactId("");
      setIssueDate(dateInput(new Date().toISOString()));
      setDueDate(dateInput(new Date(Date.now() + days * 86400000).toISOString()));
      setLanguage(ws?.documentSettings?.language === "en" ? "en" : "es");
      setLines([emptyLine()]);
      setDiscountPct("0");
      setTaxRate(String(ws?.taxSettings?.taxRate ?? 0));
      setTaxIncluded(!!ws?.taxSettings?.taxIncluded);
      setNotes("");
      setTerms((isInvoice ? ws?.documentSettings?.invoiceTerms : ws?.documentSettings?.quoteTerms) || "");
    }
  }, [isOpen, doc, ws, isInvoice]);

  const totals = useMemo(
    () => previewTotals(lines, { discountPct: Number(discountPct) || 0, taxRatePct: Number(taxRate) || 0, taxIncluded }),
    [lines, discountPct, taxRate, taxIncluded],
  );

  const patchLine = (i: number, patch: Partial<EditorLine>) => setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const pickProduct = (i: number, id: string | null) => {
    const p = products.find((x) => x._id === id);
    if (p) patchLine(i, { description: p.name, price: fromCents(p.unitPriceCents), taxable: p.taxable, productId: p._id });
  };

  const save = async () => {
    if (!contactId) return toast.error("Elige el cliente");
    const payloadLines = [];
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const cents = toCents(l.price);
      const qty = Number(l.quantity);
      if (!l.description.trim()) return toast.error(`La línea ${i + 1} necesita una descripción`);
      if (cents === null) return toast.error(`Precio inválido en la línea ${i + 1}`);
      if (!Number.isFinite(qty) || qty <= 0) return toast.error(`Cantidad inválida en la línea ${i + 1}`);
      payloadLines.push({ description: l.description.trim(), quantity: qty, unitPriceCents: cents, discountPct: Math.min(100, Math.max(0, Number(l.discountPct) || 0)), taxable: l.taxable, productId: l.productId });
    }
    const frozen = !!doc && doc.status !== "draft";
    const body: Record<string, any> = {
      issueDate: issueDate || undefined,
      dueDate: dueDate || undefined,
      language,
      notes,
      terms,
      ...(frozen ? {} : { contactId, lines: payloadLines, discountPct: Number(discountPct) || 0, taxRatePct: Number(taxRate) || 0, taxIncluded, currency }),
    };
    setSaving(true);
    try {
      const saved = doc
        ? unwrap<SalesDoc>(await api.put(`${API_URL}/sales-documents/${doc._id}`, body))
        : unwrap<SalesDoc>(await api.post(`${API_URL}/sales-documents`, { type, ...body }));
      toast.success(doc ? "Documento actualizado" : `${isInvoice ? "Factura" : "Cotización"} ${saved.number} creada`);
      onSaved(saved);
      onClose();
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo guardar"));
    } finally {
      setSaving(false);
    }
  };

  const frozen = !!doc && doc.status !== "draft";
  const title = doc ? `Editar ${doc.number}` : isInvoice ? "Nueva factura" : "Nueva cotización";

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="4xl" onOpenChange={(o) => !o && onClose()}>
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody className="gap-4">
          {frozen && <p className="rounded-lg bg-warning/10 p-2 text-xs text-warning-700">Este documento ya se envió: solo puedes cambiar fechas, idioma, notas y términos. Para cambiar montos, anúlalo y crea uno nuevo.</p>}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Autocomplete className="md:col-span-2" isDisabled={frozen} label="Cliente" selectedKey={contactId || null} variant="bordered" onSelectionChange={(k) => setContactId((k as string) || "")}>
              {contacts.map((c) => <AutocompleteItem key={c._id} textValue={c.name}>{c.name}{c.email ? ` · ${c.email}` : ""}</AutocompleteItem>)}
            </Autocomplete>
            <Input label="Fecha" type="date" value={issueDate} variant="bordered" onValueChange={setIssueDate} />
            <Input label={isInvoice ? "Vence" : "Válida hasta"} type="date" value={dueDate} variant="bordered" onValueChange={setDueDate} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold">Conceptos</p>
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 items-start gap-2 rounded-xl bg-content2/50 p-2">
                <div className="col-span-12 space-y-1 md:col-span-5">
                  <Input aria-label="Descripción" isDisabled={frozen} placeholder="Descripción" size="sm" value={l.description} variant="bordered" onValueChange={(v) => patchLine(i, { description: v, productId: undefined })} />
                  {!frozen && products.length > 0 && (
                    <Select aria-label="Del catálogo" placeholder="Elegir del catálogo…" size="sm" variant="flat" selectedKeys={[]} onSelectionChange={(k) => pickProduct(i, (Array.from(k)[0] as string) || null)}>
                      {products.map((p) => <SelectItem key={p._id} textValue={p.name}>{p.name} · {money(p.unitPriceCents, currency)}</SelectItem>)}
                    </Select>
                  )}
                </div>
                <Input aria-label="Cantidad" className="col-span-3 md:col-span-1" inputMode="decimal" isDisabled={frozen} placeholder="Cant." size="sm" value={l.quantity} variant="bordered" onValueChange={(v) => patchLine(i, { quantity: v })} />
                <Input aria-label="Precio" className="col-span-5 md:col-span-2" inputMode="decimal" isDisabled={frozen} placeholder="Precio" size="sm" startContent={<span className="text-xs text-default-400">$</span>} value={l.price} variant="bordered" onValueChange={(v) => patchLine(i, { price: v })} />
                <Input aria-label="Descuento" className="col-span-4 md:col-span-1" inputMode="decimal" isDisabled={frozen} placeholder="Desc." size="sm" endContent={<span className="text-xs text-default-400">%</span>} value={l.discountPct} variant="bordered" onValueChange={(v) => patchLine(i, { discountPct: v })} />
                <div className="col-span-8 flex items-center md:col-span-2"><Switch isDisabled={frozen} isSelected={l.taxable} size="sm" onValueChange={(v) => patchLine(i, { taxable: v })}><span className="text-xs">Impuesto</span></Switch></div>
                <div className="col-span-4 flex justify-end md:col-span-1">
                  <Button isIconOnly color="danger" isDisabled={frozen || lines.length === 1} size="sm" variant="light" onPress={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}><Trash2 size={14} /></Button>
                </div>
              </div>
            ))}
            {!frozen && <Button size="sm" startContent={<Plus size={14} />} variant="flat" onPress={() => setLines((prev) => [...prev, emptyLine()])}>Agregar concepto</Button>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input endContent={<span className="text-xs text-default-400">%</span>} inputMode="decimal" isDisabled={frozen} label="Descuento general" value={discountPct} variant="bordered" onValueChange={setDiscountPct} />
                <Input endContent={<span className="text-xs text-default-400">%</span>} inputMode="decimal" isDisabled={frozen} label={ws?.taxSettings?.taxName || "Impuesto"} value={taxRate} variant="bordered" onValueChange={setTaxRate} />
              </div>
              <Switch isDisabled={frozen} isSelected={taxIncluded} size="sm" onValueChange={setTaxIncluded}>Los precios ya incluyen el impuesto</Switch>
              <Select label="Idioma del PDF" selectedKeys={[language]} variant="bordered" onSelectionChange={(k) => { const v = Array.from(k)[0] as "es" | "en"; if (v) setLanguage(v); }}>
                <SelectItem key="es">Español</SelectItem>
                <SelectItem key="en">English</SelectItem>
              </Select>
            </div>
            <div className="space-y-1 self-start rounded-xl border border-divider p-4 text-sm">
              <Row label="Subtotal" value={money(totals.subtotalCents, currency)} />
              {totals.discountCents > 0 && <Row label={`Descuento (${discountPct}%)`} value={`-${money(totals.discountCents, currency)}`} />}
              {Number(taxRate) > 0 && <Row label={`${ws?.taxSettings?.taxName || "Impuesto"} ${taxRate}%${taxIncluded ? " (incluido)" : ""}`} value={money(totals.taxCents, currency)} />}
              <div className="mt-2 border-t border-divider pt-2"><Row bold label="Total" value={money(totals.totalCents, currency)} /></div>
            </div>
          </div>

          <Textarea label="Notas para el cliente" minRows={2} value={notes} variant="bordered" onValueChange={setNotes} />
          <Textarea label="Términos y condiciones" minRows={2} value={terms} variant="bordered" onValueChange={setTerms} />
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>Cancelar</Button>
          <Button color="primary" isLoading={saving} onPress={save}>{doc ? "Guardar cambios" : "Crear borrador"}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-black" : "text-default-600"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
