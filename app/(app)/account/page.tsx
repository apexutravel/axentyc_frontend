"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Tabs, Tab } from "@heroui/tabs";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  Check,
  CreditCard,
  FileText,
  KeyRound,
  Lock,
  Mail,
  ReceiptText,
  RotateCcw,
  Shield,
  Sparkles,
  User,
  WalletCards,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useBilling } from "@/contexts/BillingContext";
import BillingPanel from "@/components/billing/BillingPanel";

const statusLabels: Record<string, string> = {
  free: "Plan gratuito",
  trialing: "En prueba",
  trial_expired: "Prueba terminada",
  active: "Activa",
  past_due: "Pago pendiente",
  unpaid: "Sin pagar",
  canceled: "Cancelada",
  locked: "Bloqueada",
};

function formatDate(value?: string | Date) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AccountPage() {
  const { user } = useAuth();
  const { subscription: billing, access } = useBilling();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<string>(searchParams.get("tab") || "overview");

  useEffect(() => {
    const requested = searchParams.get("tab");
    if (requested) setTab(requested);
  }, [searchParams]);

  const currentPlan = billing?.plan;
  const subscriptionStatus = access?.state || "active";
  const usedAssets = billing?.usage.connectedAssets.total ?? 0;
  const connectedAssetsLimit = currentPlan?.limits.maxConnectedAssets ?? 0;
  const usagePercent = connectedAssetsLimit > 0 ? Math.min((usedAssets / connectedAssetsLimit) * 100, 100) : 0;

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-6" initial={{ opacity: 0, y: 20 }}>
      <section className="relative overflow-hidden rounded-3xl border border-divider bg-gradient-to-br from-primary/15 via-content1 to-secondary/10 p-6 md:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Chip color="primary" startContent={<BadgeCheck size={14} />} variant="flat">
              Centro de cuenta
            </Chip>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">Tu cuenta AXENTYC</h1>
            <p className="mt-2 text-sm text-default-500 md:text-base">
              Gestiona identidad, acceso, plan, pagos y facturación de la cuenta que paga la suscripción.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[520px]">
            <div className="rounded-2xl border border-white/20 bg-content1/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs text-default-500">Plan</p>
              <p className="mt-1 text-xl font-black">{currentPlan?.name || "-"}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-content1/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs text-default-500">Estado</p>
              <p className="mt-1 text-xl font-black">{statusLabels[subscriptionStatus] || subscriptionStatus}</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/20 bg-content1/80 p-4 shadow-sm backdrop-blur sm:col-span-1">
              <p className="text-xs text-default-500">Canales</p>
              <p className="mt-1 text-xl font-black">{usedAssets}/{connectedAssetsLimit || "-"}</p>
            </div>
          </div>
        </div>
      </section>

      <Tabs
        selectedKey={tab}
        onSelectionChange={(key) => setTab(String(key))}
        classNames={{
          tabList: "bg-content1 border border-divider p-1",
          cursor: "bg-primary",
          tab: "data-[selected=true]:text-primary-foreground text-default-600",
          tabContent: "group-data-[selected=true]:text-primary-foreground",
        }}
        radius="full"
        variant="light"
      >
        <Tab key="overview" title="Resumen">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            <Card className="border border-divider xl:col-span-2">
              <CardBody className="gap-6 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-default-500">Perfil principal</p>
                    <h2 className="mt-1 text-2xl font-black">
                      {user?.firstName || "Usuario"} {user?.lastName || ""}
                    </h2>
                    <p className="mt-1 flex items-center gap-2 text-sm text-default-500">
                      <Mail size={14} /> {user?.email || "-"}
                    </p>
                  </div>
                  <Chip color="success" startContent={<Check size={14} />} variant="flat">
                    Sesión protegida
                  </Chip>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-divider bg-content2/50 p-4">
                    <Shield className="text-primary" size={20} />
                    <p className="mt-3 text-sm font-bold">Seguridad</p>
                    <p className="mt-1 text-xs text-default-500">Contraseña y acceso personal.</p>
                  </div>
                  <div className="rounded-2xl border border-divider bg-content2/50 p-4">
                    <CreditCard className="text-primary" size={20} />
                    <p className="mt-3 text-sm font-bold">Facturación</p>
                    <p className="mt-1 text-xs text-default-500">Plan, ciclo y límites.</p>
                  </div>
                  <div className="rounded-2xl border border-divider bg-content2/50 p-4">
                    <ReceiptText className="text-primary" size={20} />
                    <p className="mt-3 text-sm font-bold">Pagos</p>
                    <p className="mt-1 text-xs text-default-500">Tarjetas e invoices con Stripe.</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-divider">
              <CardBody className="gap-5 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-default-500">Uso del plan</p>
                    <h3 className="text-xl font-black">Canales conectados</h3>
                  </div>
                  <Sparkles className="text-primary" size={22} />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>{usedAssets} usados</span>
                    <span className="text-default-500">{connectedAssetsLimit || "-"} incluidos</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-default-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${usagePercent}%` }} />
                  </div>
                </div>
                <div className="rounded-2xl border border-divider bg-content2/50 p-4 text-xs text-default-500">
                  Un canal conectado puede ser Meta, Instagram, WhatsApp, email o widget. Las capacidades como Messenger y comentarios se incluyen dentro del canal.
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="profile" title="Perfil y seguridad">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            <Card className="border border-divider xl:col-span-2">
              <CardBody className="gap-5 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <User size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Datos personales</h3>
                    <p className="text-sm text-default-500">Identidad global del usuario registrado.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input isReadOnly label="Nombre" value={user?.firstName || ""} variant="bordered" />
                  <Input isReadOnly label="Apellido" value={user?.lastName || ""} variant="bordered" />
                  <Input isReadOnly className="md:col-span-2" label="Email" startContent={<Mail size={16} />} value={user?.email || ""} variant="bordered" />
                </div>
                <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning-700 dark:text-warning-400">
                  La edición de perfil queda lista visualmente; falta conectar el endpoint seguro para actualizar usuario autenticado.
                </div>
              </CardBody>
            </Card>

            <Card className="border border-divider">
              <CardBody className="gap-5 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Lock size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Acceso</h3>
                    <p className="text-sm text-default-500">Contraseña y protección.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-divider p-4">
                    <p className="text-sm font-bold">Contraseña</p>
                    <p className="mt-1 text-xs text-default-500">Requiere endpoint dedicado para cambio seguro.</p>
                  </div>
                  <div className="rounded-2xl border border-divider p-4">
                    <p className="text-sm font-bold">2FA</p>
                    <p className="mt-1 text-xs text-default-500">Preparado para futuro segundo factor.</p>
                  </div>
                </div>
                <Button isDisabled startContent={<KeyRound size={16} />} variant="flat">
                  Cambiar contraseña
                </Button>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="billing" title="Plan y facturación">
          <BillingPanel />
        </Tab>
      </Tabs>
    </motion.div>
  );
}
