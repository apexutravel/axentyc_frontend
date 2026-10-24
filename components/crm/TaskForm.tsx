"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { API_URL } from "@/config/api";
import { errorMessage, unwrap } from "@/lib/crm";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Pre-linked records (when opened from a contact / lead / deal) */
  link?: { contactId?: string; leadId?: string; dealId?: string; conversationId?: string };
}

type Option = { _id: string; label: string };

/** "2026-10-22T15:30" (local) from an ISO string. */
const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function TaskForm({ isOpen, onClose, onSaved, link }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [contactId, setContactId] = useState<string>(link?.contactId || "");
  const [users, setUsers] = useState<Option[]>([]);
  const [contacts, setContacts] = useState<Option[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTitle("");
    setDescription("");
    setDueAt("");
    setPriority("medium");
    setAssignedTo("");
    setContactId(link?.contactId || "");
    api.get(`${API_URL}/users`, { skipWorkspace: true }).then((r) => setUsers((unwrap<any[]>(r) || []).map((u) => ({ _id: u._id, label: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email })))).catch(() => undefined);
    if (!link?.contactId) api.get(`${API_URL}/contacts`).then((r) => setContacts((unwrap<any[]>(r) || []).map((c) => ({ _id: c._id, label: c.name })))).catch(() => undefined);
  }, [isOpen, link?.contactId]);

  const save = async () => {
    if (!title.trim()) return toast.error("Escribe qué hay que hacer");
    setSaving(true);
    try {
      await api.post(`${API_URL}/tasks`, {
        title: title.trim(),
        description: description.trim() || undefined,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        priority,
        assignedTo: assignedTo || undefined,
        contactId: contactId || undefined,
        leadId: link?.leadId,
        dealId: link?.dealId,
        conversationId: link?.conversationId,
      });
      toast.success("Tarea creada");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo crear la tarea"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()} size="lg">
      <ModalContent>
        <ModalHeader>Nueva tarea</ModalHeader>
        <ModalBody className="gap-3">
          <Input autoFocus label="¿Qué hay que hacer?" value={title} variant="bordered" onValueChange={setTitle} />
          <Textarea label="Detalles (opcional)" minRows={2} value={description} variant="bordered" onValueChange={setDescription} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input label="Fecha y hora" type="datetime-local" value={dueAt} variant="bordered" onValueChange={setDueAt} />
            <Select label="Prioridad" selectedKeys={[priority]} variant="bordered" onSelectionChange={(k) => { const v = Array.from(k)[0] as string; if (v) setPriority(v); }}>
              <SelectItem key="low">Baja</SelectItem>
              <SelectItem key="medium">Media</SelectItem>
              <SelectItem key="high">Alta</SelectItem>
            </Select>
            <Select label="Responsable" placeholder="Yo" selectedKeys={assignedTo ? [assignedTo] : []} variant="bordered" onSelectionChange={(k) => setAssignedTo((Array.from(k)[0] as string) || "")}>
              {users.map((u) => <SelectItem key={u._id}>{u.label}</SelectItem>)}
            </Select>
            {!link?.contactId && (
              <Autocomplete label="Contacto (opcional)" selectedKey={contactId || null} variant="bordered" onSelectionChange={(k) => setContactId((k as string) || "")}>
                {contacts.map((c) => <AutocompleteItem key={c._id}>{c.label}</AutocompleteItem>)}
              </Autocomplete>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>Cancelar</Button>
          <Button color="primary" isLoading={saving} onPress={save}>Crear tarea</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export { toLocalInput };
