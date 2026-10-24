"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { ArrowRightLeft, Ban, CheckCircle2, Download, Mail, Pencil, Plus, Send, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { API_URL } from "@/config/api";
import { DOC_STATUS, download, errorMessage, fmtDate, money, PAYMENT_METHODS, SalesDoc, toCents, unwrap } from "@/lib/crm";

interface Props {
  doc: SalesDoc | null;
  onClose: () => void;
  /** Called with the fresh document after any change; null when it was deleted */
  onChanged: (doc: SalesDoc | null) => void;
  onEdit: (doc: SalesDoc) => void;
  onOpenOther: (id: string) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function DocumentDetail({ doc, onClose, onChanged, onEdit, onOpenOther }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("zelle");
  const [payDate, setPayDate] = useState(today());
  const [payRef, setPayRef] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendMessage, setSendMessage] = useState("");

  if (!doc) return null;
  const contact = typeof doc.contactId === "object" ? doc.contactId : null;
  const isInvoice = doc.type === "invoice";
  const st = DOC_STATUS[doc.displayStatus] || DOC_STATUS.draft;
  const label = isInvoice ? "Factura" : "Cotización";
  const open = doc.status !== "void";
  const canPay = isInvoice && !["void", "paid"].includes(doc.status) && doc.balanceCents > 0;

  const run = async <T,>(key: string, fn: () => Promise<T>, ok?: string) => {
    setBusy(key);
    try {
      const result = await fn();
      if (ok) toast.success(ok);
      return result;
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo completar la acción"));
      return undefined;
    } finally {
      setBusy(null);
    }
  };

  const post = (path: string, body: any = {}) => api.post(`${API_URL}/sales-documents/${doc._id}${path}`, body).then((r) => unwrap<SalesDoc>(r));

  const addPayment = async () => {
    const cents = toCents(payAmount);
    if (!cents) return toast.error("Indica un monto válido");
    const updated = await run("pay", () => post("/payments", { amountCents: cents, method: payMethod, date: payDate ? new Date(payDate + "T12:00:00").toISOString() : undefined, reference: payRef || undefined }), "Pago registrado");
    if (updated) {
      onChanged(updated);
      setPayAmount("");
      setPayRef("");
      window.dispatchEvent(new Event("axentyc:billing-changed"));
    }
  };

  const removePayment = async (id: string) => {
    if (!window.confirm("¿Eliminar este pago?")) return;
    const updated = await run("unpay", () => api.delete(`${API_URL}/sales-documents/${doc._id}/payments/${id}`).then((r) => unwrap<SalesDoc>(r)), "Pago eliminado");
    if (updated) onChanged(updated);
  };

  const setStatus = async (status: string, ok: string, confirm?: string) => {
    if (confirm && !window.confirm(confirm)) return;
    const updated = await run(status, () => post("/status", { status }), ok);
    if (updated) onChanged(updated);
  };

  const convert = async () => {
    const invoice = await run("convert", () => post("/convert"), "Cotización convertida en factura");
    if (invoice) {
      const refreshed = unwrap<SalesDoc>(await api.get(`${API_URL}/sales-documents/${doc._id}`));
      onChanged(refreshed);
      onOpenOther(invoice._id);
    }
  };

  const remove = async () => {
    if (!window.confirm(`¿Eliminar el borrador ${doc.number}?`)) return;
    const ok = await run("delete", () => api.delete(`${API_URL}/sales-documents/${doc._id}`), "Borrador eliminado");
    if (ok !== undefined) onChanged(null);
  };

  const openSend = () => {
    setSendTo(contact?.email || "");
    setSendSubject("");
    setSendMessage("");
    setSendOpen(true);
  };

  const send = async () => {
    const updated = await run("send", () => post("/send", { to: sendTo || undefined, subject: sendSubject || undefined, message: sendMessage || undefined }), `${label} enviada por email`);
    if (updated) {
      setSendOpen(false);
      onChanged(updated);
    }
  };

  return (
    <>
      <Modal isOpen={!!doc} scrollBehavior="inside" size="3xl" onOpenChange={(o) => !o && onClose()}>
        <ModalContent>
          <ModalHeader className="flex flex-wrap items-center gap-3">
            <span>{label} {doc.number}</span>
            <Chip color={st.color} size="sm" variant="flat">{st.label}</Chip>
            {doc.sourceQuoteId && <Chip size="sm" variant="bordered">Desde cotización</Chip>}
          </ModalHeader>
          <ModalBody className="gap-5">
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <Info label="Cliente" value={contact?.name || "-"} sub={contact?.email} />
              <Info label="Fecha" value={fmtDate(doc.issueDate)} />
              <Info label={isInvoice ? "Vence" : "Válida hasta"} value={fmtDate(doc.dueDate)} />
              <Info label="Enviado" value={doc.sentAt ? fmtDate(doc.sentAt, true) : "No"} />
            </div>

            <div className="overflow-x-auto rounded-xl border border-divider">
              <table className="w-full text-sm">
                <thead className="bg-content2 text-xs text-default-500">
                  <tr><th className="p-2 text-left">Concepto</th><th className="p-2 text-right">Cant.</th><th className="p-2 text-right">Precio</th><th className="p-2 text-right">Importe</th></tr>
                </thead>
                <tbody>
                  {doc.lines.map((l, i) => (
                    <tr key={i} className="border-t border-divider">
                      <td className="p-2">{l.description}{l.discountPct ? <span className="ml-1 text-xs text-default-400">(-{l.discountPct}%)</span> : null}{!l.taxable && <span className="ml-1 text-xs text-default-400">· sin impuesto</span>}</td>
                      <td className="p-2 text-right tabular-nums">{l.quantity}</td>
                      <td className="p-2 text-right tabular-nums">{money(l.unitPriceCents, doc.currency)}</td>
                      <td className="p-2 text-right tabular-nums">{money(l.amountCents, doc.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
              <T label="Subtotal" value={money(doc.subtotalCents, doc.currency)} />
              {doc.discountCents > 0 && <T label={`Descuento (${doc.discountPct}%)`} value={`-${money(doc.discountCents, doc.currency)}`} />}
              {doc.taxRatePct > 0 && <T label={`${doc.taxName || "Impuesto"} ${doc.taxRatePct}%${doc.taxIncluded ? " (incluido)" : ""}`} value={money(doc.taxCents, doc.currency)} />}
              <div className="border-t border-divider pt-1"><T bold label="Total" value={money(doc.totalCents, doc.currency)} /></div>
              {isInvoice && doc.amountPaidCents > 0 && (
                <>
                  <T label="Pagado" value={`-${money(doc.amountPaidCents, doc.currency)}`} />
                  <T bold label="Saldo" value={money(doc.balanceCents, doc.currency)} />
                </>
              )}
            </div>

            {doc.notes && <p className="whitespace-pre-wrap rounded-lg bg-content2 p-3 text-sm"><b>Notas: </b>{doc.notes}</p>}

            {isInvoice && (
              <section className="space-y-3 rounded-2xl border border-divider p-4">
                <p className="text-sm font-bold">Pagos</p>
                {doc.payments.length === 0 ? (
                  <p className="text-xs text-default-500">Aún no hay pagos registrados.</p>
                ) : (
                  <ul className="divide-y divide-divider text-sm">
                    {doc.payments.map((p) => (
                      <li key={p._id} className="flex items-center justify-between gap-2 py-2">
                        <span>{fmtDate(p.date)} · <b>{PAYMENT_METHODS[p.method] || p.method}</b>{p.reference ? ` · ${p.reference}` : ""}</span>
                        <span className="flex items-center gap-2 tabular-nums">{money(p.amountCents, doc.currency)}
                          <Button isIconOnly color="danger" isDisabled={!!busy} size="sm" variant="light" onPress={() => removePayment(p._id)}><Trash2 size={13} /></Button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {canPay && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      <Input inputMode="decimal" label="Monto" placeholder={(doc.balanceCents / 100).toFixed(2)} size="sm" startContent={<span className="text-xs">$</span>} value={payAmount} variant="bordered" onValueChange={setPayAmount} />
                      <Select label="Método" selectedKeys={[payMethod]} size="sm" variant="bordered" onSelectionChange={(k) => { const v = Array.from(k)[0] as string; if (v) setPayMethod(v); }}>
                        {Object.entries(PAYMENT_METHODS).map(([k, l]) => <SelectItem key={k}>{l}</SelectItem>)}
                      </Select>
                      <Input label="Fecha" size="sm" type="date" value={payDate} variant="bordered" onValueChange={setPayDate} />
                      <Input label="Referencia" size="sm" value={payRef} variant="bordered" onValueChange={setPayRef} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button color="primary" isLoading={busy === "pay"} size="sm" startContent={<Plus size={14} />} onPress={addPayment}>Registrar pago</Button>
                      <Button isDisabled={!!busy} size="sm" variant="flat" onPress={() => setPayAmount((doc.balanceCents / 100).toFixed(2))}>Pagar el saldo completo</Button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </ModalBody>
          <ModalFooter className="flex-wrap justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Button isLoading={busy === "pdf"} size="sm" startContent={<Download size={14} />} variant="flat" onPress={() => run("pdf", () => download(`/sales-documents/${doc._id}/pdf`, `${doc.number}.pdf`))}>PDF</Button>
              {open && <Button size="sm" startContent={<Mail size={14} />} variant="flat" onPress={openSend}>Enviar por email</Button>}
              {doc.status === "draft" && <Button size="sm" startContent={<Pencil size={14} />} variant="flat" onPress={() => onEdit(doc)}>Editar</Button>}
              {open && doc.status !== "draft" && <Button size="sm" startContent={<Pencil size={14} />} variant="light" onPress={() => onEdit(doc)}>Notas / fechas</Button>}
              {doc.status === "draft" && <Button isLoading={busy === "sent"} size="sm" startContent={<Send size={14} />} variant="flat" onPress={() => setStatus("sent", "Marcada como enviada")}>Marcar enviada</Button>}
              {!isInvoice && doc.status === "sent" && (
                <>
                  <Button color="success" isLoading={busy === "accepted"} size="sm" startContent={<CheckCircle2 size={14} />} variant="flat" onPress={() => setStatus("accepted", "Cotización aceptada")}>Aceptada</Button>
                  <Button color="danger" isLoading={busy === "rejected"} size="sm" startContent={<XCircle size={14} />} variant="flat" onPress={() => setStatus("rejected", "Cotización rechazada")}>Rechazada</Button>
                </>
              )}
              {!isInvoice && !doc.convertedToId && !["void", "rejected"].includes(doc.status) && (
                <Button color="primary" isLoading={busy === "convert"} size="sm" startContent={<ArrowRightLeft size={14} />} onPress={convert}>Convertir en factura</Button>
              )}
              {doc.convertedToId && <Button size="sm" variant="bordered" onPress={() => onOpenOther(doc.convertedToId!)}>Ver factura</Button>}
            </div>
            <div className="flex gap-2">
              {doc.status === "draft" && <Button color="danger" isLoading={busy === "delete"} size="sm" startContent={<Trash2 size={14} />} variant="light" onPress={remove}>Eliminar</Button>}
              {open && doc.status !== "draft" && doc.amountPaidCents === 0 && (
                <Button color="danger" isLoading={busy === "void"} size="sm" startContent={<Ban size={14} />} variant="light" onPress={() => setStatus("void", "Documento anulado", `¿Anular ${doc.number}? No se puede deshacer.`)}>Anular</Button>
              )}
              <Button size="sm" onPress={onClose}>Cerrar</Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={sendOpen} size="lg" onOpenChange={setSendOpen}>
        <ModalContent>
          <ModalHeader>Enviar {label.toLowerCase()} {doc.number}</ModalHeader>
          <ModalBody className="gap-3">
            <p className="text-xs text-default-500">Se envía con el PDF adjunto desde la cuenta de email predeterminada de la empresa.</p>
            <Input label="Para" type="email" value={sendTo} variant="bordered" onValueChange={setSendTo} />
            <Input label="Asunto (opcional)" value={sendSubject} variant="bordered" onValueChange={setSendSubject} />
            <Textarea label="Mensaje (opcional)" minRows={3} value={sendMessage} variant="bordered" onValueChange={setSendMessage} />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setSendOpen(false)}>Cancelar</Button>
            <Button color="primary" isLoading={busy === "send"} startContent={<Mail size={14} />} onPress={send}>Enviar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

function Info({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-default-400">{label}</p>
      <p className="font-medium">{value}</p>
      {sub && <p className="truncate text-xs text-default-500">{sub}</p>}
    </div>
  );
}

function T({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-black" : "text-default-600"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
