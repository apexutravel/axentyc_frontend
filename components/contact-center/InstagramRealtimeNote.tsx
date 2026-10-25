"use client";

import { useCallback, useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { API_URL } from "@/config/api";

const FRESH_MS = 24 * 3600 * 1000;

function formatDate(value: string) {
  return new Date(value).toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export interface RealtimeState {
  ok: boolean;
  error?: string | null;
}

/**
 * Real time is set up and re-verified by the server on its own. This only talks to the user when something
 * is genuinely wrong (Meta refused it), and then offers a manual retry.
 */
export function InstagramRealtimeNote({
  lastWebhookAt,
  realtime,
  onRepaired,
}: {
  lastWebhookAt?: string | null;
  realtime?: RealtimeState | null;
  onRepaired?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const live = !!lastWebhookAt && Date.now() - new Date(lastWebhookAt).getTime() < FRESH_MS;
  const broken = realtime?.ok === false;

  const repair = async () => {
    setBusy(true);
    try {
      const res: any = await api.post(`${API_URL}/integrations/instagram/repair-webhooks`, {});
      const data = res?.data ?? res;
      const app = data?.appWebhook;
      if (app?.status === "error") {
        toast.error(`Meta no permitió activarlo: ${app.message}`);
      } else {
        toast.success(
          app?.status === "ok"
            ? "Todo estaba en orden. Envía un mensaje de prueba a tu Instagram para confirmar."
            : "Tiempo real restablecido. Envía un mensaje de prueba a tu Instagram para confirmar.",
        );
        onRepaired?.();
      }
    } catch (e: any) {
      toast.error(e?.message || "No se pudo activar el tiempo real");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-start gap-2 text-[11px] text-default-500">
      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${broken ? "bg-warning" : "bg-success"}`} />
      <p className="min-w-0 flex-1">
        {broken
          ? `Instagram no está enviando en tiempo real${realtime?.error ? ` (${realtime.error})` : ""}. Mientras tanto se revisa cada 20 segundos.`
          : live
            ? `Tiempo real activo · último evento ${formatDate(lastWebhookAt!)}`
            : "Tiempo real activo"}
        {broken && (
          <button
            className="ml-1.5 inline-flex items-center gap-1 font-semibold text-primary hover:underline disabled:opacity-50"
            disabled={busy}
            type="button"
            onClick={repair}
          >
            <Zap size={11} /> {busy ? "Reintentando..." : "Reintentar"}
          </button>
        )}
      </p>
    </div>
  );
}

/** Self-contained version for screens that do not already load the Instagram accounts. */
export function InstagramRealtimeBanner() {
  const [lastWebhookAt, setLastWebhookAt] = useState<string | null | undefined>(undefined);
  const [realtime, setRealtime] = useState<RealtimeState | null>(null);

  const load = useCallback(async () => {
    try {
      const res: any = await api.get(`${API_URL}/integrations/facebook/status`);
      const accounts = (res?.data?.accounts ?? res?.accounts ?? []).filter((a: any) => a.platform === "instagram" && a.status === "connected");
      if (accounts.length === 0) return setLastWebhookAt(undefined);
      const latest = accounts.map((a: any) => a.metadata?.lastWebhookAt).filter(Boolean).sort().pop();
      setLastWebhookAt(latest ?? null);
      setRealtime(accounts.map((a: any) => a.metadata?.realtime).find((r: any) => r?.ok === false) ?? null);
    } catch {
      setLastWebhookAt(undefined);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  if (lastWebhookAt === undefined) return null;
  return <InstagramRealtimeNote lastWebhookAt={lastWebhookAt} realtime={realtime} onRepaired={load} />;
}
