import NextLink from "next/link";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CircleDashed,
  CreditCard,
  Globe2,
  Layers3,
  Lock,
  Plug,
  Route,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

const publicRoutes = ["/", "/pricing", "/about", "/blog", "/docs", "/terms", "/privacy", "/data-deletion"];
const authRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password"];
const workspaceRoutes = [
  "/dashboard",
  "/contact-center",
  "/contacts",
  "/leads",
  "/deals",
  "/automations",
  "/analytics",
  "/integrations",
  "/inbox",
];
const adminRoutes = ["/team", "/workspace-settings", "/account", "/settings"];

const doneItems = [
  "Login/register con cookies HttpOnly",
  "Tenant/Account con suscripción manual",
  "Workspace default y selector activo",
  "Billing interno con cambio/cancelación/reactivación",
  "Planes Free, Starter, Pro y Agency",
  "Límites por canales conectados",
  "Meta/Facebook base con Facebook Page e Instagram",
  "Email integration y Chat Widget",
  "CRM base: contactos, leads y deals",
  "Account y Workspace Settings separados",
];

const nextItems = [
  "WhatsApp Business",
  "TikTok y YouTube",
  "Sugerencias, resúmenes y clasificación con IA",
];

const modelCards = [
  {
    title: "User",
    icon: Users,
    text: "Identidad global. Puede pertenecer a varias cuentas y workspaces sin pagar por sí mismo.",
  },
  {
    title: "Tenant / Account",
    icon: CreditCard,
    text: "Cuenta que paga. Contiene suscripción, billing, límites y miembros de cuenta.",
  },
  {
    title: "Workspace",
    icon: Building2,
    text: "Empresa, marca, cliente o sucursal. Contiene operación, integraciones y CRM.",
  },
  {
    title: "Connected Assets",
    icon: Plug,
    text: "Facebook Page, Instagram Account, WhatsApp, Email o Widget. Las capacidades no se cobran aparte.",
  },
];

export default function ProductMapPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-1/4 top-[520px] h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="max-w-3xl">
          <Chip color="primary" startContent={<Route size={14} />} variant="flat">
            Mapa funcional del producto
          </Chip>
          <h1 className="mt-6 text-4xl font-black tracking-tight md:text-6xl">
            Mapa actual y próximos pasos de AXENTYC
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-default-500">
            Documento público para entender qué existe hoy, cómo se organiza la arquitectura SaaS y qué falta para completar el flujo visual, operativo y comercial del sistema.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <NextLink href="/pricing">
              <Button color="primary" endContent={<ArrowRight size={16} />}>
                Ver planes
              </Button>
            </NextLink>
            <NextLink href="/">
              <Button variant="flat">Volver al sitio</Button>
            </NextLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {modelCards.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="border border-divider bg-content1/80 backdrop-blur">
                <CardBody className="gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black">{item.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-default-500">{item.text}</p>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 pb-20 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-divider">
          <CardBody className="p-6 md:p-8">
            <div className="flex items-center gap-3">
              <Layers3 className="text-primary" size={24} />
              <h2 className="text-2xl font-black">Mapa de navegación actual</h2>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              <RouteGroup title="Sitio público" icon={Globe2} routes={publicRoutes} />
              <RouteGroup title="Auth" icon={Lock} routes={authRoutes} />
              <RouteGroup title="Workspace activo" icon={Building2} routes={workspaceRoutes} />
              <RouteGroup title="Administración" icon={BadgeCheck} routes={adminRoutes} />
            </div>
          </CardBody>
        </Card>

        <Card className="border border-divider bg-gradient-to-br from-content1 to-content2/70">
          <CardBody className="p-6 md:p-8">
            <div className="flex items-center gap-3">
              <Sparkles className="text-primary" size={24} />
              <h2 className="text-2xl font-black">Flujo ideal del usuario</h2>
            </div>
            <ol className="mt-8 space-y-4">
              {[
                "Usuario entra a pricing y selecciona plan.",
                "Se registra y se crea Tenant + Workspace default.",
                "Entra al dashboard con workspace activo visible.",
                "Conecta canales en Integrations.",
                "Invita equipo y asigna acceso por workspace.",
                "Gestiona contactos, conversaciones, leads y deals.",
                "Cambia plan, paga o cancela desde Account.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm text-default-600">{step}</span>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 pb-20 lg:grid-cols-2">
        <StatusList title="Lo que ya tenemos" icon={CheckCircle2} items={doneItems} tone="success" />
        <StatusList title="Lo que falta priorizar" icon={CircleDashed} items={nextItems} tone="warning" />
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <Card className="overflow-hidden border border-divider">
          <CardBody className="grid grid-cols-1 gap-0 p-0 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="bg-gradient-to-br from-primary to-secondary p-8 text-white">
              <h2 className="text-3xl font-black">Siguiente acción recomendada</h2>
              <p className="mt-4 text-white/80">
                Trabajar primero Team y después Integrations, porque ya tenemos Tenant, Workspace, Account, Billing y selector de workspace activo.
              </p>
            </div>
            <div className="grid gap-4 p-8 md:grid-cols-2">
              <PriorityCard title="1. Team" text="Miembros, invitaciones, roles y acceso por workspace." />
              <PriorityCard title="2. Integrations" text="Meta assets, permisos, reconexión, cupos y estado visual." />
              <PriorityCard title="3. Account" text="Contraseña, perfil editable, Stripe portal, invoices y tarjetas." />
              <PriorityCard title="4. Workspace" text="Business hours, preferencias, permisos y miembros por workspace." />
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

function RouteGroup({
  title,
  icon: Icon,
  routes,
}: {
  title: string;
  icon: LucideIcon;
  routes: string[];
}) {
  return (
    <div className="rounded-3xl border border-divider bg-content2/50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="text-primary" size={18} />
        <h3 className="font-bold">{title}</h3>
      </div>
      <div className="space-y-2">
        {routes.map((route) => (
          <code key={route} className="block rounded-xl bg-content1 px-3 py-2 text-xs text-default-600">
            {route}
          </code>
        ))}
      </div>
    </div>
  );
}

function StatusList({
  title,
  icon: Icon,
  items,
  tone,
}: {
  title: string;
  icon: LucideIcon;
  items: string[];
  tone: "success" | "warning";
}) {
  return (
    <Card className="border border-divider">
      <CardBody className="p-6 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <Icon className={tone === "success" ? "text-success" : "text-warning"} size={24} />
          <h2 className="text-2xl font-black">{title}</h2>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-2xl border border-divider bg-content2/40 p-4">
              <CheckCircle2 className={tone === "success" ? "mt-0.5 text-success" : "mt-0.5 text-warning"} size={16} />
              <p className="text-sm text-default-600">{item}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function PriorityCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-divider bg-content2/50 p-5">
      <h3 className="font-black">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-default-500">{text}</p>
    </div>
  );
}
