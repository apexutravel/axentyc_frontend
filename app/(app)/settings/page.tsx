"use client";

import NextLink from "next/link";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { motion } from "framer-motion";
import { Building2, CreditCard, Settings, User } from "lucide-react";

export default function SettingsPage() {
  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-6" initial={{ opacity: 0, y: 20 }}>
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-default-500 text-sm mt-1">
          La configuración ahora está separada entre Cuenta y Workspace para evitar mezclar pagos con operación.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-divider">
          <CardBody className="gap-4 p-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Cuenta</h2>
              <p className="text-sm text-default-500 mt-1">
                Perfil del usuario, seguridad, facturación, tarjetas, pagos y cambio de plan.
              </p>
            </div>
            <NextLink href="/account">
              <Button color="primary" startContent={<CreditCard size={16} />}>
                Ir a Cuenta
              </Button>
            </NextLink>
          </CardBody>
        </Card>

        <Card className="border border-divider">
          <CardBody className="gap-4 p-6">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Workspace</h2>
              <p className="text-sm text-default-500 mt-1">
                Datos de la empresa, marca, cliente o sucursal activa y administración de workspaces.
              </p>
            </div>
            <NextLink href="/workspace-settings">
              <Button startContent={<Settings size={16} />} variant="flat">
                Ir a Workspace
              </Button>
            </NextLink>
          </CardBody>
        </Card>
      </div>
    </motion.div>
  );
}
