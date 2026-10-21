"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CreditCard,
  Inbox,
  Plug,
  Rocket,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspaces } from "@/contexts/WorkspaceContext";
import { BillingService } from "@/lib/billing";

const setupSteps = [
  {
    title: "Crea tu empresa/workspace",
    description: "Define el negocio, marca, cliente o sucursal donde trabajará el equipo.",
    href: "/workspaces",
  },
  {
    title: "Completa datos del negocio",
    description: "Agrega logo, descripción, color, moneda, horario y preferencias.",
    href: "/workspace-settings",
  },
  {
    title: "Conecta tus canales",
    description: "Activa Meta, email o widget web dentro del workspace activo.",
    href: "/integrations",
  },
  {
    title: "Invita a tu equipo",
    description: "Agrega usuarios y define quién puede operar cada workspace.",
    href: "/team",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { workspaces, activeWorkspace } = useWorkspaces();
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    BillingService.subscription()
      .then((res) => setSubscription((res as any)?.data ?? res))
      .catch(() => undefined);
  }, []);

  const connectedAssets = subscription?.usage?.connectedAssets;
  const connectedAssetsLimit = subscription?.plan?.limits?.maxConnectedAssets || 0;
  const usedAssets = connectedAssets?.total || 0;
  const setupProgress = Math.round(
    ((workspaces.length > 0 ? 1 : 0) +
      (activeWorkspace?.description ? 1 : 0) +
      (usedAssets > 0 ? 1 : 0)) /
      4 *
      100,
  );

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-6" initial={{ opacity: 0, y: 20 }}>
      <section className="relative overflow-hidden rounded-3xl border border-divider bg-gradient-to-br from-primary/15 via-content1 to-secondary/10 p-6 md:p-8">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Chip color="primary" startContent={<Sparkles size={14} />} variant="flat">
              Cuenta AXENTYC
            </Chip>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              Bienvenido{user?.firstName ? `, ${user.firstName}` : ""}
            </h1>
            <p className="mt-2 text-sm text-default-500 md:text-base">
              Este es el dashboard general de tu cuenta. Desde aquí creas empresas/workspaces, revisas tu plan y entras a la operación del workspace activo.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[520px]">
            <SummaryTile label="Plan" value={subscription?.plan?.name || "-"} icon={CreditCard} />
            <SummaryTile label="Workspaces" value={String(workspaces.length)} icon={Building2} />
            <SummaryTile label="Canales" value={`${usedAssets}/${connectedAssetsLimit || "-"}`} icon={Plug} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
        <Card className="border border-divider">
          <CardBody className="gap-6 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-black">Primeros pasos</h2>
                <p className="text-sm text-default-500">
                  AXENTYC tiene más sentido cuando cada empresa/workspace tiene canales conectados y un equipo asignado.
                </p>
              </div>
              <Chip color={setupProgress >= 75 ? "success" : "warning"} variant="flat">
                {setupProgress}% configurado
              </Chip>
            </div>
            <Progress aria-label="Progreso de configuración" color={setupProgress >= 75 ? "success" : "primary"} value={setupProgress} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {setupSteps.map((step, index) => {
                const isDone =
                  (index === 0 && workspaces.length > 0) ||
                  (index === 1 && !!activeWorkspace?.description) ||
                  (index === 2 && usedAssets > 0);

                return (
                  <NextLink key={step.title} href={step.href}>
                    <div className="h-full rounded-3xl border border-divider bg-content2/50 p-5 transition hover:border-primary/40 hover:bg-content2">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl ${isDone ? "bg-success/15 text-success" : "bg-primary/10 text-primary"}`}>
                          {isDone ? <CheckCircle2 size={18} /> : <span className="text-sm font-black">{index + 1}</span>}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold">{step.title}</h3>
                          <p className="mt-1 text-xs leading-relaxed text-default-500">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  </NextLink>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card className="border border-divider">
          <CardBody className="gap-5 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Building2 size={22} />
              </div>
              <div>
                <h2 className="text-xl font-black">Workspace activo</h2>
                <p className="text-sm text-default-500">La operación usa este contexto.</p>
              </div>
            </div>

            {activeWorkspace ? (
              <div className="rounded-3xl border border-divider bg-content2/50 p-5">
                <div className="flex items-center gap-3">
                  <span className="h-12 w-12 rounded-2xl" style={{ backgroundColor: activeWorkspace.color || "#2563EB" }} />
                  <div className="min-w-0">
                    <h3 className="font-black truncate">{activeWorkspace.name}</h3>
                    <p className="text-xs text-default-500 truncate">/{activeWorkspace.slug}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-default-500">
                  {activeWorkspace.description || "Completa los datos del workspace para que invoices, widgets y reportes tengan identidad de negocio."}
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-divider bg-content2/50 p-6 text-center">
                <Rocket className="mx-auto text-primary" size={30} />
                <p className="mt-3 font-bold">Aún no hay workspace activo</p>
                <p className="mt-1 text-sm text-default-500">Crea tu primera empresa para comenzar.</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              <QuickAction href="/workspaces" icon={Building2} label="Administrar empresas/workspaces" />
              <QuickAction href="/integrations" icon={Plug} label="Conectar canales del workspace" />
              <QuickAction href="/contact-center" icon={Inbox} label="Ir al inbox operativo" />
              <QuickAction href="/account" icon={BadgeCheck} label="Ver plan y cuenta" />
            </div>
          </CardBody>
        </Card>
      </div>
    </motion.div>
  );
}

function SummaryTile({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-content1/80 p-4 shadow-sm backdrop-blur">
      <Icon className="text-primary" size={18} />
      <p className="mt-3 text-xs text-default-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <NextLink href={href}>
      <div className="flex items-center justify-between rounded-2xl border border-divider px-4 py-3 transition hover:border-primary/40 hover:bg-content2">
        <div className="flex items-center gap-3">
          <Icon className="text-primary" size={18} />
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <ArrowRight className="text-default-400" size={16} />
      </div>
    </NextLink>
  );
}
