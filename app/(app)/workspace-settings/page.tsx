"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Tabs, Tab } from "@heroui/tabs";
import { motion } from "framer-motion";
import {
  Building2,
  Clock,
  FileText,
  Globe2,
  Mail,
  MapPin,
  Palette,
  Phone,
  ReceiptText,
  RefreshCw,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useWorkspaces } from "@/contexts/WorkspaceContext";
import { Workspace, WorkspaceService, slugifyWorkspace } from "@/lib/workspaces";
import { useWorkspaceAvailability } from "@/hooks/useWorkspaceAvailability";

const workspaceTypes = [
  { key: "default", label: "Principal" },
  { key: "brand", label: "Marca" },
  { key: "client", label: "Cliente" },
  { key: "branch", label: "Sucursal" },
];

const currencies = ["USD", "MXN", "EUR", "COP", "DOP"];
const timezones = [
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/Santo_Domingo",
  "Europe/Madrid",
];
const colors = ["#2563EB", "#7C3AED", "#DB2777", "#EA580C", "#059669", "#0891B2", "#111827"];

function buildForm(workspace?: Workspace | null) {
  return {
    name: workspace?.name || "",
    slug: workspace?.slug || "",
    description: workspace?.description || "",
    type: workspace?.type || "brand",
    color: workspace?.color || colors[0],
    icon: workspace?.icon || "building",
    logoUrl: workspace?.logoUrl || "",
    businessEmail: workspace?.businessEmail || "",
    phone: workspace?.phone || "",
    website: workspace?.website || "",
    industry: workspace?.industry || "",
    currency: workspace?.currency || "USD",
    timezone: workspace?.timezone || "America/New_York",
    address: {
      line1: workspace?.address?.line1 || "",
      line2: workspace?.address?.line2 || "",
      city: workspace?.address?.city || "",
      state: workspace?.address?.state || "",
      postalCode: workspace?.address?.postalCode || "",
      country: workspace?.address?.country || "US",
    },
    taxSettings: {
      taxId: workspace?.taxSettings?.taxId || "",
      taxName: workspace?.taxSettings?.taxName || "Sales Tax",
      taxRate: workspace?.taxSettings?.taxRate ?? 0,
      taxIncluded: workspace?.taxSettings?.taxIncluded ?? false,
    },
    documentSettings: {
      quoteTerms: workspace?.documentSettings?.quoteTerms || "",
      invoiceTerms: workspace?.documentSettings?.invoiceTerms || "",
      paymentTerms: workspace?.documentSettings?.paymentTerms || "",
      footerNote: workspace?.documentSettings?.footerNote || "",
      language: workspace?.documentSettings?.language || "es",
      invoicePrefix: workspace?.documentSettings?.invoicePrefix || "INV",
      quotePrefix: workspace?.documentSettings?.quotePrefix || "QUO",
      paymentDays: workspace?.documentSettings?.paymentDays || "15",
    },
    businessHours: {
      enabled: workspace?.businessHours?.enabled ?? false,
      timezone: workspace?.businessHours?.timezone || workspace?.timezone || "America/New_York",
    },
  };
}

export default function WorkspaceSettingsPage() {
  const { workspaces, activeWorkspace, activeWorkspaceId, setActiveWorkspaceId, refreshWorkspaces, isLoading } = useWorkspaces();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => buildForm(activeWorkspace));
  const { result: availability, checking: checkingAvailability } = useWorkspaceAvailability(form.name, form.slug, activeWorkspaceId || undefined);
  const unavailable = !!availability && (!availability.nameAvailable || !availability.slugAvailable);

  useEffect(() => {
    setForm(buildForm(activeWorkspace));
  }, [activeWorkspace]);

  const updateForm = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateNested = (section: "address" | "taxSettings" | "documentSettings" | "businessHours", key: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const saveWorkspace = async () => {
    if (!activeWorkspaceId) return;
    setSaving(true);
    try {
      await WorkspaceService.update(activeWorkspaceId, {
        ...form,
        slug: slugifyWorkspace(form.slug || form.name),
      } as Partial<Workspace>);
      await refreshWorkspaces();
      toast.success("Empresa/workspace actualizado");
    } catch (error: any) {
      toast.error(error.message || "No se pudo actualizar el workspace");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-6" initial={{ opacity: 0, y: 20 }}>
      <section className="relative overflow-hidden rounded-3xl border border-divider bg-gradient-to-br from-primary/15 via-content1 to-secondary/10 p-6 md:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Chip color="primary" startContent={<Building2 size={14} />} variant="flat">
              Configuración del workspace
            </Chip>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              {activeWorkspace?.name || "Empresa / Workspace"}
            </h1>
            <p className="mt-2 text-sm text-default-500 md:text-base">
              Centraliza aquí la identidad del negocio: datos de contacto, branding, dirección, impuestos y términos para futuras cotizaciones e invoices.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button isLoading={isLoading} startContent={<RefreshCw size={16} />} variant="flat" onPress={() => refreshWorkspaces()}>
              Actualizar
            </Button>
            <Button
              color="primary"
              isDisabled={!form.name.trim() || !form.slug || checkingAvailability || unavailable}
              isLoading={saving}
              startContent={<Save size={16} />}
              onPress={saveWorkspace}
            >
              Guardar cambios
            </Button>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="border border-divider h-fit">
          <CardBody className="gap-3 p-4">
            <p className="px-2 text-xs font-black uppercase tracking-[0.18em] text-default-400">Workspaces</p>
            {workspaces.map((workspace) => {
              const isActive = workspace._id === activeWorkspaceId;
              return (
                <button
                  key={workspace._id}
                  className={`w-full rounded-2xl border p-3 text-left transition ${isActive ? "border-primary bg-primary/10" : "border-divider hover:border-primary/40"}`}
                  type="button"
                  onClick={() => setActiveWorkspaceId(workspace._id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-xl flex-shrink-0" style={{ backgroundColor: workspace.color || colors[0] }} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold truncate">{workspace.name}</span>
                      <span className="block text-xs text-default-500 truncate">/{workspace.slug}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </CardBody>
        </Card>

        <div className="min-w-0 max-w-full overflow-hidden">
        <Tabs classNames={{ base: "min-w-0 max-w-full", tabList: "max-w-full overflow-x-auto bg-content1 border border-divider p-1", cursor: "bg-primary" }} radius="full" variant="light">
          <Tab key="business" title="Negocio">
            <SettingsCard icon={Building2} title="Información del negocio" description="Datos principales que identifican la empresa dentro de AXENTYC.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre del negocio"
                  value={form.name}
                  variant="bordered"
                  description={checkingAvailability ? "Comprobando nombre..." : availability?.nameAvailable ? "Nombre disponible" : undefined}
                  errorMessage={availability && !availability.nameAvailable ? "Este nombre ya está en uso" : undefined}
                  isInvalid={!!availability && !availability.nameAvailable}
                  maxLength={100}
                  onChange={(event) => updateForm("name", event.target.value)}
                />
                <Input
                  label="Slug"
                  value={form.slug}
                  variant="bordered"
                  description={checkingAvailability ? "Comprobando slug..." : availability?.slugAvailable ? `Disponible: /${availability.slug}` : "Solo letras, números y guiones"}
                  errorMessage={availability && !availability.slugAvailable ? "Este slug ya está en uso" : undefined}
                  isInvalid={!!availability && !availability.slugAvailable}
                  maxLength={100}
                  onChange={(event) => updateForm("slug", slugifyWorkspace(event.target.value))}
                />
                <Select label="Tipo" selectedKeys={[form.type]} variant="bordered" onSelectionChange={(keys) => {
                  const next = Array.from(keys)[0] as Workspace["type"];
                  if (next) updateForm("type", next);
                }}>
                  {workspaceTypes.map((type) => <SelectItem key={type.key}>{type.label}</SelectItem>)}
                </Select>
                <Input label="Industria" placeholder="Home services, marketing, retail..." value={form.industry} variant="bordered" onChange={(event) => updateForm("industry", event.target.value)} />
                <Input label="Email del negocio" startContent={<Mail size={16} />} type="email" value={form.businessEmail} variant="bordered" onChange={(event) => updateForm("businessEmail", event.target.value)} />
                <Input label="Teléfono" startContent={<Phone size={16} />} value={form.phone} variant="bordered" onChange={(event) => updateForm("phone", event.target.value)} />
                <Input className="md:col-span-2" label="Website" startContent={<Globe2 size={16} />} value={form.website} variant="bordered" onChange={(event) => updateForm("website", event.target.value)} />
                <Textarea className="md:col-span-2" label="Descripción" minRows={3} value={form.description} variant="bordered" onChange={(event) => updateForm("description", event.target.value)} />
              </div>
            </SettingsCard>
          </Tab>

          <Tab key="branding" title="Branding">
            <SettingsCard icon={Palette} title="Marca visual" description="Estos datos se usarán para widget, documentos e identidad comercial.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Logo URL" value={form.logoUrl} variant="bordered" onChange={(event) => updateForm("logoUrl", event.target.value)} />
                <Input label="Icono" value={form.icon} variant="bordered" onChange={(event) => updateForm("icon", event.target.value)} />
                <div className="md:col-span-2">
                  <p className="text-xs text-default-500 mb-2">Color principal</p>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button key={color} aria-label={color} className={`h-10 w-10 rounded-full border-2 ${form.color === color ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: color }} type="button" onClick={() => updateForm("color", color)} />
                    ))}
                  </div>
                </div>
              </div>
            </SettingsCard>
          </Tab>

          <Tab key="address" title="Dirección">
            <SettingsCard icon={MapPin} title="Dirección comercial" description="Útil para invoices, quotes, documentos y comunicación con clientes.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input className="md:col-span-2" label="Dirección línea 1" value={form.address.line1} variant="bordered" onChange={(event) => updateNested("address", "line1", event.target.value)} />
                <Input className="md:col-span-2" label="Dirección línea 2" value={form.address.line2} variant="bordered" onChange={(event) => updateNested("address", "line2", event.target.value)} />
                <Input label="Ciudad" value={form.address.city} variant="bordered" onChange={(event) => updateNested("address", "city", event.target.value)} />
                <Input label="Estado/Provincia" value={form.address.state} variant="bordered" onChange={(event) => updateNested("address", "state", event.target.value)} />
                <Input label="Código postal" value={form.address.postalCode} variant="bordered" onChange={(event) => updateNested("address", "postalCode", event.target.value)} />
                <Input label="País" value={form.address.country} variant="bordered" onChange={(event) => updateNested("address", "country", event.target.value)} />
              </div>
            </SettingsCard>
          </Tab>

          <Tab key="documents" title="Fiscal y documentos">
            <SettingsCard icon={ReceiptText} title="Impuestos, quotes e invoices" description="Base para cotizaciones, invoices, pagos y documentos futuros.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Tax ID / EIN / RFC" value={form.taxSettings.taxId} variant="bordered" onChange={(event) => updateNested("taxSettings", "taxId", event.target.value)} />
                <Input label="Nombre del impuesto" value={form.taxSettings.taxName} variant="bordered" onChange={(event) => updateNested("taxSettings", "taxName", event.target.value)} />
                <Input label="Tax rate (%)" type="number" value={String(form.taxSettings.taxRate)} variant="bordered" onChange={(event) => updateNested("taxSettings", "taxRate", Number(event.target.value || 0))} />
                <div className="flex items-center justify-between rounded-2xl border border-divider px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Impuesto incluido</p>
                    <p className="text-xs text-default-500">Define si los precios ya incluyen tax.</p>
                  </div>
                  <Switch isSelected={form.taxSettings.taxIncluded} onValueChange={(value) => updateNested("taxSettings", "taxIncluded", value)} />
                </div>
                <Select label="Idioma de los documentos" selectedKeys={[form.documentSettings.language]} variant="bordered" onSelectionChange={(keys) => { const next = Array.from(keys)[0] as string; if (next) updateNested("documentSettings", "language", next); }}>
                  <SelectItem key="es">Español</SelectItem>
                  <SelectItem key="en">English</SelectItem>
                </Select>
                <Input label="Días para pagar (vencimiento)" type="number" value={String(form.documentSettings.paymentDays)} variant="bordered" onChange={(event) => updateNested("documentSettings", "paymentDays", String(Math.max(0, Math.min(365, Number(event.target.value || 0)))))} />
                <Input label="Prefijo de facturas" maxLength={8} value={form.documentSettings.invoicePrefix} variant="bordered" onChange={(event) => updateNested("documentSettings", "invoicePrefix", event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))} />
                <Input label="Prefijo de cotizaciones" maxLength={8} value={form.documentSettings.quotePrefix} variant="bordered" onChange={(event) => updateNested("documentSettings", "quotePrefix", event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))} />
                <Textarea className="md:col-span-2" label="Términos de cotización" minRows={3} value={form.documentSettings.quoteTerms} variant="bordered" onChange={(event) => updateNested("documentSettings", "quoteTerms", event.target.value)} />
                <Textarea className="md:col-span-2" label="Términos de invoice" minRows={3} value={form.documentSettings.invoiceTerms} variant="bordered" onChange={(event) => updateNested("documentSettings", "invoiceTerms", event.target.value)} />
                <Textarea className="md:col-span-2" label="Términos de pago" minRows={2} value={form.documentSettings.paymentTerms} variant="bordered" onChange={(event) => updateNested("documentSettings", "paymentTerms", event.target.value)} />
                <Textarea className="md:col-span-2" label="Nota de pie de documento" minRows={2} value={form.documentSettings.footerNote} variant="bordered" onChange={(event) => updateNested("documentSettings", "footerNote", event.target.value)} />
              </div>
            </SettingsCard>
          </Tab>

          <Tab key="preferences" title="Preferencias">
            <SettingsCard icon={Clock} title="Preferencias operativas" description="Configuración base para horarios, moneda, zona horaria y reportes.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Moneda" selectedKeys={[form.currency]} variant="bordered" onSelectionChange={(keys) => {
                  const next = Array.from(keys)[0] as string;
                  if (next) updateForm("currency", next);
                }}>
                  {currencies.map((currency) => <SelectItem key={currency}>{currency}</SelectItem>)}
                </Select>
                <Select label="Zona horaria" selectedKeys={[form.timezone]} variant="bordered" onSelectionChange={(keys) => {
                  const next = Array.from(keys)[0] as string;
                  if (next) {
                    updateForm("timezone", next);
                    updateNested("businessHours", "timezone", next);
                  }
                }}>
                  {timezones.map((timezone) => <SelectItem key={timezone}>{timezone}</SelectItem>)}
                </Select>
                <div className="md:col-span-2 flex items-center justify-between rounded-2xl border border-divider px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Horario comercial activo</p>
                    <p className="text-xs text-default-500">Preparado para automatizaciones y mensajes fuera de horario.</p>
                  </div>
                  <Switch isSelected={form.businessHours.enabled} onValueChange={(value) => updateNested("businessHours", "enabled", value)} />
                </div>
              </div>
            </SettingsCard>
          </Tab>
        </Tabs>
        </div>
      </div>
    </motion.div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: any;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mt-6 border border-divider">
      <CardBody className="gap-6 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black">{title}</h2>
            <p className="text-sm text-default-500">{description}</p>
          </div>
        </div>
        {children}
      </CardBody>
    </Card>
  );
}
