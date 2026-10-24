"use client";

import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { motion } from "framer-motion";
import { CreditCard, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { API_URL } from "@/config/api";
import { fmtDate, money, PAYMENT_METHODS, SalesDoc, unwrap } from "@/lib/crm";
import { useBilling } from "@/contexts/BillingContext";
import { useWorkspaces } from "@/contexts/WorkspaceContext";

export default function PaymentsPage() {
  const { can, isLoading: billingLoading } = useBilling();
  const { activeWorkspace } = useWorkspaces();
  const [invoices, setInvoices] = useState<SalesDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!can("invoicing")) return setLoading(false);
    api.get(`${API_URL}/sales-documents?type=invoice`).then((r) => setInvoices(unwrap<SalesDoc[]>(r) || [])).catch(() => undefined).finally(() => setLoading(false));
  }, [can]);

  const payments = useMemo(
    () =>
      invoices
        .filter((i) => i.status !== "void")
        .flatMap((i) => i.payments.map((p) => ({ ...p, number: i.number, invoiceId: i._id, currency: i.currency, client: typeof i.contactId === "object" ? i.contactId.name : "-" })))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [invoices],
  );

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const total = (f: (p: (typeof payments)[number]) => boolean) => payments.filter(f).reduce((s, p) => s + p.amountCents, 0);
  const currency = (activeWorkspace?.currency || "USD").toUpperCase();

  if (!billingLoading && !can("invoicing")) {
    return (
      <Card className="mx-auto mt-10 max-w-lg border border-divider">
        <CardBody className="items-center gap-3 p-10 text-center">
          <Lock className="text-primary" size={32} />
          <h2 className="text-xl font-bold">Pagos</h2>
          <p className="text-sm text-default-500">Los pagos se registran sobre facturas. Mejora tu plan para usar facturación.</p>
          <Button as={NextLink} color="primary" href="/account?tab=billing">Ver planes</Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-6" initial={{ opacity: 0, y: 20 }}>
      <div>
        <Chip color="primary" size="sm" startContent={<CreditCard size={14} />} variant="flat">{activeWorkspace?.name}</Chip>
        <h1 className="mt-2 text-2xl font-bold">Pagos recibidos</h1>
        <p className="mt-1 text-sm text-default-500">Todos los pagos registrados en tus facturas. Para registrar uno, abre la factura.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border border-divider"><CardBody className="gap-1 p-5"><p className="text-xs text-default-500">Este mes</p><p className="text-2xl font-black tabular-nums">{money(total((p) => new Date(p.date).getTime() >= monthStart), currency)}</p></CardBody></Card>
        <Card className="border border-divider"><CardBody className="gap-1 p-5"><p className="text-xs text-default-500">Total cobrado</p><p className="text-2xl font-black tabular-nums">{money(total(() => true), currency)}</p></CardBody></Card>
        <Card className="border border-divider"><CardBody className="gap-1 p-5"><p className="text-xs text-default-500">Pagos registrados</p><p className="text-2xl font-black">{payments.length}</p></CardBody></Card>
      </div>

      <Card className="border border-divider">
        <CardBody className="p-0">
          {loading ? (
            <div className="flex h-32 items-center justify-center"><Spinner /></div>
          ) : payments.length === 0 ? (
            <p className="p-10 text-center text-sm text-default-500">Todavía no has registrado pagos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-content2 text-xs text-default-500">
                  <tr><th className="p-3 text-left">Fecha</th><th className="p-3 text-left">Factura</th><th className="p-3 text-left">Cliente</th><th className="p-3 text-left">Método</th><th className="p-3 text-left">Referencia</th><th className="p-3 text-right">Monto</th></tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id} className="border-t border-divider">
                      <td className="p-3 text-default-500">{fmtDate(p.date)}</td>
                      <td className="p-3"><NextLink className="font-semibold text-primary" href={`/invoices?open=${p.invoiceId}`}>{p.number}</NextLink></td>
                      <td className="p-3">{p.client}</td>
                      <td className="p-3">{PAYMENT_METHODS[p.method] || p.method}</td>
                      <td className="p-3 text-default-500">{p.reference || "-"}</td>
                      <td className="p-3 text-right tabular-nums">{money(p.amountCents, p.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
}
