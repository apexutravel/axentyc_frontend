"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { Textarea } from "@heroui/input";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { motion, AnimatePresence } from "framer-motion";
import { addToast } from "@heroui/toast";
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Globe,
  User,
  RefreshCw,
  MessagesSquare,
  Trash2,
  UserPlus,
  TrendingUp,
  Target,
  PanelRightOpen,
  PanelRightClose,
  Mail,
  Phone,
  Building2,
  Save,
  StickyNote,
  Tag,
} from "lucide-react";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/contexts/AuthContext";

interface Conversation {
  _id: string;
  contactId: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    notes?: string;
    tags?: string[];
    source?: string;
  };
  channel: string;
  status: string;
  subject?: string;
  tags?: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  metadata?: {
    widgetId?: string;
    visitorId?: string;
  };
  createdAt: string;
}

interface Message {
  _id: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  type: string;
  content: string;
  senderName?: string;
  senderId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: string;
  metadata?: any;
  createdAt: string;
}

interface TeamMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const statusColors: Record<string, "success" | "warning" | "default" | "danger" | "primary" | "secondary"> = {
  open: "success",
  pending: "warning",
  assigned: "primary",
  in_progress: "secondary",
  converted: "success",
  resolved: "default",
  closed: "danger",
};

const statusLabels: Record<string, string> = {
  open: "Nuevo",
  pending: "Pendiente",
  assigned: "Asignado",
  in_progress: "En progreso",
  converted: "Convertido",
  resolved: "Resuelto",
  closed: "Cerrado",
};

// --- SVG Checkmark Icons ---
function SingleCheck({ color = "#8696a0" }: { color?: string }) {
  return (
    <svg width="16" height="11" viewBox="0 0 12 9" fill={color}>
      <path d="M10.97.97a.75.75 0 0 1 1.06 1.06l-7.5 7.5a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 1 1 1.06-1.06L4 7.94l6.97-6.97z" />
    </svg>
  );
}

function DoubleCheck({ color = "#8696a0" }: { color?: string }) {
  return (
    <svg width="20" height="13" viewBox="0 0 16 11" fill={color}>
      <path d="M11.766.522A.75.75 0 0 0 10.732.5L6.232 5l-1.982-1.982a.75.75 0 0 0-1.06 1.06l2.5 2.5a.75.75 0 0 0 1.06 0l5-5a.75.75 0 0 0 .016-1.056zm3.5 0a.75.75 0 0 0-1.034-.022l-5 5a.75.75 0 0 0 1.06 1.06l5-5a.75.75 0 0 0-.026-1.038z" />
    </svg>
  );
}

function ClockIcon({ color = "#8696a0" }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="1">
      <circle cx="6" cy="6" r="5" />
      <path d="M6 3v3l2 2" />
    </svg>
  );
}

function FailedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="#f87171" strokeWidth="1">
      <circle cx="6" cy="6" r="5" />
      <path d="M6 3v3M6 8h.01" />
    </svg>
  );
}

function MessageStatus({ status }: { status: string }) {
  const s = (status || "delivered").toLowerCase();
  if (s === "read") return <DoubleCheck color="#53bdeb" />;
  if (s === "delivered") return <DoubleCheck color="#8696a0" />;
  if (s === "sent") return <SingleCheck color="#8696a0" />;
  if (s === "pending") return <ClockIcon />;
  if (s === "failed") return <FailedIcon />;
  return <DoubleCheck color="#8696a0" />;
}

export default function LiveChatPage() {
  const { tenant } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { on, joinWidgetAdmin, joinTenant, isConnected } = useSocket();

  const [showContactPanel, setShowContactPanel] = useState(false);
  const [contactEdit, setContactEdit] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });
  const [savingContact, setSavingContact] = useState(false);

  // Modals
  const assignModal = useDisclosure();
  const convertLeadModal = useDisclosure();
  const convertDealModal = useDisclosure();
  const deleteModal = useDisclosure();

  // Convert form state
  const [convertTitle, setConvertTitle] = useState("");
  const [convertDescription, setConvertDescription] = useState("");
  const [convertValue, setConvertValue] = useState("");
  const [converting, setConverting] = useState(false);

  const unwrapResponse = useCallback(<T,>(response: any): T => {
    return (response?.data ?? response) as T;
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- Data Loading ---

  const loadConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("channel", "web_chat");
      if (statusFilter !== "all") params.set("status", statusFilter);

      const data = await api.get<Conversation[]>(
        `${API_ENDPOINTS.conversations.list}?${params.toString()}`
      );
      const conversationsData = unwrapResponse<Conversation[]>(data);
      setConversations(Array.isArray(conversationsData) ? conversationsData : []);
    } catch (error: any) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoadingConvs(false);
    }
  }, [statusFilter]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMsgs(true);
    try {
      const data = await api.get<{ messages: Message[]; total: number }>(
        API_ENDPOINTS.conversations.messages(conversationId)
      );
      const messagesData = unwrapResponse<{ messages: Message[]; total: number }>(data);
      const normalized = (messagesData.messages || []).map((m) => ({
        ...m,
        status:
          m.direction === "outbound" && m.status?.toLowerCase() === "sent"
            ? "delivered"
            : m.status,
      }));
      setMessages(normalized.slice().reverse());
      setTimeout(scrollToBottom, 100);

      await api.post(API_ENDPOINTS.conversations.markRead(conversationId));

      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (error: any) {
      console.error("Error loading messages:", error);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  const loadTeamMembers = useCallback(async () => {
    try {
      const data = await api.get<TeamMember[]>(API_ENDPOINTS.users.list);
      const members = unwrapResponse<TeamMember[]>(data);
      setTeamMembers(Array.isArray(members) ? members : []);
    } catch (error: any) {
      console.error("Error loading team members:", error);
    }
  }, []);

  const selectConversation = useCallback(
    (conv: Conversation) => {
      setSelectedConv(conv);
      loadMessages(conv._id);
      joinWidgetAdmin(conv._id);
      setContactEdit({
        name: conv.contactId?.name || "",
        email: conv.contactId?.email || "",
        phone: conv.contactId?.phone || "",
        company: conv.contactId?.company || "",
        notes: conv.contactId?.notes || "",
      });
    },
    [loadMessages, joinWidgetAdmin]
  );

  // --- Actions ---

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConv) return;

    setSendingMsg(true);
    const content = messageInput.trim();
    setMessageInput("");

    const tempMsg: Message = {
      _id: `temp_${Date.now()}`,
      conversationId: selectedConv._id,
      direction: "outbound",
      type: "text",
      content,
      senderName: "Tú",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      const data = await api.post<Message>(
        API_ENDPOINTS.conversations.messages(selectedConv._id),
        { content, type: "text" }
      );
      const savedMessage = unwrapResponse<Message>(data);
      const st = (savedMessage?.status || "delivered").toLowerCase();
      const messageForUi: Message = {
        ...savedMessage,
        status: st === "sent" ? "delivered" : st,
      };
      setMessages((prev) =>
        prev.map((m) => (m._id === tempMsg._id ? messageForUi : m))
      );

      setConversations((prev) =>
        prev.map((c) =>
          c._id === selectedConv._id
            ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    } catch (error: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempMsg._id ? { ...m, status: "failed" } : m
        )
      );
    } finally {
      setSendingMsg(false);
    }
  };

  const retryMessage = async (failedMsg: Message) => {
    if (!selectedConv) return;

    setMessages((prev) =>
      prev.map((m) =>
        m._id === failedMsg._id ? { ...m, status: "pending" } : m
      )
    );

    try {
      const data = await api.post<Message>(
        API_ENDPOINTS.conversations.messages(selectedConv._id),
        { content: failedMsg.content, type: "text" }
      );
      const savedMessage = unwrapResponse<Message>(data);
      const st = (savedMessage?.status || "delivered").toLowerCase();
      const messageForUi: Message = {
        ...savedMessage,
        status: st === "sent" ? "delivered" : st,
      };
      setMessages((prev) =>
        prev.map((m) => (m._id === failedMsg._id ? messageForUi : m))
      );

      setConversations((prev) =>
        prev.map((c) =>
          c._id === selectedConv._id
            ? {
                ...c,
                lastMessage: failedMsg.content,
                lastMessageAt: new Date().toISOString(),
              }
            : c
        )
      );
    } catch (error: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === failedMsg._id ? { ...m, status: "failed" } : m
        )
      );
    }
  };

  const deleteConversation = async () => {
    if (!selectedConv) return;
    try {
      await api.delete(API_ENDPOINTS.conversations.delete(selectedConv._id));
      setConversations((prev) => prev.filter((c) => c._id !== selectedConv._id));
      setSelectedConv(null);
      setMessages([]);
      addToast({ title: "Conversación eliminada", color: "success" });
    } catch (error: any) {
      addToast({ title: "Error al eliminar conversación", color: "danger" });
    }
    deleteModal.onClose();
  };

  const assignConversation = async () => {
    if (!selectedConv || !selectedMember) return;
    try {
      await api.patch(API_ENDPOINTS.conversations.update(selectedConv._id), {
        assignedTo: selectedMember,
      });
      const member = teamMembers.find((m) => m._id === selectedMember);
      if (member) {
        setSelectedConv({
          ...selectedConv,
          assignedTo: member,
        });
      }
      addToast({ title: "Chat asignado exitosamente", color: "success" });
      loadConversations();
    } catch (error: any) {
      addToast({ title: "Error al asignar chat", color: "danger" });
    }
    assignModal.onClose();
    setSelectedMember("");
  };

  const saveContact = async () => {
    if (!selectedConv?.contactId?._id) return;
    setSavingContact(true);
    try {
      await api.patch(
        API_ENDPOINTS.contacts.update(selectedConv.contactId._id),
        contactEdit
      );
      const updatedContact = { ...selectedConv.contactId, ...contactEdit };
      setSelectedConv((prev) =>
        prev ? { ...prev, contactId: updatedContact } : prev
      );
      setConversations((prev) =>
        prev.map((c) =>
          c._id === selectedConv._id
            ? { ...c, contactId: { ...c.contactId, ...contactEdit } }
            : c
        )
      );
      addToast({ title: "Contacto actualizado", color: "success" });
      loadConversations();
    } catch (error: any) {
      addToast({ title: "Error al actualizar contacto", color: "danger" });
    } finally {
      setSavingContact(false);
    }
  };

  const convertToLead = async () => {
    if (!selectedConv || !convertTitle) return;
    setConverting(true);
    try {
      const contactId = selectedConv.contactId?._id;
      if (!contactId) {
        addToast({ title: "No hay contacto asociado", color: "danger" });
        return;
      }
      await api.post(API_ENDPOINTS.leads.create, {
        contactId,
        title: convertTitle,
        description: convertDescription || `Lead desde chat: ${selectedConv.contactId?.name}`,
        source: "web_chat",
        tags: ["live-chat"],
      });
      await api.patch(API_ENDPOINTS.conversations.update(selectedConv._id), {
        status: "converted",
      });
      setSelectedConv({ ...selectedConv, status: "converted" });
      loadConversations();
      addToast({ title: "Lead creado exitosamente", color: "success" });
      convertLeadModal.onClose();
      setConvertTitle("");
      setConvertDescription("");
    } catch (error: any) {
      addToast({ title: "Error al crear lead", color: "danger" });
    } finally {
      setConverting(false);
    }
  };

  const convertToDeal = async () => {
    if (!selectedConv || !convertTitle || !convertValue) return;
    setConverting(true);
    try {
      const contactId = selectedConv.contactId?._id;
      if (!contactId) {
        addToast({ title: "No hay contacto asociado", color: "danger" });
        return;
      }
      await api.post(API_ENDPOINTS.deals.create, {
        contactId,
        title: convertTitle,
        description: convertDescription || `Deal desde chat: ${selectedConv.contactId?.name}`,
        value: parseFloat(convertValue) || 0,
        tags: ["live-chat"],
      });
      await api.patch(API_ENDPOINTS.conversations.update(selectedConv._id), {
        status: "converted",
      });
      setSelectedConv({ ...selectedConv, status: "converted" });
      loadConversations();
      addToast({ title: "Deal creado exitosamente", color: "success" });
      convertDealModal.onClose();
      setConvertTitle("");
      setConvertDescription("");
      setConvertValue("");
    } catch (error: any) {
      addToast({ title: "Error al crear deal", color: "danger" });
    } finally {
      setConverting(false);
    }
  };

  // --- Effects ---

  useEffect(() => {
    loadConversations();
    loadTeamMembers();
  }, [loadConversations, loadTeamMembers]);

  useEffect(() => {
    if (isConnected && tenant?.id) {
      joinTenant(tenant.id);
    }
  }, [isConnected, tenant?.id, joinTenant]);

  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (selectedConv && data.conversationId === selectedConv._id) {
        const raw = data.message || data;
        const msg = {
          ...raw,
          status:
            raw.direction === "outbound" && raw.status?.toLowerCase() === "sent"
              ? "delivered"
              : raw.status,
        };
        setMessages((prev) => [...prev, msg]);
        setTimeout(scrollToBottom, 100);
      }

      setConversations((prev) =>
        prev.map((c) =>
          c._id === (data.conversationId || data.message?.conversationId)
            ? {
                ...c,
                lastMessage: data.message?.content || data.content,
                lastMessageAt: new Date().toISOString(),
                unreadCount:
                  selectedConv?._id === c._id ? 0 : c.unreadCount + 1,
              }
            : c
        )
      );
    };

    const handleConvUpdated = (data: any) => {
      if (data?._id) {
        setConversations((prev) =>
          prev.map((c) =>
            c._id === data._id
              ? {
                  ...c,
                  ...(data.subject ? { subject: data.subject } : {}),
                  ...(data.tags ? { tags: data.tags } : {}),
                  ...(data.status ? { status: data.status } : {}),
                }
              : c
          )
        );
        if (selectedConv && data._id === selectedConv._id) {
          setSelectedConv((prev) =>
            prev
              ? {
                  ...prev,
                  ...(data.subject ? { subject: data.subject } : {}),
                  ...(data.tags ? { tags: data.tags } : {}),
                  ...(data.status ? { status: data.status } : {}),
                }
              : prev
          );
        }
      }
      loadConversations();
    };

    const handleStatusUpdated = (data: any) => {
      if (data.status === "read" && selectedConv && data.conversationId === selectedConv._id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.direction === "outbound" &&
            m.status !== "failed" &&
            m.status !== "pending"
              ? { ...m, status: "read" }
              : m
          )
        );
      }
    };

    const handleContactEnriched = (data: any) => {
      if (selectedConv && data.conversationId === selectedConv._id && data.data) {
        setSelectedConv((prev) =>
          prev ? { ...prev, contactId: { ...prev.contactId, ...data.data } } : prev
        );
        setContactEdit((prev) => ({
          ...prev,
          ...(data.data.name ? { name: data.data.name } : {}),
          ...(data.data.email ? { email: data.data.email } : {}),
          ...(data.data.phone ? { phone: data.data.phone } : {}),
          ...(data.data.company ? { company: data.data.company } : {}),
        }));
        setConversations((prev) =>
          prev.map((c) =>
            c._id === data.conversationId
              ? { ...c, contactId: { ...c.contactId, ...data.data } }
              : c
          )
        );
        addToast({
          title: `Contacto auto-actualizado: ${data.enrichedFields?.join(", ")}`,
          color: "success",
        });
      }
    };

    const cleanupNewMsg = on("message.new", handleNewMessage);
    const cleanupAdminMsg = on("admin:message:new", handleNewMessage);
    const cleanupConvUpdated = on("conversation.updated", handleConvUpdated);
    const cleanupMsgReceived = on("message.received", handleNewMessage);
    const cleanupStatusUpdated = on("message.status.updated", handleStatusUpdated);
    const cleanupContactEnriched = on("contact.enriched", handleContactEnriched);

    return () => {
      cleanupNewMsg();
      cleanupAdminMsg();
      cleanupConvUpdated();
      cleanupMsgReceived();
      cleanupStatusUpdated();
      cleanupContactEnriched();
    };
  }, [on, selectedConv, loadConversations]);

  // --- Helpers ---

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      conv.contactId?.name?.toLowerCase().includes(q) ||
      conv.lastMessage?.toLowerCase().includes(q) ||
      conv.subject?.toLowerCase().includes(q)
    );
  });

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHrs < 24) return `${diffHrs} hr`;
    return date.toLocaleDateString("es", { day: "numeric", month: "short" });
  };

  const formatMsgTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("es", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- Render ---

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-0 -m-6">
      {/* Conversation List */}
      <div className="w-80 border-r border-divider flex flex-col bg-content1">
        <div className="p-4 border-b border-divider space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Live Chat</h2>
              {isConnected && (
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              )}
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={loadConversations}
            >
              <RefreshCw size={16} />
            </Button>
          </div>
          <Input
            placeholder="Buscar conversaciones..."
            size="sm"
            startContent={<Search className="text-default-400" size={14} />}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <div className="flex gap-1 flex-wrap">
            {[
              { key: "all", label: "Todas" },
              { key: "open", label: "Nuevas" },
              { key: "assigned", label: "Asignadas" },
              { key: "in_progress", label: "En progreso" },
              { key: "converted", label: "Convertidas" },
              { key: "closed", label: "Cerradas" },
            ].map((tab) => (
              <Chip
                key={tab.key}
                size="sm"
                variant={statusFilter === tab.key ? "solid" : "flat"}
                color={statusFilter === tab.key ? "primary" : "default"}
                className="cursor-pointer"
                onClick={() => setStatusFilter(tab.key)}
              >
                {tab.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="sm" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <MessagesSquare className="text-default-300 mb-3" size={40} />
              <p className="text-sm text-default-500">
                No hay conversaciones de chat
              </p>
              <p className="text-xs text-default-400 mt-1">
                Las conversaciones del widget aparecerán aquí
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv._id}
                className={`w-full text-left p-3 flex items-center gap-3 hover:bg-default-100 transition-colors border-b border-divider ${
                  selectedConv?._id === conv._id
                    ? "bg-primary/5 border-l-3 border-l-primary"
                    : ""
                }`}
                onClick={() => selectConversation(conv)}
              >
                <div className="relative flex-shrink-0">
                  <Avatar
                    color="primary"
                    name={conv.contactId?.name?.substring(0, 2).toUpperCase() || "V"}
                    size="sm"
                  />
                  <Globe
                    className="absolute -bottom-1 -right-1 text-primary bg-content1 rounded-full p-0.5"
                    size={14}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {conv.contactId?.name || "Visitor"}
                    </span>
                    <span className="text-xs text-default-400 flex-shrink-0">
                      {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ""}
                    </span>
                  </div>
                  {conv.subject && !conv.subject.startsWith("Chat Widget") && (
                    <div className="flex items-center gap-1 mt-0.5 min-w-0">
                      <p className="text-xs text-primary-500 font-medium truncate">
                        {conv.subject}
                      </p>
                      {conv.tags && conv.tags.length > 0 && (
                        <div className="flex gap-0.5 flex-shrink-0">
                          {conv.tags.slice(0, 2).map((tag) => (
                            <Chip key={tag} size="sm" variant="flat" color="secondary" className="text-[9px] h-4 px-1">
                              {tag}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-default-400 truncate flex-1 mr-1">
                      {conv.lastMessage || "Sin mensajes"}
                    </p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Chip
                        size="sm"
                        variant="dot"
                        color={(statusColors[conv.status] || "default") as any}
                        className="text-[10px] h-5"
                      >
                        {statusLabels[conv.status] || conv.status}
                      </Chip>
                      {conv.unreadCount > 0 && (
                        <Chip color="primary" size="sm" variant="solid">
                          {conv.unreadCount}
                        </Chip>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-content1">
        {!selectedConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessagesSquare className="text-primary" size={36} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
            <p className="text-default-500 text-sm max-w-md">
              Selecciona una conversación del panel izquierdo para responder a los visitantes de tu widget de chat en tiempo real.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-divider flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <Avatar
                  color="primary"
                  name={
                    selectedConv.contactId?.name
                      ?.substring(0, 2)
                      .toUpperCase() || "V"
                  }
                  size="sm"
                />
                <div>
                  <p className="text-sm font-semibold">
                    {selectedConv.contactId?.name || "Visitor"}
                  </p>
                  <div className="flex items-center gap-2">
                    <Chip color="primary" size="sm" variant="dot">
                      web_chat
                    </Chip>
                    <Chip
                      color={statusColors[selectedConv.status] || "default"}
                      size="sm"
                      variant="flat"
                    >
                      {statusLabels[selectedConv.status] || selectedConv.status}
                    </Chip>
                    {selectedConv.assignedTo && (
                      <Chip size="sm" variant="flat" color="secondary">
                        {selectedConv.assignedTo.firstName} {selectedConv.assignedTo.lastName}
                      </Chip>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  isIconOnly
                  size="sm"
                  variant={showContactPanel ? "flat" : "light"}
                  color={showContactPanel ? "primary" : "default"}
                  onPress={() => setShowContactPanel(!showContactPanel)}
                >
                  {showContactPanel ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                </Button>
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Acciones del chat">
                    <DropdownItem
                      key="assign"
                      startContent={<UserPlus size={14} />}
                      onPress={() => {
                        loadTeamMembers();
                        assignModal.onOpen();
                      }}
                    >
                      Asignar a miembro
                    </DropdownItem>
                    <DropdownItem
                      key="lead"
                      startContent={<Target size={14} />}
                      onPress={() => {
                        setConvertTitle(`Lead - ${selectedConv?.contactId?.name || "Visitor"}`);
                        setConvertDescription("");
                        convertLeadModal.onOpen();
                      }}
                    >
                      Convertir a Lead
                    </DropdownItem>
                    <DropdownItem
                      key="deal"
                      startContent={<TrendingUp size={14} />}
                      onPress={() => {
                        setConvertTitle(`Deal - ${selectedConv?.contactId?.name || "Visitor"}`);
                        setConvertDescription("");
                        setConvertValue("");
                        convertDealModal.onOpen();
                      }}
                    >
                      Convertir a Deal
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      className="text-danger"
                      color="danger"
                      startContent={<Trash2 size={14} />}
                      onPress={deleteModal.onOpen}
                    >
                      Eliminar chat
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="sm" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-sm text-default-400">
                    No hay mensajes aún
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg._id}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        msg.direction === "outbound"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                    >
                      <div
                        className={`flex flex-col gap-1 max-w-[70%] ${
                          msg.direction === "outbound"
                            ? "items-end"
                            : "items-start"
                        }`}
                      >
                        <div
                          className={`rounded-lg px-3 py-2 ${
                            msg.direction === "outbound"
                              ? "text-white rounded-br-sm"
                              : "bg-default-100 rounded-bl-sm"
                          }`}
                          style={
                            msg.direction === "outbound"
                              ? {
                                  backgroundColor:
                                    msg.status === "failed"
                                      ? "#ef4444"
                                      : "#0084FF",
                                  opacity: msg.status === "failed" ? 0.7 : 1,
                                }
                              : {}
                          }
                        >
                          {msg.direction === "inbound" && msg.senderName && (
                            <p className="text-xs font-semibold mb-1 text-default-600">
                              {msg.senderName}
                            </p>
                          )}
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <div className="flex items-center gap-1 px-1">
                          <span className="text-[11px]" style={{ color: "#8696a0" }}>
                            {formatMsgTime(msg.createdAt)}
                          </span>
                          {msg.direction === "outbound" && (
                            <MessageStatus status={msg.status} />
                          )}
                          {msg.status === "failed" && (
                            <button
                              className="text-[11px] text-danger hover:underline ml-1"
                              onClick={() => retryMessage(msg)}
                            >
                              Reintentar
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-divider p-4">
              <div className="flex items-center gap-2">
                <Button isIconOnly size="sm" variant="light">
                  <Paperclip size={16} />
                </Button>
                <Input
                  placeholder="Escribe un mensaje..."
                  size="sm"
                  value={messageInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  onValueChange={setMessageInput}
                />
                <Button
                  color="primary"
                  isDisabled={!messageInput.trim()}
                  isIconOnly
                  isLoading={sendingMsg}
                  size="sm"
                  onPress={sendMessage}
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Contact Panel */}
      {showContactPanel && selectedConv && (
        <div className="w-80 border-l border-divider flex flex-col bg-content1 overflow-y-auto">
          <div className="p-4 border-b border-divider">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">Información del Contacto</h3>
              <Chip
                size="sm"
                variant="flat"
                color={(statusColors[selectedConv.status] || "default") as any}
              >
                {statusLabels[selectedConv.status] || selectedConv.status}
              </Chip>
            </div>
            <div className="flex flex-col items-center mb-4">
              <Avatar
                color="primary"
                name={contactEdit.name?.substring(0, 2).toUpperCase() || "V"}
                size="lg"
                className="mb-2"
              />
              <p className="text-sm font-semibold">{contactEdit.name || "Visitor"}</p>
              {selectedConv.contactId?.source && (
                <Chip size="sm" variant="flat" className="mt-1">
                  <div className="flex items-center gap-1">
                    <Globe size={10} />
                    {selectedConv.contactId.source}
                  </div>
                </Chip>
              )}
            </div>
          </div>

          <div className="p-4 space-y-3 flex-1">
            <div>
              <label className="text-xs text-default-500 flex items-center gap-1 mb-1">
                <Tag size={12} /> Asunto / Motivo
              </label>
              <div className="flex gap-1">
                <Input
                  size="sm"
                  placeholder="¿Qué necesita el cliente?"
                  value={selectedConv.subject?.startsWith("Chat Widget") ? "" : (selectedConv.subject || "")}
                  onValueChange={(v) => {
                    setSelectedConv((prev) => prev ? { ...prev, subject: v } : prev);
                  }}
                  onBlur={async () => {
                    const subj = selectedConv.subject || "";
                    if (subj && !subj.startsWith("Chat Widget")) {
                      try {
                        await api.patch(
                          API_ENDPOINTS.conversations.update(selectedConv._id),
                          { subject: subj }
                        );
                        setConversations((prev) =>
                          prev.map((c) =>
                            c._id === selectedConv._id ? { ...c, subject: subj } : c
                          )
                        );
                      } catch {}
                    }
                  }}
                />
              </div>
              {selectedConv.tags && selectedConv.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-1">
                  {selectedConv.tags.map((tag: string) => (
                    <Chip key={tag} size="sm" variant="flat" color="secondary" className="text-[10px]">
                      {tag}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-divider pt-3">
              <label className="text-xs text-default-500 flex items-center gap-1 mb-1">
                <User size={12} /> Nombre
              </label>
              <Input
                size="sm"
                value={contactEdit.name}
                onValueChange={(v) => setContactEdit({ ...contactEdit, name: v })}
              />
            </div>
            <div>
              <label className="text-xs text-default-500 flex items-center gap-1 mb-1">
                <Mail size={12} /> Email
              </label>
              <Input
                size="sm"
                type="email"
                value={contactEdit.email}
                onValueChange={(v) => setContactEdit({ ...contactEdit, email: v })}
              />
            </div>
            <div>
              <label className="text-xs text-default-500 flex items-center gap-1 mb-1">
                <Phone size={12} /> Teléfono
              </label>
              <Input
                size="sm"
                value={contactEdit.phone}
                onValueChange={(v) => setContactEdit({ ...contactEdit, phone: v })}
              />
            </div>
            <div>
              <label className="text-xs text-default-500 flex items-center gap-1 mb-1">
                <Building2 size={12} /> Empresa
              </label>
              <Input
                size="sm"
                value={contactEdit.company}
                onValueChange={(v) => setContactEdit({ ...contactEdit, company: v })}
              />
            </div>
            <div>
              <label className="text-xs text-default-500 flex items-center gap-1 mb-1">
                <StickyNote size={12} /> Notas
              </label>
              <Textarea
                size="sm"
                minRows={3}
                value={contactEdit.notes}
                onValueChange={(v) => setContactEdit({ ...contactEdit, notes: v })}
              />
            </div>
            <Button
              color="primary"
              size="sm"
              className="w-full"
              startContent={<Save size={14} />}
              isLoading={savingContact}
              onPress={saveContact}
            >
              Guardar contacto
            </Button>
          </div>

          {selectedConv.assignedTo && (
            <div className="p-4 border-t border-divider">
              <p className="text-xs text-default-500 mb-1">Asignado a</p>
              <div className="flex items-center gap-2">
                <Avatar
                  name={`${selectedConv.assignedTo.firstName?.[0]}${selectedConv.assignedTo.lastName?.[0]}`}
                  size="sm"
                />
                <div>
                  <p className="text-xs font-medium">
                    {selectedConv.assignedTo.firstName} {selectedConv.assignedTo.lastName}
                  </p>
                  <p className="text-[10px] text-default-400">
                    {selectedConv.assignedTo.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 border-t border-divider space-y-2">
            <p className="text-xs text-default-500 font-semibold mb-2">Acciones rápidas</p>
            <Button
              size="sm"
              variant="flat"
              className="w-full justify-start"
              startContent={<UserPlus size={14} />}
              onPress={() => {
                loadTeamMembers();
                assignModal.onOpen();
              }}
            >
              Asignar a miembro
            </Button>
            <Button
              size="sm"
              variant="flat"
              color="success"
              className="w-full justify-start"
              startContent={<Target size={14} />}
              onPress={() => {
                setConvertTitle(`Lead - ${selectedConv?.contactId?.name || "Visitor"}`);
                setConvertDescription("");
                convertLeadModal.onOpen();
              }}
            >
              Convertir a Lead
            </Button>
            <Button
              size="sm"
              variant="flat"
              color="secondary"
              className="w-full justify-start"
              startContent={<TrendingUp size={14} />}
              onPress={() => {
                setConvertTitle(`Deal - ${selectedConv?.contactId?.name || "Visitor"}`);
                setConvertDescription("");
                setConvertValue("");
                convertDealModal.onOpen();
              }}
            >
              Convertir a Deal
            </Button>
          </div>
        </div>
      )}

      {/* Modal: Asignar a miembro */}
      <Modal isOpen={assignModal.isOpen} onClose={assignModal.onClose}>
        <ModalContent>
          <ModalHeader>Asignar conversación</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500 mb-3">
              Selecciona un miembro del equipo para asignar esta conversación.
            </p>
            <Select
              label="Miembro del equipo"
              placeholder="Selecciona un miembro"
              selectedKeys={selectedMember ? [selectedMember] : []}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as string;
                setSelectedMember(val || "");
              }}
            >
              {teamMembers.map((m) => (
                <SelectItem key={m._id}>
                  {m.firstName} {m.lastName} ({m.email})
                </SelectItem>
              ))}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={assignModal.onClose}>
              Cancelar
            </Button>
            <Button
              color="primary"
              isDisabled={!selectedMember}
              onPress={assignConversation}
            >
              Asignar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: Convertir a Lead */}
      <Modal isOpen={convertLeadModal.isOpen} onClose={convertLeadModal.onClose}>
        <ModalContent>
          <ModalHeader>Convertir a Lead</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500 mb-3">
              Se creará un lead asociado al contacto <strong>{selectedConv?.contactId?.name}</strong>.
            </p>
            <div className="space-y-3">
              <Input
                isRequired
                label="Título del Lead"
                value={convertTitle}
                onValueChange={setConvertTitle}
              />
              <Textarea
                label="Descripción"
                value={convertDescription}
                onValueChange={setConvertDescription}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={convertLeadModal.onClose}>
              Cancelar
            </Button>
            <Button
              color="primary"
              isDisabled={!convertTitle}
              isLoading={converting}
              onPress={convertToLead}
            >
              Crear Lead
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: Convertir a Deal */}
      <Modal isOpen={convertDealModal.isOpen} onClose={convertDealModal.onClose}>
        <ModalContent>
          <ModalHeader>Convertir a Deal</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500 mb-3">
              Se creará un deal asociado al contacto <strong>{selectedConv?.contactId?.name}</strong>.
            </p>
            <div className="space-y-3">
              <Input
                isRequired
                label="Título del Deal"
                value={convertTitle}
                onValueChange={setConvertTitle}
              />
              <Input
                isRequired
                label="Valor ($)"
                type="number"
                value={convertValue}
                onValueChange={setConvertValue}
              />
              <Textarea
                label="Descripción"
                value={convertDescription}
                onValueChange={setConvertDescription}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={convertDealModal.onClose}>
              Cancelar
            </Button>
            <Button
              color="primary"
              isDisabled={!convertTitle || !convertValue}
              isLoading={converting}
              onPress={convertToDeal}
            >
              Crear Deal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: Eliminar chat */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Eliminar conversación</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500">
              ¿Estás seguro de que deseas eliminar esta conversación con{" "}
              <strong>{selectedConv?.contactId?.name}</strong>? Se eliminarán
              todos los mensajes. Esta acción no se puede deshacer.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={deleteModal.onClose}>
              Cancelar
            </Button>
            <Button color="danger" onPress={deleteConversation}>
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
