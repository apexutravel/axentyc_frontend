"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { Tabs, Tab } from "@heroui/tabs";
import { motion } from "framer-motion";
import { Building2, Check, Copy, Mail, Send, Shield, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";
import { useWorkspaces } from "@/contexts/WorkspaceContext";

type Role = "admin" | "manager" | "agent" | "viewer" | "owner";

interface AccountMember {
  _id: string;
  role: Role;
  status: string;
  userId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive?: boolean;
  };
}

interface WorkspaceAccess {
  _id: string;
  role: Role;
  permissions: string[];
  userId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  workspaceId: {
    _id: string;
    name: string;
    slug: string;
    type: string;
    color?: string;
  };
}

interface Invitation {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: string;
  token: string;
  workspaceIds?: string[];
  permissions?: string[];
  expiresAt: string;
}

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  agent: "Agent",
  viewer: "Viewer",
};

const roleDescriptions: Record<string, string> = {
  admin: "Administra cuenta, equipo e integraciones.",
  manager: "Gestiona operación, leads, deals y reportes.",
  agent: "Responde mensajes y trabaja oportunidades asignadas.",
};

const roleColors: Record<string, "primary" | "secondary" | "success" | "warning" | "default"> = {
  owner: "secondary",
  admin: "primary",
  manager: "warning",
  agent: "success",
  viewer: "default",
};

const permissionOptions = [
  { key: "conversations:reply", label: "Responder conversaciones" },
  { key: "contacts:update", label: "Actualizar contactos" },
  { key: "leads:update", label: "Actualizar leads" },
  { key: "deals:update", label: "Actualizar deals" },
  { key: "quotes:create", label: "Crear cotizaciones" },
  { key: "invoices:create", label: "Crear invoices" },
  { key: "integrations:manage", label: "Gestionar integraciones" },
];

function normalize<T>(response: any): T {
  return ((response as any)?.data ?? response) as T;
}

export default function TeamPage() {
  const { workspaces } = useWorkspaces();
  const inviteModal = useDisclosure();
  const accessModal = useDisclosure();
  const [members, setMembers] = useState<AccountMember[]>([]);
  const [workspaceAccess, setWorkspaceAccess] = useState<WorkspaceAccess[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMember, setSelectedMember] = useState<AccountMember | null>(null);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "agent" as "admin" | "manager" | "agent",
    workspaceIds: [] as string[],
    permissions: ["conversations:reply", "contacts:update"] as string[],
  });
  const [accessForm, setAccessForm] = useState({
    workspaceId: "",
    role: "agent" as Role,
    permissions: ["conversations:reply", "contacts:update"] as string[],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersRes, accessRes, invitationsRes] = await Promise.all([
        api.get(API_ENDPOINTS.memberships.accountMembers, { skipWorkspace: true }),
        api.get(API_ENDPOINTS.memberships.workspaceMembers, { skipWorkspace: true }),
        api.get(API_ENDPOINTS.users.invitations, { skipWorkspace: true }),
      ]);
      setMembers(normalize<AccountMember[]>(membersRes));
      setWorkspaceAccess(normalize<WorkspaceAccess[]>(accessRes));
      setInvitations(normalize<Invitation[]>(invitationsRes));
    } catch (error: any) {
      toast.error(error.message || "No se pudo cargar el equipo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const accessByUser = useMemo(() => {
    const map = new Map<string, WorkspaceAccess[]>();
    workspaceAccess.forEach((access) => {
      const userId = access.userId?._id;
      if (!userId) return;
      map.set(userId, [...(map.get(userId) || []), access]);
    });
    return map;
  }, [workspaceAccess]);

  const toggleInviteWorkspace = (workspaceId: string) => {
    setInviteForm((prev) => ({
      ...prev,
      workspaceIds: prev.workspaceIds.includes(workspaceId)
        ? prev.workspaceIds.filter((id) => id !== workspaceId)
        : [...prev.workspaceIds, workspaceId],
    }));
  };

  const togglePermission = (scope: "invite" | "access", permission: string) => {
    if (scope === "invite") {
      setInviteForm((prev) => ({
        ...prev,
        permissions: prev.permissions.includes(permission)
          ? prev.permissions.filter((item) => item !== permission)
          : [...prev.permissions, permission],
      }));
      return;
    }

    setAccessForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((item) => item !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const inviteUser = async () => {
    if (!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName) {
      toast.error("Completa nombre, apellido y email");
      return;
    }

    setSaving(true);
    try {
      await api.post(API_ENDPOINTS.users.invite, inviteForm, { skipWorkspace: true });
      toast.success("Invitación creada");
      setInviteForm({
        email: "",
        firstName: "",
        lastName: "",
        role: "agent",
        workspaceIds: [],
        permissions: ["conversations:reply", "contacts:update"],
      });
      inviteModal.onClose();
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo invitar al usuario");
    } finally {
      setSaving(false);
    }
  };

  const openAccessModal = (member: AccountMember) => {
    setSelectedMember(member);
    setAccessForm({
      workspaceId: workspaces[0]?._id || "",
      role: member.role === "owner" ? "admin" : member.role,
      permissions: ["conversations:reply", "contacts:update"],
    });
    accessModal.onOpen();
  };

  const saveWorkspaceAccess = async () => {
    if (!selectedMember || !accessForm.workspaceId) {
      toast.error("Selecciona un workspace");
      return;
    }

    setSaving(true);
    try {
      await api.post(API_ENDPOINTS.memberships.setWorkspaceAccess, {
        userId: selectedMember.userId._id,
        workspaceId: accessForm.workspaceId,
        role: accessForm.role,
        permissions: accessForm.permissions,
      }, { skipWorkspace: true });
      toast.success("Acceso actualizado");
      accessModal.onClose();
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo actualizar el acceso");
    } finally {
      setSaving(false);
    }
  };

  const revokeWorkspaceAccess = async (workspaceId: string, userId: string) => {
    try {
      await api.delete(API_ENDPOINTS.memberships.revokeWorkspaceAccess(workspaceId, userId), { skipWorkspace: true });
      toast.success("Acceso al workspace removido");
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo remover el acceso");
    }
  };

  const cancelInvitation = async (id: string) => {
    try {
      await api.delete(API_ENDPOINTS.users.cancelInvitation(id), { skipWorkspace: true });
      toast.success("Invitación cancelada");
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo cancelar la invitación");
    }
  };

  const copyInviteLink = async (token: string) => {
    const link = `${window.location.origin}/auth/accept-invite?token=${token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Link de invitación copiado");
  };

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-6" initial={{ opacity: 0, y: 20 }}>
      <section className="relative overflow-hidden rounded-3xl border border-divider bg-gradient-to-br from-primary/15 via-content1 to-secondary/10 p-6 md:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Chip color="primary" startContent={<Users size={14} />} variant="flat">
              Cuenta y workspaces
            </Chip>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">Equipo y roles</h1>
            <p className="mt-2 text-sm text-default-500 md:text-base">
              Invita usuarios a la cuenta AXENTYC y define en qué empresas/workspaces pueden trabajar.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:min-w-[420px]">
            <SummaryTile label="Miembros" value={members.length} icon={Users} />
            <SummaryTile label="Pendientes" value={invitations.filter((item) => item.status === "pending").length} icon={Mail} />
            <SummaryTile label="Workspaces" value={workspaces.length} icon={Building2} />
          </div>
        </div>
      </section>

      <Tabs classNames={{ tabList: "bg-content1 border border-divider p-1", cursor: "bg-primary" }} radius="full" variant="light">
        <Tab key="members" title="Miembros">
          <Card className="mt-6 border border-divider">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold">Miembros de la cuenta</h2>
                <p className="text-sm text-default-500">Usuarios activos dentro de este tenant/account.</p>
              </div>
              <Button color="primary" startContent={<UserPlus size={16} />} onPress={inviteModal.onOpen}>
                Invitar usuario
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Miembros de cuenta" removeWrapper>
                <TableHeader>
                  <TableColumn>USUARIO</TableColumn>
                  <TableColumn>ROL CUENTA</TableColumn>
                  <TableColumn>WORKSPACES</TableColumn>
                  <TableColumn>ESTADO</TableColumn>
                  <TableColumn>ACCIONES</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No hay miembros" isLoading={loading}>
                  {members.map((member) => {
                    const userAccess = accessByUser.get(member.userId._id) || [];
                    return (
                      <TableRow key={member._id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{member.userId.firstName} {member.userId.lastName}</p>
                            <p className="text-xs text-default-500">{member.userId.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip color={roleColors[member.role] || "default"} size="sm" variant="flat">
                            {roleLabels[member.role] || member.role}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {userAccess.length > 0 ? userAccess.map((access) => (
                              <Chip key={access._id} size="sm" variant="flat">
                                {access.workspaceId?.name} · {roleLabels[access.role] || access.role}
                              </Chip>
                            )) : <span className="text-xs text-default-400">Sin acceso asignado</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip color="success" size="sm" variant="flat">Activo</Chip>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" startContent={<Shield size={14} />} variant="flat" onPress={() => openAccessModal(member)}>
                            Acceso
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="access" title="Acceso por workspace">
          <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
            {workspaces.map((workspace) => {
              const membersForWorkspace = workspaceAccess.filter((access) => access.workspaceId?._id === workspace._id);
              return (
                <Card key={workspace._id} className="border border-divider">
                  <CardBody className="gap-4 p-5">
                    <div className="flex items-center gap-3">
                      <span className="h-11 w-11 rounded-2xl" style={{ backgroundColor: workspace.color || "#2563EB" }} />
                      <div>
                        <h3 className="font-black">{workspace.name}</h3>
                        <p className="text-xs text-default-500">/{workspace.slug}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {membersForWorkspace.length > 0 ? membersForWorkspace.map((access) => (
                        <div key={access._id} className="flex items-center justify-between gap-3 rounded-2xl border border-divider px-3 py-2">
                          <div>
                            <p className="text-sm font-semibold">{access.userId.firstName} {access.userId.lastName}</p>
                            <p className="text-xs text-default-500">{access.userId.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip color={roleColors[access.role] || "default"} size="sm" variant="flat">
                              {roleLabels[access.role] || access.role}
                            </Chip>
                            <Button
                              isIconOnly
                              color="danger"
                              size="sm"
                              variant="light"
                              onPress={() => revokeWorkspaceAccess(access.workspaceId._id, access.userId._id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-2xl border border-dashed border-divider p-4 text-sm text-default-500">
                          No hay miembros asignados a este workspace.
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </Tab>

        <Tab key="invitations" title="Invitaciones">
          <Card className="mt-6 border border-divider">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold">Invitaciones</h2>
                <p className="text-sm text-default-500">Usuarios invitados que aún no han aceptado o ya fueron procesados.</p>
              </div>
              <Button color="primary" startContent={<Send size={16} />} onPress={inviteModal.onOpen}>
                Nueva invitación
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Invitaciones" removeWrapper>
                <TableHeader>
                  <TableColumn>INVITADO</TableColumn>
                  <TableColumn>ROL</TableColumn>
                  <TableColumn>ESTADO</TableColumn>
                  <TableColumn>EXPIRA</TableColumn>
                  <TableColumn>ACCIONES</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No hay invitaciones" isLoading={loading}>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation._id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{invitation.firstName} {invitation.lastName}</p>
                          <p className="text-xs text-default-500">{invitation.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{roleLabels[invitation.role] || invitation.role}</TableCell>
                      <TableCell>
                        <Chip color={invitation.status === "pending" ? "warning" : invitation.status === "accepted" ? "success" : "default"} size="sm" variant="flat">
                          {invitation.status}
                        </Chip>
                      </TableCell>
                      <TableCell>{new Date(invitation.expiresAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button isIconOnly size="sm" variant="flat" onPress={() => copyInviteLink(invitation.token)}>
                            <Copy size={14} />
                          </Button>
                          {invitation.status === "pending" && (
                            <Button color="danger" size="sm" variant="flat" onPress={() => cancelInvitation(invitation._id)}>
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      <InviteModal
        form={inviteForm}
        isOpen={inviteModal.isOpen}
        saving={saving}
        workspaces={workspaces}
        onClose={inviteModal.onClose}
        onSubmit={inviteUser}
        setForm={setInviteForm}
        togglePermission={(permission: string) => togglePermission("invite", permission)}
        toggleWorkspace={toggleInviteWorkspace}
      />

      <Modal isOpen={accessModal.isOpen} size="2xl" onOpenChange={accessModal.onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Configurar acceso
                <span className="text-sm font-normal text-default-500">
                  {selectedMember?.userId.firstName} {selectedMember?.userId.lastName}
                </span>
              </ModalHeader>
              <ModalBody className="gap-4">
                <Select label="Workspace" selectedKeys={accessForm.workspaceId ? [accessForm.workspaceId] : []} variant="bordered" onSelectionChange={(keys) => {
                  const next = Array.from(keys)[0] as string;
                  if (next) setAccessForm((prev) => ({ ...prev, workspaceId: next }));
                }}>
                  {workspaces.map((workspace) => <SelectItem key={workspace._id}>{workspace.name}</SelectItem>)}
                </Select>
                <Select label="Rol dentro del workspace" selectedKeys={[accessForm.role]} variant="bordered" onSelectionChange={(keys) => {
                  const next = Array.from(keys)[0] as Role;
                  if (next) setAccessForm((prev) => ({ ...prev, role: next }));
                }}>
                  {(["admin", "manager", "agent", "viewer"] as Role[]).map((role) => <SelectItem key={role}>{roleLabels[role]}</SelectItem>)}
                </Select>
                <PermissionPicker selected={accessForm.permissions} onToggle={(permission) => togglePermission("access", permission)} />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>Cancelar</Button>
                <Button color="primary" isLoading={saving} onPress={saveWorkspaceAccess}>Guardar acceso</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </motion.div>
  );
}

function SummaryTile({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-content1/80 p-4 shadow-sm backdrop-blur">
      <Icon className="text-primary" size={18} />
      <p className="mt-3 text-xs text-default-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function PermissionPicker({ selected, onToggle }: { selected: string[]; onToggle: (permission: string) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-default-500">Permisos</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {permissionOptions.map((permission) => {
          const checked = selected.includes(permission.key);
          return (
            <button
              key={permission.key}
              className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-left text-sm transition ${checked ? "border-primary bg-primary/10 text-primary" : "border-divider hover:border-primary/40"}`}
              type="button"
              onClick={() => onToggle(permission.key)}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${checked ? "border-primary bg-primary text-white" : "border-divider"}`}>
                {checked && <Check size={12} />}
              </span>
              {permission.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InviteModal({
  form,
  isOpen,
  saving,
  workspaces,
  onClose,
  onSubmit,
  setForm,
  togglePermission,
  toggleWorkspace,
}: any) {
  return (
    <Modal isOpen={isOpen} size="3xl" onOpenChange={onClose}>
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Invitar usuario
              <span className="text-sm font-normal text-default-500">Agrega una persona a la cuenta y define sus workspaces.</span>
            </ModalHeader>
            <ModalBody className="gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nombre" value={form.firstName} variant="bordered" onChange={(event) => setForm((prev: any) => ({ ...prev, firstName: event.target.value }))} />
                <Input label="Apellido" value={form.lastName} variant="bordered" onChange={(event) => setForm((prev: any) => ({ ...prev, lastName: event.target.value }))} />
                <Input className="md:col-span-2" label="Email" type="email" value={form.email} variant="bordered" onChange={(event) => setForm((prev: any) => ({ ...prev, email: event.target.value }))} />
                <Select className="md:col-span-2" label="Rol de cuenta" selectedKeys={[form.role]} variant="bordered" onSelectionChange={(keys) => {
                  const next = Array.from(keys)[0] as string;
                  if (next) setForm((prev: any) => ({ ...prev, role: next }));
                }}>
                  {(["admin", "manager", "agent"] as const).map((role) => (
                    <SelectItem key={role} description={roleDescriptions[role]}>{roleLabels[role]}</SelectItem>
                  ))}
                </Select>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-default-500">Workspaces permitidos</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {workspaces.map((workspace: any) => {
                    const checked = form.workspaceIds.includes(workspace._id);
                    return (
                      <button
                        key={workspace._id}
                        className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-left transition ${checked ? "border-primary bg-primary/10" : "border-divider hover:border-primary/40"}`}
                        type="button"
                        onClick={() => toggleWorkspace(workspace._id)}
                      >
                        <span className="h-8 w-8 rounded-xl" style={{ backgroundColor: workspace.color || "#2563EB" }} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold truncate">{workspace.name}</span>
                          <span className="block text-xs text-default-500 truncate">/{workspace.slug}</span>
                        </span>
                        {checked && <Check className="text-primary" size={16} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <PermissionPicker selected={form.permissions} onToggle={togglePermission} />
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={close}>Cancelar</Button>
              <Button color="primary" isLoading={saving} startContent={<Send size={16} />} onPress={onSubmit}>Crear invitación</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
