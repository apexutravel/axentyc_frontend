"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Spinner } from "@heroui/spinner";
import { Check, CreditCard, ExternalLink, Lock, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useBilling } from "@/contexts/BillingContext";
import { useWorkspaces } from "@/contexts/WorkspaceContext";
import {
  BillingCycle,
  BillingService,
  PaymentConfig,
  PlanDefinition,
  UNLIMITED,
  formatLimit,
} from "@/lib/billing";

const unwrap = <T,>(res: any): T => (res?.data ?? res) as T;

const STATE_LABEL: Record<string, { text: string; color: "default" | "success" | "warning" | "danger" | "primary" }> = {
  free: { text: "Plan gratuito", color: "default" },
  trialing: { text: "En prueba", color: "primary" },
  trial_expired: { text: "Prueba terminada", color: "danger" },
  active: { text: "Activa", color: "success" },
  past_due: { text: "Pago pendiente", color: "warning" },
  unpaid: { text: "Sin pagar", color: "danger" },
  canceled: { text: "Cancelada", color: "danger" },
  locked: { text: "Bloqueada", color: "danger" },
};

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }) : "-";

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const unlimited = limit === UNLIMITED;
  const pct = unlimited ? 0 : limit === 0 ? (used > 0 ? 100 : 0) : Math.min((used / limit) * 100, 100);
  const hot = !unlimited && pct >= 90;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={`tabular-nums ${hot ? "font-bold text-danger" : "text-default-500"}`}>
          {used.toLocaleString("en-US")} / {limit === 0 ? "No incluido" : formatLimit(limit)}
        </span>
      </div>
      <Progress aria-label={label} color={hot ? "danger" : pct >= 70 ? "warning" : "primary"} size="sm" value={unlimited ? 0 : pct} />
    </div>
  );
}

export default function BillingPanel() {
  const { subscription, access, refresh, isLoading } = useBilling();
  const { canManage } = useWorkspaces();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    BillingService.plans().then((r) => setPlans(unwrap<PlanDefinition[]>(r))).catch(() => undefined);
    BillingService.paymentConfig().then((r) => setConfig(unwrap<PaymentConfig>(r))).catch(() => undefined);
  }, []);

  useEffect(() => {
    const c = subscription?.subscription?.billingCycle;
    if (c) setCycle(c);
    // only when the stored cycle changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscription?.subscription?.billingCycle]);

  // Back from Stripe Checkout: the webhook may take a few seconds to arrive
  const checkout = searchParams.get("checkout");
  useEffect(() => {
    if (checkout === "cancelled") {
      toast.info("El pago se canceló. No se te cobró nada.");
      return;
    }
    if (checkout !== "success") return;
    toast.success("¡Pago recibido! Activando tu plan…");
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      await refresh();
      if (tries >= 8) clearInterval(timer);
    }, 2500);
    return () => clearInterval(timer);
  }, [checkout, refresh]);

  const current = subscription?.plan;
  const sub = subscription?.subscription;
  const state = access?.state || "active";
  const label = STATE_LABEL[state] || STATE_LABEL.active;
  const hasCard = !!sub?.hasPaymentMethod;
  const trialing = state === "trialing";
  const needsPayment = !!access?.paymentRequired || (trialing && !hasCard);

  const choose = useCallback(
    async (plan: PlanDefinition) => {
      if (plan.monthlyPrice === 0 && !window.confirm("¿Pasar al plan Free? Conservarás tu plan actual hasta el final del período pagado.")) return;
      setBusy(plan.key);
      try {
        const result = unwrap<any>(await BillingService.changePlan(plan.key, cycle));
        if (result.action === "checkout" && result.url) {
          window.location.href = result.url;
          return;
        }
        toast.success(result.message || "Plan actualizado");
        await refresh();
      } catch (e: any) {
        toast.error(e?.response?.data?.message || e?.message || "No se pudo cambiar el plan");
      } finally {
        setBusy(null);
      }
    },
    [cycle, refresh],
  );

  const openPortal = async () => {
    setBusy("portal");
    try {
      const { url } = unwrap<{ url: string }>(await BillingService.portal());
      window.location.href = url;
    } catch (e: any) {
      toast.error(e?.message || "No se pudo abrir el portal de pagos");
      setBusy(null);
    }
  };

  const toggleCancel = async (cancel: boolean) => {
    if (cancel && !window.confirm("¿Cancelar la suscripción? Seguirás con acceso hasta el final del período pagado.")) return;
    setBusy(cancel ? "cancel" : "reactivate");
    try {
      await (cancel ? BillingService.cancel() : BillingService.reactivate());
      toast.success(cancel ? "Cancelación programada" : "Suscripción reactivada");
      await refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "No se pudo completar la acción");
    } finally {
      setBusy(null);
    }
  };

  const price = useMemo(() => {
    if (!current) return 0;
    return cycle === "yearly" ? current.yearlyPrice : current.monthlyPrice;
  }, [current, cycle]);

  if (!subscription || !current) {
    return (
      <div className="flex h-40 items-center justify-center">{isLoading ? <Spinner /> : <p className="text-sm text-default-500">No se pudo cargar tu suscripción.</p>}</div>
    );
  }

  const usage = subscription.usage;

  return (
    <div className="mt-6 space-y-6">
      {config && !config.paymentsEnabled && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning-700 dark:text-warning-400">
          <Lock className="mt-0.5 shrink-0" size={18} />
          <span>
            {config.devSelfActivation
              ? "Los pagos no están configurados (modo desarrollo): los planes se activan sin cobro."
              : "Los pagos aún no están disponibles. Contacta a soporte para activar tu plan."}
          </span>
        </div>
      )}

      {/* Current subscription */}
      <Card className="border border-divider">
        <CardBody className="gap-6 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-default-500">Tu plan</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h3 className="text-3xl font-black">{current.name}</h3>
                <Chip color={label.color} variant="flat">{label.text}</Chip>
                {sub?.complimentary && <Chip color="secondary" variant="flat">Cortesía</Chip>}
              </div>
              <p className="mt-2 text-sm text-default-500">
                {price === 0 ? "Gratis" : `$${price}/mes${cycle === "yearly" ? " · facturado anualmente" : ""}`}
                {trialing && access?.trialEndsAt && ` · prueba hasta el ${fmtDate(access.trialEndsAt)}`}
                {state === "active" && sub?.currentPeriodEnd && price > 0 && !sub.cancelAtPeriodEnd && ` · próxima renovación ${fmtDate(sub.currentPeriodEnd)}`}
                {sub?.cancelAtPeriodEnd && ` · termina el ${fmtDate(sub.currentPeriodEnd)}`}
              </p>
            </div>

            {canManage && (
              <div className="flex flex-wrap gap-2">
                {hasCard && (
                  <Button isLoading={busy === "portal"} startContent={<CreditCard size={16} />} variant="flat" onPress={openPortal} endContent={<ExternalLink size={13} />}>
                    Pagos y facturas
                  </Button>
                )}
                {sub?.cancelAtPeriodEnd ? (
                  <Button color="primary" isLoading={busy === "reactivate"} startContent={<RotateCcw size={16} />} variant="flat" onPress={() => toggleCancel(false)}>
                    Reactivar
                  </Button>
                ) : (
                  price > 0 && (
                    <Button color="danger" isLoading={busy === "cancel"} startContent={<XCircle size={16} />} variant="light" onPress={() => toggleCancel(true)}>
                      Cancelar
                    </Button>
                  )
                )}
              </div>
            )}
          </div>

          {needsPayment && canManage && (
            <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm">
                <p className="font-bold">
                  {state === "trial_expired" ? "Activa tu suscripción para recuperar el acceso completo" : "Activa tu suscripción antes de que termine tu prueba"}
                </p>
                <p className="text-default-500">
                  {trialing
                    ? "No se te cobrará nada hasta que termine tu prueba gratis."
                    : "Pago seguro con tarjeta. Puedes cancelar cuando quieras."}
                </p>
              </div>
              <Button
                color="primary"
                isLoading={busy === current.key}
                startContent={<Sparkles size={16} />}
                onPress={() => choose(current.monthlyPrice > 0 ? current : plans.find((p) => p.key === "starter") || current)}
              >
                Activar {current.monthlyPrice > 0 ? current.name : "Starter"}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Usage */}
      <Card className="border border-divider">
        <CardBody className="gap-5 p-6">
          <div>
            <h3 className="text-lg font-bold">Uso de tu plan</h3>
            <p className="text-sm text-default-500">Lo que ya usas frente a lo que incluye {current.name}.</p>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
            <Meter label="Empresas (workspaces)" limit={current.limits.maxWorkspaces} used={usage.workspaces} />
            <Meter label="Usuarios (incluye invitaciones)" limit={current.limits.maxUsers} used={usage.users} />
            <Meter label="Canales conectados" limit={current.limits.maxConnectedAssets} used={usage.connectedAssets.total} />
            <Meter label="Automatizaciones" limit={current.limits.maxAutomations} used={usage.automations} />
            <Meter label="Conversaciones nuevas este mes" limit={current.limits.maxConversationsMonthly} used={usage.conversationsThisMonth} />
          </div>
        </CardBody>
      </Card>

      {/* Plans */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold">Planes</h3>
          <div className="inline-flex gap-1 rounded-full border border-divider bg-content1 p-1 text-sm">
            {(["monthly", "yearly"] as const).map((c) => (
              <button
                key={c}
                className={`rounded-full px-4 py-1.5 font-semibold transition-colors ${cycle === c ? "bg-primary text-white" : "text-default-600"}`}
                type="button"
                onClick={() => setCycle(c)}
              >
                {c === "monthly" ? "Mensual" : "Anual (-20%)"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = current.key === plan.key && (plan.monthlyPrice === 0 || (sub?.billingCycle || "monthly") === cycle);
            const isCurrentPlan = current.key === plan.key;
            const p = cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
            const upgrade = plan.monthlyPrice > current.monthlyPrice;
            const payNow = isCurrentPlan && needsPayment && plan.monthlyPrice > 0;
            return (
              <Card key={plan.key} className={`relative overflow-hidden border ${isCurrentPlan ? "border-primary shadow-lg shadow-primary/10" : "border-divider"}`}>
                {isCurrentPlan && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-secondary" />}
                <CardBody className="gap-4 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-lg font-black">{plan.name}</h4>
                      <p className="mt-1 text-xs text-default-500">{plan.description}</p>
                    </div>
                    {isCurrentPlan && <Chip color="primary" size="sm" variant="flat">Actual</Chip>}
                  </div>
                  <div>
                    <span className="text-3xl font-black">{p === 0 ? "Gratis" : `$${p}`}</span>
                    {p > 0 && <span className="text-xs text-default-500">/mes</span>}
                  </div>
                  <ul className="space-y-1.5 text-xs text-default-600">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2">
                        <Check className="mt-0.5 shrink-0 text-success" size={13} />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                  {canManage && (
                    <Button
                      className="mt-auto"
                      color={payNow || (!isCurrent && upgrade) ? "primary" : "default"}
                      isDisabled={(isCurrent && !payNow) || !!busy}
                      isLoading={busy === plan.key}
                      size="sm"
                      variant={payNow || (!isCurrent && upgrade) ? "solid" : "flat"}
                      onPress={() => choose(plan)}
                    >
                      {payNow ? `Activar ${plan.name}` : isCurrent ? "Plan actual" : plan.monthlyPrice === 0 ? "Pasar a Free" : upgrade ? `Mejorar a ${plan.name}` : `Cambiar a ${plan.name}`}
                    </Button>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
        <p className="text-xs text-default-400">
          Los precios están en {config?.currency || "USD"}. Al cambiar de plan se prorratean los cargos. Si bajas de plan, primero debes ajustar tu uso a los límites del plan nuevo.
        </p>
      </div>
    </div>
  );
}
