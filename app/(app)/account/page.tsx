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
import { useAuth } from "@/contexts/AuthContext";
import { BillingService, PlanDefinition } from "@/lib/billing";

const statusLabels: Record<string, string> = {
  active: "Activa",
  trialing: "En prueba",
  canceled: "Cancelada",
  unpaid: "Pendiente de pago",
  paused: "Pausada",
  past_due: "Pago vencido",
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
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isBillingLoading, setIsBillingLoading] = useState(false);

  const loadBilling = async () => {
    const [plansData, subscriptionData] = await Promise.all([
      BillingService.plans(),
      BillingService.subscription(),
    ]);
    const normalizedPlans = ((plansData as any)?.data ?? plansData) as PlanDefinition[];
    const normalizedSubscription = (subscriptionData as any)?.data ?? subscriptionData;
    setPlans(normalizedPlans);
    setSubscription(normalizedSubscription);
    setBillingCycle(normalizedSubscription?.subscription?.billingCycle || "monthly");
  };

  useEffect(() => {
    loadBilling().catch(() => undefined);
  }, []);

  const handleChangePlan = async (planKey: string) => {
    setIsBillingLoading(true);
    try {
      await BillingService.changePlan(planKey, billingCycle);
      await loadBilling();
      toast.success("Plan actualizado");
    } catch (error: any) {
      toast.error(error.message || "No se pudo cambiar el plan");
    } finally {
      setIsBillingLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsBillingLoading(true);
    try {
      await BillingService.cancel();
      await loadBilling();
      toast.success("Cancelación programada al final del periodo");
    } catch (error: any) {
      toast.error(error.message || "No se pudo cancelar");
    } finally {
      setIsBillingLoading(false);
    }
  };

  const handleReactivate = async () => {
    setIsBillingLoading(true);
    try {
      await BillingService.reactivate();
      await loadBilling();
      toast.success("Suscripción reactivada");
    } catch (error: any) {
      toast.error(error.message || "No se pudo reactivar");
    } finally {
      setIsBillingLoading(false);
    }
  };

  const currentPlanKey = subscription?.subscription?.planKey || subscription?.plan?.key;
  const usage = subscription?.usage?.connectedAssets;
  const connectedAssetsLimit = subscription?.plan?.limits?.maxConnectedAssets || 0;
  const usedAssets = usage?.total || 0;
  const usagePercent = connectedAssetsLimit > 0 ? Math.min((usedAssets / connectedAssetsLimit) * 100, 100) : 0;
  const subscriptionStatus = subscription?.subscription?.status || subscription?.status || "active";
  const currentPlan = subscription?.plan;
  const currentPrice = currentPlan
    ? billingCycle === "yearly"
      ? currentPlan.yearlyPrice
      : currentPlan.monthlyPrice
    : 0;

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
          <div className="space-y-6 mt-6">
            <Card className="overflow-hidden border border-divider">
              <CardBody className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
                  <div className="space-y-5 p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-default-500">Suscripción actual</p>
                        <h3 className="mt-1 text-3xl font-black">{currentPlan?.name || "Cargando..."}</h3>
                        <p className="mt-1 text-sm text-default-500">
                          {statusLabels[subscriptionStatus] || subscriptionStatus} · Ciclo {billingCycle === "yearly" ? "anual" : "mensual"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button color="danger" isDisabled={isBillingLoading || subscription?.subscription?.cancelAtPeriodEnd} startContent={<XCircle size={16} />} variant="flat" onPress={handleCancel}>
                          Cancelar
                        </Button>
                        <Button color="primary" isDisabled={isBillingLoading} startContent={<RotateCcw size={16} />} variant="flat" onPress={handleReactivate}>
                          Reactivar
                        </Button>
                      </div>
                    </div>

                    {subscription?.subscription?.cancelAtPeriodEnd && (
                      <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning-700 dark:text-warning-400">
                        <AlertCircle className="mt-0.5" size={18} />
                        <span>Tu cancelación está programada al final del periodo. Puedes reactivar antes de esa fecha.</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-divider bg-content2/50 p-4">
                        <p className="text-xs text-default-500">Precio</p>
                        <p className="mt-1 text-2xl font-black">{currentPrice === 0 ? "Gratis" : `$${currentPrice}`}</p>
                      </div>
                      <div className="rounded-2xl border border-divider bg-content2/50 p-4">
                        <p className="text-xs text-default-500">Periodo actual</p>
                        <p className="mt-1 text-sm font-bold">Hasta {formatDate(subscription?.subscription?.currentPeriodEnd)}</p>
                      </div>
                      <div className="rounded-2xl border border-divider bg-content2/50 p-4">
                        <p className="text-xs text-default-500">Canales</p>
                        <p className="mt-1 text-2xl font-black">{usedAssets}/{connectedAssetsLimit || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-divider bg-content2/40 p-6 lg:border-l lg:border-t-0">
                    <Select label="Ciclo de facturación" selectedKeys={[billingCycle]} variant="bordered" onSelectionChange={(keys) => {
                      const next = Array.from(keys)[0] as "monthly" | "yearly";
                      if (next) setBillingCycle(next);
                    }}>
                      <SelectItem key="monthly">Mensual</SelectItem>
                      <SelectItem key="yearly">Anual (-20%)</SelectItem>
                    </Select>
                    <p className="mt-3 text-xs text-default-500">
                      Cambiar el ciclo se aplica cuando selecciones un plan. En Stripe real esto abrirá checkout o portal de billing.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {plans.map((plan) => {
                const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
                const isCurrent = currentPlanKey === plan.key;

                return (
                  <Card key={plan.key} className={`relative overflow-hidden border ${isCurrent ? "border-primary shadow-lg shadow-primary/10" : "border-divider"}`}>
                    {isCurrent && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-secondary" />}
                    <CardBody className="gap-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-black">{plan.name}</h4>
                          <p className="mt-1 text-xs text-default-500">{plan.description}</p>
                        </div>
                        {isCurrent && <Chip color="primary" size="sm" variant="flat">Actual</Chip>}
                      </div>
                      <div>
                        <span className="text-3xl font-black">{price === 0 ? "Gratis" : `$${price}`}</span>
                        {price > 0 && <span className="text-xs text-default-500">/mes</span>}
                      </div>
                      <div className="space-y-2 text-xs text-default-600">
                        <p>{plan.limits.maxWorkspaces} workspaces</p>
                        <p>{plan.limits.maxUsers} usuarios</p>
                        <p>{plan.limits.maxConnectedAssets ?? plan.limits.maxSocialAccounts} canales conectados</p>
                        <p>{plan.limits.maxConversationsMonthly.toLocaleString()} conversaciones/mes</p>
                      </div>
                      <Button color={isCurrent ? "default" : "primary"} endContent={!isCurrent && <ArrowUpRight size={15} />} isDisabled={isCurrent || isBillingLoading} size="sm" variant={isCurrent ? "flat" : "solid"} onPress={() => handleChangePlan(plan.key)}>
                        {isCurrent ? "Plan actual" : "Cambiar plan"}
                      </Button>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        </Tab>

        <Tab key="payments" title="Pagos">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card className="border border-divider">
              <CardBody className="gap-5 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <WalletCards size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Método de pago</h3>
                    <p className="text-sm text-default-500">Tarjeta principal para suscripción y overages.</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-dashed border-divider bg-content2/50 p-8 text-center">
                  <CreditCard className="mx-auto text-default-400" size={34} />
                  <p className="mt-3 font-bold">Sin tarjeta vinculada</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-default-500">
                    El billing actual es manual. Cuando conectemos Stripe, aquí se abrirá el portal para agregar tarjetas.
                  </p>
                </div>
                <Button isDisabled color="primary" startContent={<CreditCard size={16} />}>
                  Vincular tarjeta
                </Button>
              </CardBody>
            </Card>

            <Card className="border border-divider">
              <CardBody className="gap-5 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Facturas y recibos</h3>
                    <p className="text-sm text-default-500">Historial financiero de la cuenta.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-divider p-4">
                    <div className="flex items-center gap-3">
                      <CalendarClock className="text-default-400" size={18} />
                      <div>
                        <p className="text-sm font-bold">Próxima factura</p>
                        <p className="text-xs text-default-500">{formatDate(subscription?.subscription?.currentPeriodEnd)}</p>
                      </div>
                    </div>
                    <Chip variant="flat">Manual</Chip>
                  </div>
                  <div className="rounded-2xl border border-divider p-4 text-sm text-default-500">
                    No hay facturas disponibles todavía. Stripe agregará invoices, recibos descargables y estado de pagos.
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </motion.div>
  );
}
