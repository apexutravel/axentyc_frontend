"use client";

import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { motion } from "framer-motion";
import { CreditCard, ReceiptText, Sparkles } from "lucide-react";
import { useWorkspaces } from "@/contexts/WorkspaceContext";

export default function PaymentsPage() {
  const { activeWorkspace } = useWorkspaces();

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-6" initial={{ opacity: 0, y: 20 }}>
      <div>
        <Chip color="primary" startContent={<CreditCard size={14} />} variant="flat">
          Workspace: {activeWorkspace?.name || "activo"}
        </Chip>
        <h1 className="mt-3 text-2xl font-bold">Payments</h1>
        <p className="mt-1 max-w-2xl text-sm text-default-500">
          Pagos operativos del workspace: cobros recibidos, pendientes, vencidos y conciliación con invoices.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border border-divider">
          <CardBody className="gap-2 p-5">
            <p className="text-xs text-default-500">Recibido</p>
            <p className="text-3xl font-black">$0</p>
          </CardBody>
        </Card>
        <Card className="border border-divider">
          <CardBody className="gap-2 p-5">
            <p className="text-xs text-default-500">Pendiente</p>
            <p className="text-3xl font-black">$0</p>
          </CardBody>
        </Card>
        <Card className="border border-divider">
          <CardBody className="gap-2 p-5">
            <p className="text-xs text-default-500">Transacciones</p>
            <p className="text-3xl font-black">0</p>
          </CardBody>
        </Card>
      </div>

      <Card className="border border-dashed border-divider bg-content1">
        <CardBody className="items-center gap-4 p-10 text-center">
          <div className="rounded-3xl bg-primary/10 p-4 text-primary">
            <ReceiptText size={34} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Pagos del workspace</h2>
            <p className="mt-1 max-w-xl text-sm text-default-500">
              Este módulo se conectará con invoices, recordatorios automáticos y reportes financieros del dashboard.
            </p>
          </div>
          <Chip startContent={<Sparkles size={13} />} variant="flat">
            Próximo: Stripe, estados de pago, recibos y conciliación
          </Chip>
        </CardBody>
      </Card>
    </motion.div>
  );
}
