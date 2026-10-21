"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { motion } from "framer-motion";
import { FileText, Handshake, Plus, Sparkles } from "lucide-react";
import { useWorkspaces } from "@/contexts/WorkspaceContext";

export default function QuotesPage() {
  const { activeWorkspace } = useWorkspaces();

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-6" initial={{ opacity: 0, y: 20 }}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Chip color="primary" startContent={<FileText size={14} />} variant="flat">
            Workspace: {activeWorkspace?.name || "activo"}
          </Chip>
          <h1 className="mt-3 text-2xl font-bold">Cotizaciones</h1>
          <p className="mt-1 max-w-2xl text-sm text-default-500">
            Prepara propuestas comerciales conectadas a contactos, deals, productos y futuros invoices del workspace.
          </p>
        </div>
        <Button color="primary" isDisabled startContent={<Plus size={16} />}>
          Nueva cotización
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border border-divider">
          <CardBody className="gap-2 p-5">
            <p className="text-xs text-default-500">Pendientes</p>
            <p className="text-3xl font-black">0</p>
          </CardBody>
        </Card>
        <Card className="border border-divider">
          <CardBody className="gap-2 p-5">
            <p className="text-xs text-default-500">Aprobadas</p>
            <p className="text-3xl font-black">0</p>
          </CardBody>
        </Card>
        <Card className="border border-divider">
          <CardBody className="gap-2 p-5">
            <p className="text-xs text-default-500">Valor estimado</p>
            <p className="text-3xl font-black">$0</p>
          </CardBody>
        </Card>
      </div>

      <Card className="border border-dashed border-divider bg-content1">
        <CardBody className="items-center gap-4 p-10 text-center">
          <div className="rounded-3xl bg-primary/10 p-4 text-primary">
            <Handshake size={34} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Módulo comercial en preparación</h2>
            <p className="mt-1 max-w-xl text-sm text-default-500">
              Aquí vivirán las cotizaciones por workspace, conectadas al pipeline de deals y listas para convertirse en invoices.
            </p>
          </div>
          <Chip startContent={<Sparkles size={13} />} variant="flat">
            Próximo: productos, impuestos, PDF y aprobación por cliente
          </Chip>
        </CardBody>
      </Card>
    </motion.div>
  );
}
