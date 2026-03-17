"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { Select, SelectItem } from "@heroui/select";
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
} from "@heroui/modal";
import { useDisclosure } from "@heroui/modal";
import { addToast } from "@heroui/toast";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  ArrowRightCircle,
  DollarSign,
  Users,
  TrendingUp,
  Target,
  Flame,
  LayoutGrid,
  List,
  Calendar,
  Tag,
  Building2,
  User,
  Phone,
  Mail,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";

/* ═══════════════ Types ═══════════════ */

interface Contact {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

interface Lead {
  _id: string;
  contactId: Contact | string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  estimatedValue?: number;
  currency?: string;
  assignedTo?: any;
  source?: string;
  tags: string[];
  expectedCloseDate?: string;
  lastActivityAt?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ═══════════════ Config ═══════════════ */

const STATUS_PIPELINE: { key: string; label: string; color: "primary" | "warning" | "success" | "default" | "danger" | "secondary"; icon: any }[] = [
  { key: "new", label: "Nuevo", color: "primary", icon: Zap },
  { key: "contacted", label: "Contactado", color: "warning", icon: Phone },
  { key: "qualified", label: "Calificado", color: "success", icon: CheckCircle2 },
  { key: "unqualified", label: "No Calificado", color: "default", icon: XCircle },
  { key: "converted", label: "Convertido", color: "secondary", icon: ArrowRightCircle },
  { key: "lost", label: "Perdido", color: "danger", icon: AlertCircle },
];

const statusMap: Record<string, typeof STATUS_PIPELINE[0]> = {};
STATUS_PIPELINE.forEach((s) => { statusMap[s.key] = s; });

const PRIORITY_CFG: Record<string, { label: string; color: "danger" | "warning" | "primary" | "default" }> = {
  urgent: { label: "Urgente", color: "danger" },
  high: { label: "Alta", color: "warning" },
  medium: { label: "Media", color: "primary" },
  low: { label: "Baja", color: "default" },
};

const SOURCE_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook",
  tiktok: "TikTok", web_chat: "Web Chat", email: "Email",
  referral: "Referido", organic: "Orgánico", paid: "Publicidad", other: "Otro",
};

const KANBAN_COLUMNS = STATUS_PIPELINE.filter(s => !["converted", "lost"].includes(s.key));

function unwrap<T>(response: any): T {
  return (response?.data ?? response) as T;
}

function fmtMoney(v?: number, cur?: string) {
  if (!v) return "—";
  return new Intl.NumberFormat("es", { style: "currency", currency: cur || "USD", maximumFractionDigits: 0 }).format(v);
}

function fmtDate(d?: string) {
  if (!d) return "—";
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `Hace ${days}d`;
  return date.toLocaleDateString("es", { day: "numeric", month: "short" });
}

function contactName(c: Contact | string | undefined): string {
  if (!c) return "Sin contacto";
  if (typeof c === "string") return c;
  return c.name || c.email || "Sin nombre";
}

function contactObj(c: Contact | string | undefined): Contact | null {
  if (!c || typeof c === "string") return null;
  return c;
}

/* ═══════════════ Component ═══════════════ */

export default function LeadsPage() {
  /* state */
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const createModal = useDisclosure();
  const editModal = useDisclosure();
  const viewModal = useDisclosure();
  const deleteModal = useDisclosure();
  const bulkDeleteModal = useDisclosure();
  const convertModal = useDisclosure();

  const emptyForm = {
    contactId: "",
    title: "",
    description: "",
    status: "new",
    priority: "medium",
    estimatedValue: "",
    currency: "USD",
    source: "",
    tags: "",
    expectedCloseDate: "",
    notes: "",
  };
  const [form, setForm] = useState(emptyForm);
  const setField = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  /* ─── API calls ─── */
  const loadLeads = useCallback(async () => {
    try {
      const data = await api.get<Lead[]>(API_ENDPOINTS.leads.list);
      const list = unwrap<Lead[]>(data);
      setLeads(Array.isArray(list) ? list : []);
    } catch (e: any) {
      console.error("Error loading leads:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      const data = await api.get<Contact[]>(API_ENDPOINTS.contacts.list);
      const list = unwrap<Contact[]>(data);
      setContacts(Array.isArray(list) ? list : []);
    } catch {}
  }, []);

  useEffect(() => { loadLeads(); loadContacts(); }, [loadLeads, loadContacts]);

  const createLead = async () => {
    if (!form.title.trim() || !form.contactId) return;
    setSaving(true);
    try {
      const payload: any = {
        contactId: form.contactId,
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority,
        source: form.source || undefined,
        notes: form.notes || undefined,
        currency: form.currency || "USD",
      };
      if (form.estimatedValue) payload.estimatedValue = Number(form.estimatedValue);
      if (form.expectedCloseDate) payload.expectedCloseDate = form.expectedCloseDate;
      if (form.tags) payload.tags = form.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      await api.post(API_ENDPOINTS.leads.create, payload);
      addToast({ title: "Lead creado exitosamente", color: "success" });
      createModal.onClose();
      setForm(emptyForm);
      loadLeads();
    } catch (e: any) {
      addToast({ title: "Error al crear lead", color: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const updateLead = async () => {
    if (!selectedLead || !form.title.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority,
        source: form.source || undefined,
        notes: form.notes || undefined,
        currency: form.currency || "USD",
      };
      if (form.contactId) payload.contactId = form.contactId;
      if (form.estimatedValue) payload.estimatedValue = Number(form.estimatedValue);
      if (form.expectedCloseDate) payload.expectedCloseDate = form.expectedCloseDate;
      if (form.tags) payload.tags = form.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      await api.patch(API_ENDPOINTS.leads.update(selectedLead._id), payload);
      addToast({ title: "Lead actualizado", color: "success" });
      editModal.onClose();
      setForm(emptyForm);
      loadLeads();
    } catch (e: any) {
      addToast({ title: "Error al actualizar lead", color: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const updateLeadStatus = async (lead: Lead, newStatus: string) => {
    try {
      await api.patch(API_ENDPOINTS.leads.update(lead._id), { status: newStatus });
      setLeads((prev) => prev.map((l) => l._id === lead._id ? { ...l, status: newStatus } : l));
      addToast({ title: `Lead movido a ${statusMap[newStatus]?.label}`, color: "success" });
    } catch {
      addToast({ title: "Error al mover lead", color: "danger" });
    }
  };

  const deleteLead = async () => {
    if (!selectedLead) return;
    setDeleting(true);
    try {
      await api.delete(API_ENDPOINTS.leads.delete(selectedLead._id));
      addToast({ title: "Lead eliminado", color: "success" });
      deleteModal.onClose();
      setSelectedLead(null);
      loadLeads();
    } catch {
      addToast({ title: "Error al eliminar lead", color: "danger" });
    } finally {
      setDeleting(false);
    }
  };

  const bulkDeleteLeads = async () => {
    if (selectedKeys.size === 0) return;
    setDeleting(true);
    try {
      await api.post(API_ENDPOINTS.leads.bulkDelete, { ids: Array.from(selectedKeys) });
      addToast({ title: `${selectedKeys.size} lead(s) eliminado(s)`, color: "success" });
      bulkDeleteModal.onClose();
      setSelectedKeys(new Set());
      loadLeads();
    } catch {
      addToast({ title: "Error al eliminar leads", color: "danger" });
    } finally {
      setDeleting(false);
    }
  };

  const convertToDeal = async () => {
    if (!selectedLead) return;
    setConverting(true);
    try {
      await api.post(API_ENDPOINTS.leads.convert(selectedLead._id), {});
      addToast({ title: "Lead convertido a Deal exitosamente", color: "success" });
      convertModal.onClose();
      setSelectedLead(null);
      loadLeads();
    } catch {
      addToast({ title: "Error al convertir lead", color: "danger" });
    } finally {
      setConverting(false);
    }
  };

  /* ─── Helpers ─── */
  const openCreate = () => { setForm(emptyForm); createModal.onOpen(); };
  const openEdit = (lead: Lead) => {
    setSelectedLead(lead);
    const c = contactObj(lead.contactId);
    setForm({
      contactId: c?._id || "",
      title: lead.title || "",
      description: lead.description || "",
      status: lead.status || "new",
      priority: lead.priority || "medium",
      estimatedValue: lead.estimatedValue?.toString() || "",
      currency: lead.currency || "USD",
      source: lead.source || "",
      tags: (lead.tags || []).join(", "),
      expectedCloseDate: lead.expectedCloseDate ? new Date(lead.expectedCloseDate).toISOString().split("T")[0] : "",
      notes: lead.notes || "",
    });
    editModal.onOpen();
  };
  const openView = (lead: Lead) => { setSelectedLead(lead); viewModal.onOpen(); };
  const openDelete = (lead: Lead) => { setSelectedLead(lead); deleteModal.onOpen(); };
  const openConvert = (lead: Lead) => { setSelectedLead(lead); convertModal.onOpen(); };

  /* ─── Filtered data ─── */
  const filtered = useMemo(() => {
    let list = leads;
    if (statusFilter !== "all") list = list.filter((l) => l.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((l) =>
        l.title?.toLowerCase().includes(q) ||
        contactName(l.contactId).toLowerCase().includes(q) ||
        l.source?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [leads, statusFilter, search]);

  /* ─── Pipeline stats ─── */
  const stats = useMemo(() => {
    const total = leads.length;
    const totalValue = leads.reduce((s, l) => s + (l.estimatedValue || 0), 0);
    const newCount = leads.filter((l) => l.status === "new").length;
    const convertedCount = leads.filter((l) => l.status === "converted").length;
    const convRate = total > 0 ? Math.round((convertedCount / total) * 100) : 0;
    return { total, totalValue, newCount, convertedCount, convRate };
  }, [leads]);

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-5" initial={{ opacity: 0, y: 20 }}>

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline de Leads</h1>
          <p className="text-default-500 text-sm mt-0.5">
            Gestiona y convierte tus leads en oportunidades de negocio
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedKeys.size > 0 && (
            <Button color="danger" variant="flat" size="sm" startContent={<Trash2 size={14} />}
              onPress={bulkDeleteModal.onOpen}>
              Eliminar ({selectedKeys.size})
            </Button>
          )}
          <Button color="primary" startContent={<Plus size={16} />} onPress={openCreate}>
            Nuevo Lead
          </Button>
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: stats.total, icon: Users, color: "text-primary", bg: "bg-primary/10" },
          { label: "Valor Pipeline", value: fmtMoney(stats.totalValue), icon: DollarSign, color: "text-success", bg: "bg-success/10" },
          { label: "Leads Nuevos", value: stats.newCount, icon: Flame, color: "text-warning", bg: "bg-warning/10" },
          { label: "Tasa Conversión", value: `${stats.convRate}%`, icon: TrendingUp, color: "text-secondary", bg: "bg-secondary/10" },
        ].map((s) => (
          <Card key={s.label} className="border border-divider">
            <CardBody className="flex-row items-center gap-3 py-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-xs text-default-400">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* ─── Toolbar ─── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Input
            className="max-w-xs"
            placeholder="Buscar leads..."
            size="sm"
            startContent={<Search className="text-default-400" size={14} />}
            value={search}
            onValueChange={setSearch}
            isClearable
            onClear={() => setSearch("")}
          />
          <Tabs
            size="sm"
            variant="light"
            selectedKey={statusFilter}
            onSelectionChange={(k) => setStatusFilter(k as string)}
          >
            <Tab key="all" title="Todos" />
            <Tab key="new" title="Nuevos" />
            <Tab key="contacted" title="Contactados" />
            <Tab key="qualified" title="Calificados" />
          </Tabs>
        </div>
        <div className="flex items-center gap-1 bg-default-100 rounded-lg p-0.5">
          <Button
            size="sm"
            variant={viewMode === "kanban" ? "solid" : "light"}
            color={viewMode === "kanban" ? "primary" : "default"}
            isIconOnly
            className="min-w-8 w-8 h-7"
            onPress={() => setViewMode("kanban")}
          >
            <LayoutGrid size={14} />
          </Button>
          <Button
            size="sm"
            variant={viewMode === "table" ? "solid" : "light"}
            color={viewMode === "table" ? "primary" : "default"}
            isIconOnly
            className="min-w-8 w-8 h-7"
            onPress={() => setViewMode("table")}
          >
            <List size={14} />
          </Button>
        </div>
      </div>

      {/* ─── Content ─── */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : viewMode === "kanban" ? (
        /* ═══ KANBAN VIEW ═══ */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => {
            const colLeads = filtered.filter((l) => l.status === col.key);
            const colValue = colLeads.reduce((s, l) => s + (l.estimatedValue || 0), 0);
            const Icon = col.icon;
            return (
              <div key={col.key} className="min-w-[280px] w-[280px] shrink-0 flex flex-col">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${col.color}`} />
                    <span className="text-sm font-semibold">{col.label}</span>
                    <Chip size="sm" variant="flat" className="text-xs h-5">{colLeads.length}</Chip>
                  </div>
                  <span className="text-xs text-default-400">{fmtMoney(colValue)}</span>
                </div>

                {/* Column body */}
                <div className="flex-1 space-y-2 min-h-[200px]">
                  {colLeads.length === 0 ? (
                    <div className="border-2 border-dashed border-default-200 rounded-xl flex items-center justify-center h-24 text-default-300 text-xs">
                      Sin leads
                    </div>
                  ) : (
                    colLeads.map((lead) => (
                      <Card
                        key={lead._id}
                        isPressable
                        onPress={() => openView(lead)}
                        className="border border-divider shadow-sm hover:shadow-md transition-shadow"
                      >
                        <CardBody className="p-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-semibold leading-tight flex-1 pr-2">{lead.title}</p>
                            <Dropdown>
                              <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light" className="min-w-6 w-6 h-6">
                                  <MoreVertical size={12} />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu
                                aria-label="Lead actions"
                                onAction={(key) => {
                                  if (key === "view") openView(lead);
                                  else if (key === "edit") openEdit(lead);
                                  else if (key === "convert") openConvert(lead);
                                  else if (key === "move-contacted") updateLeadStatus(lead, "contacted");
                                  else if (key === "move-qualified") updateLeadStatus(lead, "qualified");
                                  else if (key === "lost") updateLeadStatus(lead, "lost");
                                  else if (key === "delete") openDelete(lead);
                                }}
                                items={[
                                  { key: "view", label: "Ver detalle" },
                                  { key: "edit", label: "Editar" },
                                  ...(lead.status !== "converted" ? [{ key: "convert", label: "Convertir a Deal" }] : []),
                                  ...(col.key === "new" ? [{ key: "move-contacted", label: "Mover a Contactado" }] : []),
                                  ...(col.key === "contacted" ? [{ key: "move-qualified", label: "Mover a Calificado" }] : []),
                                  { key: "lost", label: "Marcar como Perdido" },
                                  { key: "delete", label: "Eliminar" },
                                ]}
                              >
                                {(item: any) => (
                                  <DropdownItem
                                    key={item.key}
                                    className={item.key === "lost" || item.key === "delete" ? "text-danger" : ""}
                                    color={item.key === "lost" || item.key === "delete" ? "danger" : "default"}
                                    startContent={
                                      item.key === "view" ? <Eye size={14} /> :
                                      item.key === "edit" ? <Pencil size={14} /> :
                                      item.key === "convert" ? <ArrowRightCircle size={14} /> :
                                      item.key === "move-contacted" || item.key === "move-qualified" ? <ChevronRight size={14} /> :
                                      item.key === "lost" ? <XCircle size={14} /> :
                                      item.key === "delete" ? <Trash2 size={14} /> : null
                                    }
                                  >
                                    {item.label}
                                  </DropdownItem>
                                )}
                              </DropdownMenu>
                            </Dropdown>
                          </div>

                          <div className="flex items-center gap-2">
                            <Avatar size="sm" name={contactName(lead.contactId)} className="w-5 h-5 text-[10px]" />
                            <span className="text-xs text-default-500 truncate">{contactName(lead.contactId)}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <Chip size="sm" variant="dot" color={PRIORITY_CFG[lead.priority]?.color || "default"} className="text-[10px]">
                              {PRIORITY_CFG[lead.priority]?.label || lead.priority}
                            </Chip>
                            {lead.estimatedValue ? (
                              <span className="text-xs font-bold text-success">{fmtMoney(lead.estimatedValue, lead.currency)}</span>
                            ) : null}
                          </div>

                          {lead.source && (
                            <div className="flex items-center gap-1">
                              <Target size={10} className="text-default-400" />
                              <span className="text-[10px] text-default-400">{SOURCE_LABELS[lead.source] || lead.source}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1 text-[10px] text-default-300">
                            <Clock size={10} />
                            <span>{fmtDate(lead.createdAt)}</span>
                          </div>
                        </CardBody>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {/* Converted + Lost columns (collapsed) */}
          {STATUS_PIPELINE.filter(s => ["converted", "lost"].includes(s.key)).map((col) => {
            const colLeads = filtered.filter((l) => l.status === col.key);
            return (
              <div key={col.key} className="min-w-[200px] w-[200px] shrink-0 flex flex-col opacity-70">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`w-2 h-2 rounded-full bg-${col.color}`} />
                  <span className="text-sm font-semibold">{col.label}</span>
                  <Chip size="sm" variant="flat" className="text-xs h-5">{colLeads.length}</Chip>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {colLeads.length === 0 ? (
                    <div className="border-2 border-dashed border-default-200 rounded-xl flex items-center justify-center h-16 text-default-300 text-xs">
                      Vacío
                    </div>
                  ) : colLeads.map((lead) => (
                    <Card key={lead._id} isPressable onPress={() => openView(lead)} className="border border-divider">
                      <CardBody className="p-2">
                        <p className="text-xs font-medium truncate">{lead.title}</p>
                        <p className="text-[10px] text-default-400 truncate">{contactName(lead.contactId)}</p>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ═══ TABLE VIEW ═══ */
        <Card className="border border-divider">
          <CardBody className="p-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Target size={40} className="text-default-300 mb-3" />
                <p className="text-sm text-default-500">No hay leads</p>
                <p className="text-xs text-default-400 mt-1">Crea tu primer lead para empezar</p>
              </div>
            ) : (
              <Table
                aria-label="Leads table"
                removeWrapper
                selectionMode="multiple"
                selectedKeys={selectedKeys}
                onSelectionChange={(keys) => {
                  setSelectedKeys(keys === "all" ? new Set(filtered.map((l) => l._id)) : keys as Set<string>);
                }}
              >
                <TableHeader>
                  <TableColumn>LEAD</TableColumn>
                  <TableColumn>ESTADO</TableColumn>
                  <TableColumn>PRIORIDAD</TableColumn>
                  <TableColumn>VALOR</TableColumn>
                  <TableColumn>FUENTE</TableColumn>
                  <TableColumn>CREADO</TableColumn>
                  <TableColumn width={50}>ACCIONES</TableColumn>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => (
                    <TableRow key={lead._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar size="sm" name={contactName(lead.contactId)} color="primary" />
                          <div>
                            <p className="text-sm font-medium">{lead.title}</p>
                            <p className="text-xs text-default-400">{contactName(lead.contactId)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip color={statusMap[lead.status]?.color || "default"} size="sm" variant="flat">
                          {statusMap[lead.status]?.label || lead.status}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip color={PRIORITY_CFG[lead.priority]?.color || "default"} size="sm" variant="dot">
                          {PRIORITY_CFG[lead.priority]?.label || lead.priority}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold">{fmtMoney(lead.estimatedValue, lead.currency)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-default-500">{SOURCE_LABELS[lead.source || ""] || lead.source || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-default-500">{fmtDate(lead.createdAt)}</span>
                      </TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light"><MoreVertical size={14} /></Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label="Lead actions"
                            onAction={(key) => {
                              if (key === "view") openView(lead);
                              else if (key === "edit") openEdit(lead);
                              else if (key === "convert") openConvert(lead);
                              else if (key === "delete") openDelete(lead);
                            }}
                            items={[
                              { key: "view", label: "Ver detalle" },
                              { key: "edit", label: "Editar" },
                              ...(lead.status !== "converted" ? [{ key: "convert", label: "Convertir a Deal" }] : []),
                              { key: "delete", label: "Eliminar" },
                            ]}
                          >
                            {(item: any) => (
                              <DropdownItem
                                key={item.key}
                                className={item.key === "delete" ? "text-danger" : ""}
                                color={item.key === "delete" ? "danger" : "default"}
                                startContent={
                                  item.key === "view" ? <Eye size={14} /> :
                                  item.key === "edit" ? <Pencil size={14} /> :
                                  item.key === "convert" ? <ArrowRightCircle size={14} /> :
                                  item.key === "delete" ? <Trash2 size={14} /> : null
                                }
                              >
                                {item.label}
                              </DropdownItem>
                            )}
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
      )}

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* ─── Create Lead ─── */}
      <Modal isOpen={createModal.isOpen} onClose={createModal.onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <Plus size={18} className="text-primary" />
            Nuevo Lead
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input isRequired label="Título del Lead" placeholder="Ej: Plan Premium - Empresa X"
                  value={form.title} onValueChange={(v) => setField("title", v)} />
                <Select label="Contacto" placeholder="Seleccionar contacto" isRequired
                  selectedKeys={form.contactId ? [form.contactId] : []}
                  onSelectionChange={(keys) => { const id = Array.from(keys)[0] as string; setField("contactId", id || ""); }}>
                  {contacts.map((c) => (
                    <SelectItem key={c._id}>{c.name}{c.company ? ` — ${c.company}` : ""}</SelectItem>
                  ))}
                </Select>
              </div>
              <Textarea label="Descripción" placeholder="Describe la oportunidad..."
                value={form.description} onValueChange={(v) => setField("description", v)} minRows={2} />
              <div className="grid grid-cols-3 gap-3">
                <Select label="Estado" selectedKeys={[form.status]}
                  onSelectionChange={(keys) => setField("status", Array.from(keys)[0] as string)}>
                  {STATUS_PIPELINE.map((s) => (
                    <SelectItem key={s.key}>{s.label}</SelectItem>
                  ))}
                </Select>
                <Select label="Prioridad" selectedKeys={[form.priority]}
                  onSelectionChange={(keys) => setField("priority", Array.from(keys)[0] as string)}>
                  <SelectItem key="low">Baja</SelectItem>
                  <SelectItem key="medium">Media</SelectItem>
                  <SelectItem key="high">Alta</SelectItem>
                  <SelectItem key="urgent">Urgente</SelectItem>
                </Select>
                <Select label="Fuente" placeholder="Seleccionar" selectedKeys={form.source ? [form.source] : []}
                  onSelectionChange={(keys) => setField("source", Array.from(keys)[0] as string || "")}>
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                    <SelectItem key={k}>{v}</SelectItem>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Valor Estimado" type="number" placeholder="0"
                  startContent={<DollarSign size={14} className="text-default-400" />}
                  value={form.estimatedValue} onValueChange={(v) => setField("estimatedValue", v)} />
                <Select label="Moneda" selectedKeys={[form.currency]}
                  onSelectionChange={(keys) => setField("currency", Array.from(keys)[0] as string)}>
                  <SelectItem key="USD">USD</SelectItem>
                  <SelectItem key="EUR">EUR</SelectItem>
                  <SelectItem key="MXN">MXN</SelectItem>
                  <SelectItem key="COP">COP</SelectItem>
                  <SelectItem key="ARS">ARS</SelectItem>
                </Select>
                <Input label="Cierre Esperado" type="date"
                  value={form.expectedCloseDate} onValueChange={(v) => setField("expectedCloseDate", v)} />
              </div>
              <Input label="Tags" placeholder="ventas, enterprise, urgente (separados por coma)"
                startContent={<Tag size={14} className="text-default-400" />}
                value={form.tags} onValueChange={(v) => setField("tags", v)} />
              <Textarea label="Notas" placeholder="Notas adicionales..."
                value={form.notes} onValueChange={(v) => setField("notes", v)} minRows={2} />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={createModal.onClose}>Cancelar</Button>
            <Button color="primary" isDisabled={!form.title.trim() || !form.contactId} isLoading={saving} onPress={createLead}>
              Crear Lead
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ─── Edit Lead ─── */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <Pencil size={18} className="text-primary" />
            Editar Lead
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input isRequired label="Título del Lead" value={form.title} onValueChange={(v) => setField("title", v)} />
                <Select label="Contacto" selectedKeys={form.contactId ? [form.contactId] : []}
                  onSelectionChange={(keys) => { const id = Array.from(keys)[0] as string; setField("contactId", id || ""); }}>
                  {contacts.map((c) => (
                    <SelectItem key={c._id}>{c.name}{c.company ? ` — ${c.company}` : ""}</SelectItem>
                  ))}
                </Select>
              </div>
              <Textarea label="Descripción" value={form.description} onValueChange={(v) => setField("description", v)} minRows={2} />
              <div className="grid grid-cols-3 gap-3">
                <Select label="Estado" selectedKeys={[form.status]}
                  onSelectionChange={(keys) => setField("status", Array.from(keys)[0] as string)}>
                  {STATUS_PIPELINE.map((s) => (
                    <SelectItem key={s.key}>{s.label}</SelectItem>
                  ))}
                </Select>
                <Select label="Prioridad" selectedKeys={[form.priority]}
                  onSelectionChange={(keys) => setField("priority", Array.from(keys)[0] as string)}>
                  <SelectItem key="low">Baja</SelectItem>
                  <SelectItem key="medium">Media</SelectItem>
                  <SelectItem key="high">Alta</SelectItem>
                  <SelectItem key="urgent">Urgente</SelectItem>
                </Select>
                <Select label="Fuente" selectedKeys={form.source ? [form.source] : []}
                  onSelectionChange={(keys) => setField("source", Array.from(keys)[0] as string || "")}>
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                    <SelectItem key={k}>{v}</SelectItem>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Valor Estimado" type="number" startContent={<DollarSign size={14} className="text-default-400" />}
                  value={form.estimatedValue} onValueChange={(v) => setField("estimatedValue", v)} />
                <Select label="Moneda" selectedKeys={[form.currency]}
                  onSelectionChange={(keys) => setField("currency", Array.from(keys)[0] as string)}>
                  <SelectItem key="USD">USD</SelectItem>
                  <SelectItem key="EUR">EUR</SelectItem>
                  <SelectItem key="MXN">MXN</SelectItem>
                  <SelectItem key="COP">COP</SelectItem>
                  <SelectItem key="ARS">ARS</SelectItem>
                </Select>
                <Input label="Cierre Esperado" type="date"
                  value={form.expectedCloseDate} onValueChange={(v) => setField("expectedCloseDate", v)} />
              </div>
              <Input label="Tags" startContent={<Tag size={14} className="text-default-400" />}
                value={form.tags} onValueChange={(v) => setField("tags", v)} />
              <Textarea label="Notas" value={form.notes} onValueChange={(v) => setField("notes", v)} minRows={2} />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={editModal.onClose}>Cancelar</Button>
            <Button color="primary" isDisabled={!form.title.trim()} isLoading={saving} onPress={updateLead}>
              Guardar Cambios
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ─── View Lead Detail ─── */}
      <Modal isOpen={viewModal.isOpen} onClose={viewModal.onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>Detalle del Lead</ModalHeader>
          <ModalBody>
            {selectedLead && (
              <div className="space-y-5">
                {/* Title + Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{selectedLead.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Chip color={statusMap[selectedLead.status]?.color || "default"} size="sm" variant="flat">
                        {statusMap[selectedLead.status]?.label || selectedLead.status}
                      </Chip>
                      <Chip color={PRIORITY_CFG[selectedLead.priority]?.color || "default"} size="sm" variant="dot">
                        {PRIORITY_CFG[selectedLead.priority]?.label || selectedLead.priority}
                      </Chip>
                    </div>
                  </div>
                  {selectedLead.estimatedValue ? (
                    <div className="text-right">
                      <p className="text-xs text-default-400">Valor estimado</p>
                      <p className="text-xl font-bold text-success">{fmtMoney(selectedLead.estimatedValue, selectedLead.currency)}</p>
                    </div>
                  ) : null}
                </div>

                {/* Contact info */}
                {contactObj(selectedLead.contactId) && (
                  <Card className="border border-divider">
                    <CardBody className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm" name={contactName(selectedLead.contactId)} color="primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{contactObj(selectedLead.contactId)?.name}</p>
                          <div className="flex items-center gap-3 text-xs text-default-400">
                            {contactObj(selectedLead.contactId)?.email && (
                              <span className="flex items-center gap-1"><Mail size={10} />{contactObj(selectedLead.contactId)?.email}</span>
                            )}
                            {contactObj(selectedLead.contactId)?.phone && (
                              <span className="flex items-center gap-1"><Phone size={10} />{contactObj(selectedLead.contactId)?.phone}</span>
                            )}
                            {contactObj(selectedLead.contactId)?.company && (
                              <span className="flex items-center gap-1"><Building2 size={10} />{contactObj(selectedLead.contactId)?.company}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-default-400" />
                    <div>
                      <p className="text-xs text-default-400">Fuente</p>
                      <p className="text-sm">{SOURCE_LABELS[selectedLead.source || ""] || selectedLead.source || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-default-400" />
                    <div>
                      <p className="text-xs text-default-400">Cierre Esperado</p>
                      <p className="text-sm">{selectedLead.expectedCloseDate ? new Date(selectedLead.expectedCloseDate).toLocaleDateString("es") : "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-default-400" />
                    <div>
                      <p className="text-xs text-default-400">Creado</p>
                      <p className="text-sm">{fmtDate(selectedLead.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-default-400" />
                    <div>
                      <p className="text-xs text-default-400">Última Actividad</p>
                      <p className="text-sm">{fmtDate(selectedLead.lastActivityAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedLead.description && (
                  <div>
                    <p className="text-xs text-default-400 mb-1">Descripción</p>
                    <p className="text-sm bg-default-50 dark:bg-default-100/50 p-3 rounded-lg">{selectedLead.description}</p>
                  </div>
                )}

                {/* Tags */}
                {(selectedLead.tags || []).length > 0 && (
                  <div>
                    <p className="text-xs text-default-400 mb-1">Tags</p>
                    <div className="flex gap-1 flex-wrap">
                      {selectedLead.tags.map((tag) => (
                        <Chip key={tag} size="sm" variant="bordered">{tag}</Chip>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedLead.notes && (
                  <div>
                    <p className="text-xs text-default-400 mb-1">Notas</p>
                    <p className="text-sm bg-default-50 dark:bg-default-100/50 p-3 rounded-lg whitespace-pre-wrap">{selectedLead.notes}</p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={viewModal.onClose}>Cerrar</Button>
            {selectedLead?.status !== "converted" && (
              <Button color="secondary" variant="flat" startContent={<ArrowRightCircle size={14} />}
                onPress={() => { viewModal.onClose(); if (selectedLead) openConvert(selectedLead); }}>
                Convertir a Deal
              </Button>
            )}
            <Button color="primary" startContent={<Pencil size={14} />}
              onPress={() => { viewModal.onClose(); if (selectedLead) openEdit(selectedLead); }}>
              Editar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ─── Delete Lead ─── */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Eliminar Lead</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500">
              ¿Estás seguro de que deseas eliminar el lead <strong>{selectedLead?.title}</strong>? Esta acción no se puede deshacer.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={deleteModal.onClose} isDisabled={deleting}>Cancelar</Button>
            <Button color="danger" onPress={deleteLead} isLoading={deleting}>Eliminar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ─── Bulk Delete ─── */}
      <Modal isOpen={bulkDeleteModal.isOpen} onClose={bulkDeleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Eliminar Leads</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500">
              ¿Estás seguro de que deseas eliminar <strong>{selectedKeys.size} lead(s)</strong>? Esta acción no se puede deshacer.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={bulkDeleteModal.onClose} isDisabled={deleting}>Cancelar</Button>
            <Button color="danger" onPress={bulkDeleteLeads} isLoading={deleting}>Eliminar {selectedKeys.size} leads</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ─── Convert to Deal ─── */}
      <Modal isOpen={convertModal.isOpen} onClose={convertModal.onClose}>
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <ArrowRightCircle size={18} className="text-secondary" />
            Convertir Lead a Deal
          </ModalHeader>
          <ModalBody>
            {selectedLead && (
              <div className="space-y-3">
                <p className="text-sm text-default-500">
                  Se creará un nuevo Deal basado en la información de este lead:
                </p>
                <Card className="border border-divider">
                  <CardBody className="p-3 space-y-1">
                    <p className="text-sm font-semibold">{selectedLead.title}</p>
                    <p className="text-xs text-default-400">{contactName(selectedLead.contactId)}</p>
                    {selectedLead.estimatedValue ? (
                      <p className="text-sm font-bold text-success">{fmtMoney(selectedLead.estimatedValue, selectedLead.currency)}</p>
                    ) : null}
                  </CardBody>
                </Card>
                <p className="text-xs text-default-400">
                  El lead será marcado como &quot;Convertido&quot; y el deal se creará en la etapa inicial del pipeline.
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={convertModal.onClose} isDisabled={converting}>Cancelar</Button>
            <Button color="secondary" onPress={convertToDeal} isLoading={converting} startContent={<ArrowRightCircle size={14} />}>
              Convertir a Deal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </motion.div>
  );
}
