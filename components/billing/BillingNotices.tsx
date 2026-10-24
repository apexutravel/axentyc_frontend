"use client";

import { useEffect } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Clock, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";
import { useBilling } from "@/contexts/BillingContext";
import { useWorkspaces } from "@/contexts/WorkspaceContext";

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long" }) : "";

/** Top-of-page notice about the trial / payment state. Renders nothing when everything is fine. */
export function SubscriptionBanner() {
  const { access, subscription } = useBilling();
  const { canManage } = useWorkspaces();
  if (!access || !subscription) return null;

  const plan = subscription.plan.name;
  let tone: "info" | "warning" | "danger" | null = null;
  let Icon = Clock;
  let text = "";
  let cta = "Activar suscripción";

  switch (access.state) {
    case "trialing": {
      const days = access.trialDaysLeft ?? 0;
      tone = days <= 3 ? "warning" : "info";
      text =
        days <= 0
          ? `Tu prueba gratis de ${plan} termina hoy.`
          : `Prueba gratis de ${plan}: te ${days === 1 ? "queda 1 día" : `quedan ${days} días`} (hasta el ${fmt(access.trialEndsAt)}).`;
      text += " Activa tu suscripción para no perder el acceso.";
      break;
    }
    case "trial_expired":
      tone = "danger";
      Icon = Lock;
      text = `Tu prueba gratis de ${plan} terminó. Tu cuenta está en modo solo lectura: puedes ver tus datos pero no crear ni responder hasta activar tu suscripción.`;
      break;
    case "past_due":
      tone = access.readOnly ? "danger" : "warning";
      Icon = access.readOnly ? Lock : AlertTriangle;
      text = access.readOnly
        ? "No pudimos cobrar tu suscripción y tu cuenta pasó a modo solo lectura."
        : `No pudimos cobrar tu suscripción. Actualiza tu método de pago antes del ${fmt(access.graceEndsAt)} para evitar interrupciones.`;
      cta = "Actualizar pago";
      break;
    case "unpaid":
    case "canceled":
      tone = "danger";
      Icon = Lock;
      text = "Tu suscripción no está activa. Tu cuenta está en modo solo lectura.";
      cta = "Reactivar";
      break;
    case "active":
      if (access.endsAt) {
        tone = "info";
        text = `Tu plan ${plan} termina el ${fmt(access.endsAt)}. Después pasarás al plan Free.`;
        cta = "Reactivar";
      }
      break;
    default:
      break;
  }
  if (!tone) return null;

  const styles = {
    info: "border-primary/30 bg-primary/10 text-primary-700 dark:text-primary-300",
    warning: "border-warning/40 bg-warning/15 text-warning-700 dark:text-warning-400",
    danger: "border-danger/40 bg-danger/10 text-danger-700 dark:text-danger-400",
  }[tone];

  return (
    <div className={`flex flex-wrap items-center gap-3 border-b px-6 py-2.5 text-sm ${styles}`} role="status">
      <Icon className="shrink-0" size={16} />
      <p className="min-w-0 flex-1">{text}</p>
      {canManage ? (
        <NextLink
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90"
          href="/account?tab=billing"
        >
          <CreditCard size={13} />
          {cta}
        </NextLink>
      ) : (
        <span className="shrink-0 text-xs opacity-80">Avisa al administrador de tu cuenta.</span>
      )}
    </div>
  );
}

/** Turns API refusals (402 / plan limit) into a toast with a way out. */
export function BillingEventsHandler() {
  const router = useRouter();
  const { canManage } = useWorkspaces();

  useEffect(() => {
    const onBlocked = (event: Event) => {
      const detail = (event as CustomEvent).detail as { message?: string; code?: string; status?: number } | undefined;
      const isPayment = detail?.status === 402;
      toast.error(detail?.message || (isPayment ? "Tu cuenta está en modo solo lectura." : "Llegaste al límite de tu plan."), {
        id: "billing-blocked",
        duration: 8000,
        action: canManage
          ? { label: isPayment ? "Activar suscripción" : "Mejorar plan", onClick: () => router.push("/account?tab=billing") }
          : undefined,
      });
    };
    window.addEventListener("axentyc:billing-blocked", onBlocked);
    return () => window.removeEventListener("axentyc:billing-blocked", onBlocked);
  }, [router, canManage]);

  return null;
}
