"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  useDisclosure,
} from "@heroui/react";
import { UserPlus, MoreVertical, Shield, Key, Trash2, Copy, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";

const showToast = (message: string) => {
  console.log(message);
};

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

interface Invitation {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

const roleColors: Record<string, "primary" | "success" | "warning" | "default"> = {
  admin: "primary",
  agent: "success",
  manager: "warning",
};

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  agent: "Agente",
  manager: "Manager",
};

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "agent",
  });
  const [passwordForm, setPasswordForm] = useState({ newPassword: "" });
  const [roleForm, setRoleForm] = useState({ role: "" });
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const inviteModal = useDisclosure();
  const passwordModal = useDisclosure();
  const roleModal = useDisclosure();
  const deleteModal = useDisclosure();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, invitesRes] = await Promise.all([
        api.get(API_ENDPOINTS.users.list),
        api.get(API_ENDPOINTS.users.invitations),
      ]);
      setUsers(usersRes.data);
      setInvitations(invitesRes.data);
    } catch (error: any) {
      showToast("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    try {
      await api.post(API_ENDPOINTS.users.invite, inviteForm);
      showToast("Invitación enviada");
      setInviteForm({ email: "", firstName: "", lastName: "", role: "agent" });
      inviteModal.onClose();
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || "Error al invitar");
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser) return;
    try {
      await api.post(API_ENDPOINTS.users.changePassword(selectedUser._id), {
        userId: selectedUser._id,
        newPassword: passwordForm.newPassword,
      });
      showToast("Contraseña actualizada");
      setPasswordForm({ newPassword: "" });
      passwordModal.onClose();
    } catch (error: any) {
      showToast("Error al cambiar contraseña");
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;
    try {
      await api.patch(API_ENDPOINTS.users.changeRole(selectedUser._id), {
        role: roleForm.role,
      });
      showToast("Rol actualizado");
      roleModal.onClose();
      loadData();
    } catch (error: any) {
      showToast("Error al cambiar rol");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await api.delete(API_ENDPOINTS.users.delete(selectedUser._id));
      showToast("Usuario eliminado");
      deleteModal.onClose();
      loadData();
    } catch (error: any) {
      showToast("Error al eliminar usuario");
    }
  };

  const handleCancelInvitation = async (id: string) => {
    try {
      await api.delete(API_ENDPOINTS.users.cancelInvitation(id));
      showToast("Invitación cancelada");
      loadData();
    } catch (error: any) {
      showToast("Error al cancelar invitación");
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/auth/accept-invite?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    showToast("Link copiado al portapapeles");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Equipo</h1>
          <p className="text-sm text-default-500 mt-1">
            Gestiona los usuarios y roles de tu agencia
          </p>
        </div>
        <Button
          color="primary"
          startContent={<UserPlus size={18} />}
          onPress={inviteModal.onOpen}
        >
          Invitar Usuario
        </Button>
      </div>

      {/* Usuarios Activos */}
      <div className="bg-content1 rounded-lg border border-divider mb-6">
        <div className="p-4 border-b border-divider">
          <h2 className="font-semibold">Usuarios Activos ({users.length})</h2>
        </div>
        <Table aria-label="Usuarios" removeWrapper>
          <TableHeader>
            <TableColumn>USUARIO</TableColumn>
            <TableColumn>EMAIL</TableColumn>
            <TableColumn>ROL</TableColumn>
            <TableColumn>FECHA REGISTRO</TableColumn>
            <TableColumn>ACCIONES</TableColumn>
          </TableHeader>
          <TableBody items={users} isLoading={loading} emptyContent="No hay usuarios">
            {(user) => (
              <TableRow key={user._id}>
                <TableCell>
                  <div className="font-medium">
                    {user.firstName} {user.lastName}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip size="sm" color={roleColors[user.role] || "default"} variant="flat">
                    {roleLabels[user.role] || user.role}
                  </Chip>
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem
                        key="role"
                        startContent={<Shield size={16} />}
                        onPress={() => {
                          setSelectedUser(user);
                          setRoleForm({ role: user.role });
                          roleModal.onOpen();
                        }}
                      >
                        Cambiar Rol
                      </DropdownItem>
                      <DropdownItem
                        key="password"
                        startContent={<Key size={16} />}
                        onPress={() => {
                          setSelectedUser(user);
                          setPasswordForm({ newPassword: "" });
                          passwordModal.onOpen();
                        }}
                      >
                        Cambiar Contraseña
                      </DropdownItem>
                      <DropdownItem
                        key="delete"
                        className="text-danger"
                        color="danger"
                        startContent={<Trash2 size={16} />}
                        onPress={() => {
                          setSelectedUser(user);
                          deleteModal.onOpen();
                        }}
                      >
                        Eliminar
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invitaciones Pendientes */}
      {invitations.length > 0 && (
        <div className="bg-content1 rounded-lg border border-divider">
          <div className="p-4 border-b border-divider">
            <h2 className="font-semibold">Invitaciones Pendientes ({invitations.length})</h2>
          </div>
          <Table aria-label="Invitaciones" removeWrapper>
            <TableHeader>
              <TableColumn>USUARIO</TableColumn>
              <TableColumn>EMAIL</TableColumn>
              <TableColumn>ROL</TableColumn>
              <TableColumn>EXPIRA</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody items={invitations}>
              {(invite) => (
                <TableRow key={invite._id}>
                  <TableCell>
                    {invite.firstName} {invite.lastName}
                  </TableCell>
                  <TableCell>{invite.email}</TableCell>
                  <TableCell>
                    <Chip size="sm" color={roleColors[invite.role] || "default"} variant="flat">
                      {roleLabels[invite.role] || invite.role}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {new Date(invite.expiresAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        startContent={copiedToken === invite.token ? <CheckCircle size={14} /> : <Copy size={14} />}
                        onPress={() => copyInviteLink(invite.token)}
                      >
                        {copiedToken === invite.token ? "Copiado" : "Copiar Link"}
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        onPress={() => handleCancelInvitation(invite._id)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal Invitar Usuario */}
      <Modal isOpen={inviteModal.isOpen} onClose={inviteModal.onClose}>
        <ModalContent>
          <ModalHeader>Invitar Nuevo Usuario</ModalHeader>
          <ModalBody>
            <Input
              label="Email"
              type="email"
              value={inviteForm.email}
              onValueChange={(v) => setInviteForm({ ...inviteForm, email: v })}
            />
            <Input
              label="Nombre"
              value={inviteForm.firstName}
              onValueChange={(v) => setInviteForm({ ...inviteForm, firstName: v })}
            />
            <Input
              label="Apellido"
              value={inviteForm.lastName}
              onValueChange={(v) => setInviteForm({ ...inviteForm, lastName: v })}
            />
            <Select
              label="Rol"
              selectedKeys={[inviteForm.role]}
              onSelectionChange={(keys) => {
                const role = Array.from(keys)[0] as string;
                setInviteForm({ ...inviteForm, role });
              }}
            >
              <SelectItem key="agent" value="agent">Agente</SelectItem>
              <SelectItem key="manager" value="manager">Manager</SelectItem>
              <SelectItem key="admin" value="admin">Administrador</SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={inviteModal.onClose}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleInvite}>
              Enviar Invitación
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Cambiar Contraseña */}
      <Modal isOpen={passwordModal.isOpen} onClose={passwordModal.onClose}>
        <ModalContent>
          <ModalHeader>Cambiar Contraseña</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500 mb-4">
              Cambiar contraseña de: <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>
            </p>
            <Input
              label="Nueva Contraseña"
              type="password"
              value={passwordForm.newPassword}
              onValueChange={(v) => setPasswordForm({ newPassword: v })}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={passwordModal.onClose}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleChangePassword}>
              Cambiar Contraseña
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Cambiar Rol */}
      <Modal isOpen={roleModal.isOpen} onClose={roleModal.onClose}>
        <ModalContent>
          <ModalHeader>Cambiar Rol</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500 mb-4">
              Cambiar rol de: <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>
            </p>
            <Select
              label="Nuevo Rol"
              selectedKeys={[roleForm.role]}
              onSelectionChange={(keys) => {
                const role = Array.from(keys)[0] as string;
                setRoleForm({ role });
              }}
            >
              <SelectItem key="agent" value="agent">Agente</SelectItem>
              <SelectItem key="manager" value="manager">Manager</SelectItem>
              <SelectItem key="admin" value="admin">Administrador</SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={roleModal.onClose}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleChangeRole}>
              Cambiar Rol
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Eliminar Usuario */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Eliminar Usuario</ModalHeader>
          <ModalBody>
            <p>
              ¿Estás seguro de eliminar a <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
            </p>
            <p className="text-sm text-danger mt-2">
              Esta acción no se puede deshacer.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={deleteModal.onClose}>
              Cancelar
            </Button>
            <Button color="danger" onPress={handleDeleteUser}>
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
