"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { motion } from "framer-motion";
import { ArrowRight, Building2, CheckCircle2, Plus, Settings, Sparkles, Trash2 } from "lucide-react";
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

const colors = ["#2563EB", "#7C3AED", "#DB2777", "#EA580C", "#059669", "#0891B2", "#111827"];

export default function WorkspacesPage() {
  const router = useRouter();
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, refreshWorkspaces, isLoading, hasWorkspace, canManage } = useWorkspaces();
  const [creating, setCreating] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    type: "brand" as Workspace["type"],
    color: colors[0],
  });
  const { result: availability, checking: checkingAvailability } = useWorkspaceAvailability(form.name, form.slug);
  const unavailable = !!availability && (!availability.nameAvailable || !availability.slugAvailable);

  const createWorkspace = async () => {
    if (!form.name.trim()) {
      toast.error("El nombre de la empresa/workspace es requerido");
      return;
    }

    setCreating(true);
    try {
      const created = await WorkspaceService.create({ ...form, slug: form.slug || slugifyWorkspace(form.name) });
      const normalized = ((created as any)?.data ?? created) as Workspace;
      await refreshWorkspaces();
      if (normalized?._id) setActiveWorkspaceId(normalized._id);
      setForm({ name: "", slug: "", description: "", type: "brand", color: colors[0] });
      setSlugTouched(false);
      toast.success("Empresa/workspace creado");
      router.push("/workspace-settings");
    } catch (error: any) {
      toast.error(error.message || "No se pudo crear el workspace");
    } finally {
      setCreating(false);
    }
  };

  const deleteWorkspace = async (workspace: Workspace) => {
    const isLast = workspaces.length === 1;
    const confirmed = window.confirm(
      `¿Eliminar/desactivar "${workspace.name}"?\n\nEsto lo quitará de tu lista de workspaces activos, pero no elimina tu usuario ni tu cuenta AXENTYC.${
        isLast ? "\n\nEs tu única empresa: sin ella el menú volverá a mostrar solo tu cuenta." : ""
      }`,
    );
    if (!confirmed) return;

    setDeletingId(workspace._id);
    try {
      await WorkspaceService.remove(workspace._id);
      await refreshWorkspaces();
      toast.success("Workspace desactivado");
    } catch (error: any) {
      toast.error(error.message || "No se pudo desactivar el workspace");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-6" initial={{ opacity: 0, y: 20 }}>
      <section className="relative overflow-hidden rounded-3xl border border-divider bg-gradient-to-br from-primary/15 via-content1 to-secondary/10 p-6 md:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Chip color="primary" startContent={<Building2 size={14} />} variant="flat">
              Empresas / Workspaces
            </Chip>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              {hasWorkspace ? "Administra tus empresas" : canManage ? "Crea tu primera empresa" : "Aún no tienes una empresa asignada"}
            </h1>
            <p className="mt-2 text-sm text-default-500 md:text-base">
              {hasWorkspace
                ? "Cada workspace representa una empresa, marca, cliente o sucursal. Las conversaciones, canales, leads, deals e integraciones viven dentro del workspace activo."
                : canManage
                  ? "Por ahora solo ves tu cuenta. Al crear tu primera empresa se habilitan el Contact Center, el correo, el CRM, las integraciones y el resto del menú."
                  : "Un administrador de tu cuenta debe darte acceso a una empresa. Mientras tanto puedes revisar tu cuenta y tus ajustes."}
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-content1/80 p-4 shadow-sm backdrop-blur">
            <p className="text-xs text-default-500">Total de workspaces</p>
            <p className="mt-1 text-3xl font-black">{workspaces.length}</p>
          </div>
        </div>
      </section>

      <div className={`grid grid-cols-1 gap-6 ${canManage ? "xl:grid-cols-[1fr_420px]" : ""}`}>
        <Card className="border border-divider">
          <CardHeader>
            <div>
              <h2 className="text-lg font-bold">Tus empresas/workspaces</h2>
              <p className="text-sm text-default-500">Selecciona una empresa para operar dentro de ella.</p>
            </div>
          </CardHeader>
          <CardBody className="gap-3">
            {workspaces.length === 0 && !isLoading ? (
              <div className="rounded-3xl border border-dashed border-divider bg-content2/50 p-8 text-center">
                <Sparkles className="mx-auto text-primary" size={34} />
                <h3 className="mt-3 text-lg font-bold">
                  {canManage ? "Crea tu primera empresa/workspace" : "Sin empresas asignadas"}
                </h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-default-500">
                  {canManage
                    ? "Antes de conectar canales o recibir mensajes, necesitas una empresa donde guardar contactos, leads, conversaciones e invoices."
                    : "Pide a un administrador que te agregue a una empresa para empezar a trabajar."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workspaces.map((workspace) => {
                  const isActive = workspace._id === activeWorkspaceId;
                  return (
                    <Card key={workspace._id} className={`border ${isActive ? "border-primary shadow-lg shadow-primary/10" : "border-divider"}`}>
                      <CardBody className="gap-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="h-12 w-12 rounded-2xl flex-shrink-0" style={{ backgroundColor: workspace.color || colors[0] }} />
                            <div className="min-w-0">
                              <h3 className="font-black truncate">{workspace.name}</h3>
                              <p className="text-xs text-default-500 truncate">/{workspace.slug}</p>
                            </div>
                          </div>
                          {isActive && <Chip color="primary" size="sm" startContent={<CheckCircle2 size={12} />} variant="flat">Activo</Chip>}
                        </div>
                        <p className="min-h-10 text-sm text-default-500 line-clamp-2">
                          {workspace.description || "Sin descripción todavía."}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" color={isActive ? "default" : "primary"} variant={isActive ? "flat" : "solid"} onPress={() => setActiveWorkspaceId(workspace._id)}>
                            {isActive ? "Workspace activo" : "Usar este workspace"}
                          </Button>
                          <Button
                            endContent={<ArrowRight size={14} />}
                            size="sm"
                            variant="flat"
                            onPress={() => {
                              setActiveWorkspaceId(workspace._id);
                              router.push("/contact-center");
                            }}
                          >
                            Entrar
                          </Button>
                          {canManage && (
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => {
                                setActiveWorkspaceId(workspace._id);
                                router.push("/workspace-settings");
                              }}
                            >
                              <Settings size={16} />
                            </Button>
                          )}
                          {canManage && <Button
                            isIconOnly
                            color="danger"
                            isLoading={deletingId === workspace._id}
                            size="sm"
                            variant="light"
                            onPress={() => deleteWorkspace(workspace)}
                          >
                            <Trash2 size={16} />
                          </Button>}
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {canManage && <Card className="border border-divider">
          <CardHeader className="gap-2">
            <Plus className="text-primary" size={18} />
            <div>
              <h2 className="text-lg font-bold">Crear empresa/workspace</h2>
              <p className="text-sm text-default-500">Usa esto para marcas, clientes o sucursales.</p>
            </div>
          </CardHeader>
          <CardBody className="gap-4">
            <Input label="Nombre" value={form.name} variant="bordered" onChange={(event) => {
              const name = event.target.value;
              setForm((prev) => ({ ...prev, name, slug: slugTouched ? prev.slug : slugifyWorkspace(name) }));
            }}
              description={checkingAvailability ? "Comprobando nombre..." : availability?.nameAvailable ? "Nombre disponible" : undefined}
              errorMessage={availability && !availability.nameAvailable ? "Este nombre ya está en uso" : undefined}
              isInvalid={!!availability && !availability.nameAvailable}
              maxLength={100}
            />
            <Input
              label="Slug"
              value={form.slug}
              variant="bordered"
              description={checkingAvailability ? "Comprobando slug..." : availability?.slugAvailable ? `Disponible: /${availability.slug}` : "Se genera automáticamente sin espacios"}
              errorMessage={availability && !availability.slugAvailable ? "Este slug ya está en uso" : undefined}
              isInvalid={!!availability && !availability.slugAvailable}
              maxLength={100}
              onChange={(event) => {
                setSlugTouched(true);
                setForm((prev) => ({ ...prev, slug: slugifyWorkspace(event.target.value) }));
              }}
            />
            <Select label="Tipo" selectedKeys={[form.type]} variant="bordered" onSelectionChange={(keys) => {
              const next = Array.from(keys)[0] as Workspace["type"];
              if (next) setForm((prev) => ({ ...prev, type: next }));
            }}>
              {workspaceTypes.map((type) => <SelectItem key={type.key}>{type.label}</SelectItem>)}
            </Select>
            <div>
              <p className="text-xs text-default-500 mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button key={color} aria-label={color} className={`h-9 w-9 rounded-full border-2 ${form.color === color ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: color }} type="button" onClick={() => setForm((prev) => ({ ...prev, color }))} />
                ))}
              </div>
            </div>
            <Textarea label="Descripción" minRows={3} value={form.description} variant="bordered" onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
            <Button
              color="primary"
              isDisabled={!form.name.trim() || !form.slug || checkingAvailability || unavailable}
              isLoading={creating}
              startContent={<Plus size={16} />}
              onPress={createWorkspace}
            >
              {hasWorkspace ? "Crear y configurar" : "Crear mi primera empresa"}
            </Button>
          </CardBody>
        </Card>}
      </div>
    </motion.div>
  );
}
