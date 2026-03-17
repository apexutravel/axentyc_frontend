"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectSection, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Spinner } from "@heroui/spinner";
import { Textarea } from "@heroui/input";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  MoreVertical,
  Download,
  Trash2,
  Pencil,
  Eye,
  Mail,
  Phone,
  Building2,
  Globe,
  Tag,
  User,
  X,
} from "lucide-react";
import { addToast } from "@heroui/toast";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";

interface Contact {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  avatar?: string;
  source: string;
  tags: string[];
  notes?: string;
  isActive: boolean;
  lastContactedAt?: string;
  createdAt: string;
}

const sourceColors: Record<string, "success" | "secondary" | "primary" | "danger" | "warning" | "default"> = {
  whatsapp: "success",
  instagram: "secondary",
  facebook: "primary",
  tiktok: "danger",
  web_chat: "warning",
  manual: "default",
  import: "default",
};

const sourceLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  web_chat: "Web Chat",
  manual: "Manual",
  import: "Importado",
};

function unwrap<T>(response: any): T {
  return (response?.data ?? response) as T;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<Set<string>>(new Set(["all"]));
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const createModal = useDisclosure();
  const editModal = useDisclosure();
  const viewModal = useDisclosure();
  const deleteModal = useDisclosure();
  const bulkDeleteModal = useDisclosure();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
    source: "manual",
  });

  const loadContacts = useCallback(async () => {
    try {
      const data = await api.get<Contact[]>(API_ENDPOINTS.contacts.list);
      const list = unwrap<Contact[]>(data);
      setContacts(Array.isArray(list) ? list : []);
    } catch (error: any) {
      console.error("Error loading contacts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const resetForm = () => {
    setForm({ name: "", email: "", phone: "", company: "", notes: "", source: "manual" });
  };

  const createContact = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.post(API_ENDPOINTS.contacts.create, form);
      addToast({ title: "Contacto creado", color: "success" });
      createModal.onClose();
      resetForm();
      loadContacts();
    } catch (error: any) {
      addToast({ title: "Error al crear contacto", color: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const updateContact = async () => {
    if (!selectedContact || !form.name.trim()) return;
    setSaving(true);
    try {
      await api.patch(API_ENDPOINTS.contacts.update(selectedContact._id), form);
      addToast({ title: "Contacto actualizado", color: "success" });
      editModal.onClose();
      resetForm();
      loadContacts();
    } catch (error: any) {
      addToast({ title: "Error al actualizar contacto", color: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async () => {
    if (!selectedContact) return;
    setDeleting(true);
    try {
      await api.delete(API_ENDPOINTS.contacts.delete(selectedContact._id));
      addToast({ title: "Contacto eliminado", color: "success" });
      deleteModal.onClose();
      setSelectedContact(null);
      loadContacts();
    } catch (error: any) {
      addToast({ title: "Error al eliminar contacto", color: "danger" });
    } finally {
      setDeleting(false);
    }
  };

  const bulkDeleteContacts = async () => {
    if (selectedKeys.size === 0) return;
    setDeleting(true);
    try {
      const ids = Array.from(selectedKeys);
      await api.post(API_ENDPOINTS.contacts.bulkDelete, { ids });
      addToast({ 
        title: `${ids.length} contacto${ids.length > 1 ? 's' : ''} eliminado${ids.length > 1 ? 's' : ''}`, 
        color: "success" 
      });
      bulkDeleteModal.onClose();
      setSelectedKeys(new Set());
      loadContacts();
    } catch (error: any) {
      addToast({ title: "Error al eliminar contactos", color: "danger" });
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setForm({
      name: contact.name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      company: contact.company || "",
      notes: contact.notes || "",
      source: contact.source || "manual",
    });
    editModal.onOpen();
  };

  const openView = (contact: Contact) => {
    setSelectedContact(contact);
    viewModal.onOpen();
  };

  const openDelete = (contact: Contact) => {
    setSelectedContact(contact);
    deleteModal.onOpen();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);
    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHrs < 24) return `Hace ${diffHrs} hr`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
  };

  const filteredContacts = contacts.filter((c) => {
    // Hide auto-generated contacts (visitor names without email/phone)
    const isAutoGenerated = c.name?.toLowerCase().startsWith('visitor') && !c.email && !c.phone;
    if (isAutoGenerated) return false;
    
    // Filter by source
    if (!sourceFilter.has("all") && !sourceFilter.has(c.source)) return false;
    
    // Filter by search query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.company?.toLowerCase().includes(q)
    );
  });

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contactos</h1>
          <p className="text-default-500 text-sm mt-1">
            Gestiona todos tus contactos desde un solo lugar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip size="sm" variant="flat">{contacts.length} contactos</Chip>
          {selectedKeys.size > 0 && (
            <Button
              color="danger"
              variant="flat"
              startContent={<Trash2 size={16} />}
              onPress={bulkDeleteModal.onOpen}
            >
              Eliminar ({selectedKeys.size})
            </Button>
          )}
          <Button
            color="primary"
            startContent={<Plus size={16} />}
            onPress={() => {
              resetForm();
              createModal.onOpen();
            }}
          >
            Nuevo Contacto
          </Button>
        </div>
      </div>

      <Card className="border border-divider">
        <CardHeader className="flex flex-col gap-3">
          <div className="flex items-center gap-3 w-full">
            <Input
              className="max-w-sm flex-1"
              placeholder="Buscar por nombre, email, teléfono, empresa..."
              size="sm"
              startContent={<Search className="text-default-400" size={14} />}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <Select
              label="Filtrar por canal"
              placeholder="Seleccionar canales"
              selectionMode="multiple"
              selectedKeys={sourceFilter}
              onSelectionChange={(keys) => {
                const newSelection = keys as Set<string>;
                // Si se selecciona "all", limpiar otros filtros
                if (newSelection.has("all") && !sourceFilter.has("all")) {
                  setSourceFilter(new Set(["all"]));
                } else if (newSelection.has("all") && newSelection.size > 1) {
                  // Si "all" ya estaba y se selecciona otro, quitar "all"
                  const filtered = new Set(Array.from(newSelection).filter(k => k !== "all"));
                  setSourceFilter(filtered);
                } else if (newSelection.size === 0) {
                  // Si se deseleccionan todos, volver a "all"
                  setSourceFilter(new Set(["all"]));
                } else {
                  setSourceFilter(newSelection);
                }
              }}
              className="max-w-xs"
              size="sm"
            >
              <SelectItem key="all">Todos</SelectItem>
              <SelectItem key="web_chat">Web Chat</SelectItem>
              <SelectItem key="whatsapp">WhatsApp</SelectItem>
              <SelectItem key="instagram">Instagram</SelectItem>
              <SelectItem key="facebook">Facebook</SelectItem>
              <SelectItem key="manual">Manual</SelectItem>
            </Select>
            <Chip size="sm" variant="flat" className="text-default-500">
              {filteredContacts.length} resultados
            </Chip>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="sm" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <User className="text-default-300 mb-3" size={40} />
              <p className="text-sm text-default-500">No hay contactos</p>
              <p className="text-xs text-default-400 mt-1">
                {searchQuery ? "Intenta con otra búsqueda" : "Los contactos del widget se crearán automáticamente"}
              </p>
            </div>
          ) : (
            <Table 
              aria-label="Contacts table" 
              removeWrapper
              selectionMode="multiple"
              selectedKeys={selectedKeys}
              onSelectionChange={(keys) => {
                const selection = keys === "all" 
                  ? new Set(filteredContacts.map(c => c._id))
                  : keys as Set<string>;
                setSelectedKeys(selection);
              }}
            >
              <TableHeader>
                <TableColumn>CONTACTO</TableColumn>
                <TableColumn>TELÉFONO</TableColumn>
                <TableColumn>EMPRESA</TableColumn>
                <TableColumn>CANAL</TableColumn>
                <TableColumn>TAGS</TableColumn>
                <TableColumn>CREADO</TableColumn>
                <TableColumn width={50}>ACCIONES</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={contact.name?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                          size="sm"
                          color="primary"
                        />
                        <div>
                          <p className="text-sm font-medium">{contact.name}</p>
                          <p className="text-xs text-default-400">{contact.email || "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-default-500">
                        {contact.phone || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-default-500">
                        {contact.company || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={sourceColors[contact.source] || "default"}
                        size="sm"
                        variant="flat"
                      >
                        {sourceLabels[contact.source] || contact.source}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(contact.tags || []).length > 0
                          ? contact.tags.map((tag) => (
                              <Chip key={tag} size="sm" variant="bordered">
                                {tag}
                              </Chip>
                            ))
                          : <span className="text-xs text-default-400">—</span>
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-default-500">
                        {formatDate(contact.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light">
                            <MoreVertical size={14} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Contact actions">
                          <DropdownItem
                            key="view"
                            startContent={<Eye size={14} />}
                            onPress={() => openView(contact)}
                          >
                            Ver detalle
                          </DropdownItem>
                          <DropdownItem
                            key="edit"
                            startContent={<Pencil size={14} />}
                            onPress={() => openEdit(contact)}
                          >
                            Editar
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<Trash2 size={14} />}
                            onPress={() => openDelete(contact)}
                          >
                            Eliminar
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Modal: Crear contacto */}
      <Modal isOpen={createModal.isOpen} onClose={createModal.onClose} size="lg">
        <ModalContent>
          <ModalHeader>Nuevo Contacto</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-3">
              <Input
                isRequired
                label="Nombre"
                startContent={<User size={14} className="text-default-400" />}
                value={form.name}
                onValueChange={(v) => setForm({ ...form, name: v })}
              />
              <Input
                label="Email"
                type="email"
                startContent={<Mail size={14} className="text-default-400" />}
                value={form.email}
                onValueChange={(v) => setForm({ ...form, email: v })}
              />
              <Input
                label="Teléfono"
                startContent={<Phone size={14} className="text-default-400" />}
                value={form.phone}
                onValueChange={(v) => setForm({ ...form, phone: v })}
              />
              <Input
                label="Empresa"
                startContent={<Building2 size={14} className="text-default-400" />}
                value={form.company}
                onValueChange={(v) => setForm({ ...form, company: v })}
              />
            </div>
            <Textarea
              label="Notas"
              value={form.notes}
              onValueChange={(v) => setForm({ ...form, notes: v })}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={createModal.onClose}>
              Cancelar
            </Button>
            <Button
              color="primary"
              isDisabled={!form.name.trim()}
              isLoading={saving}
              onPress={createContact}
            >
              Crear Contacto
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: Editar contacto */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.onClose} size="lg">
        <ModalContent>
          <ModalHeader>Editar Contacto</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-3">
              <Input
                isRequired
                label="Nombre"
                startContent={<User size={14} className="text-default-400" />}
                value={form.name}
                onValueChange={(v) => setForm({ ...form, name: v })}
              />
              <Input
                label="Email"
                type="email"
                startContent={<Mail size={14} className="text-default-400" />}
                value={form.email}
                onValueChange={(v) => setForm({ ...form, email: v })}
              />
              <Input
                label="Teléfono"
                startContent={<Phone size={14} className="text-default-400" />}
                value={form.phone}
                onValueChange={(v) => setForm({ ...form, phone: v })}
              />
              <Input
                label="Empresa"
                startContent={<Building2 size={14} className="text-default-400" />}
                value={form.company}
                onValueChange={(v) => setForm({ ...form, company: v })}
              />
            </div>
            <Textarea
              label="Notas"
              value={form.notes}
              onValueChange={(v) => setForm({ ...form, notes: v })}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={editModal.onClose}>
              Cancelar
            </Button>
            <Button
              color="primary"
              isDisabled={!form.name.trim()}
              isLoading={saving}
              onPress={updateContact}
            >
              Guardar Cambios
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: Ver detalle */}
      <Modal isOpen={viewModal.isOpen} onClose={viewModal.onClose} size="lg">
        <ModalContent>
          <ModalHeader>Detalle del Contacto</ModalHeader>
          <ModalBody>
            {selectedContact && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar
                    name={selectedContact.name?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                    size="lg"
                    color="primary"
                  />
                  <div>
                    <p className="text-lg font-semibold">{selectedContact.name}</p>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={sourceColors[selectedContact.source] || "default"}
                    >
                      {sourceLabels[selectedContact.source] || selectedContact.source}
                    </Chip>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-default-400" />
                    <div>
                      <p className="text-xs text-default-400">Email</p>
                      <p className="text-sm">{selectedContact.email || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-default-400" />
                    <div>
                      <p className="text-xs text-default-400">Teléfono</p>
                      <p className="text-sm">{selectedContact.phone || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-default-400" />
                    <div>
                      <p className="text-xs text-default-400">Empresa</p>
                      <p className="text-sm">{selectedContact.company || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-default-400" />
                    <div>
                      <p className="text-xs text-default-400">Creado</p>
                      <p className="text-sm">{formatDate(selectedContact.createdAt)}</p>
                    </div>
                  </div>
                </div>
                {(selectedContact.tags || []).length > 0 && (
                  <div>
                    <p className="text-xs text-default-400 mb-1">Tags</p>
                    <div className="flex gap-1 flex-wrap">
                      {selectedContact.tags.map((tag) => (
                        <Chip key={tag} size="sm" variant="bordered">{tag}</Chip>
                      ))}
                    </div>
                  </div>
                )}
                {selectedContact.notes && (
                  <div>
                    <p className="text-xs text-default-400 mb-1">Notas</p>
                    <p className="text-sm bg-default-50 p-3 rounded-lg">{selectedContact.notes}</p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={viewModal.onClose}>
              Cerrar
            </Button>
            <Button
              color="primary"
              startContent={<Pencil size={14} />}
              onPress={() => {
                viewModal.onClose();
                if (selectedContact) openEdit(selectedContact);
              }}
            >
              Editar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: Eliminar contacto */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Eliminar Contacto</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500">
              ¿Estás seguro de que deseas eliminar a{" "}
              <strong>{selectedContact?.name}</strong>? Esta acción no se puede
              deshacer.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={deleteModal.onClose} isDisabled={deleting}>
              Cancelar
            </Button>
            <Button color="danger" onPress={deleteContact} isLoading={deleting}>
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: Eliminar múltiples contactos */}
      <Modal isOpen={bulkDeleteModal.isOpen} onClose={bulkDeleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Eliminar Contactos</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500">
              ¿Estás seguro de que deseas eliminar{" "}
              <strong>{selectedKeys.size} contacto{selectedKeys.size > 1 ? 's' : ''}</strong>?
              Esta acción no se puede deshacer.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={bulkDeleteModal.onClose} isDisabled={deleting}>
              Cancelar
            </Button>
            <Button color="danger" onPress={bulkDeleteContacts} isLoading={deleting}>
              Eliminar {selectedKeys.size} contacto{selectedKeys.size > 1 ? 's' : ''}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </motion.div>
  );
}
