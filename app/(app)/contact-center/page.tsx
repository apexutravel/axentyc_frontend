"use client";

import { useState, useEffect, useRef, useCallback, useMemo, Fragment } from "react";
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
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { addToast } from "@heroui/toast";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import EmojiPicker from "emoji-picker-react";
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
  Image as ImageIcon,
  MessageCircle,
  Facebook,
  Instagram,
  ThumbsUp,
  Smile,
  Camera,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { API_ENDPOINTS, API_URL } from "@/config/api";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationCenter } from "@/contexts/NotificationCenterContext";

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
    pageName?: string;  // Facebook/Instagram page name
    pageId?: string;
    accountId?: string;
  };
  createdAt: string;
}

interface Message {
  _id: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  type: string;
  content: string;
  media?: {
    url: string;
    mimeType?: string;
    fileName?: string;
    fileSize?: number;
  };
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

interface Comment {
  id: string;
  from: { id: string; name: string; picture?: { data?: { url?: string } } };
  message: string;
  created_time: string;
  parent?: { id: string };
  like_count?: number;
  user_likes?: boolean;
}

interface Post {
  id: string;
  message?: string;
  story?: string;
  status_type?: string;
  full_picture?: string;
  created_time: string;
  from?: { id: string; name: string; picture?: { data?: { url?: string } } };
  admin_creator?: { id: string; name: string; picture?: { data?: { url?: string } } };
  reactions?: { summary?: { total_count?: number } };
  likes?: { summary?: { total_count?: number } };
  comments?: { data: Comment[] };
}

interface FacebookPage {
  pageId: string;
  accountName: string;
  avatarUrl?: string;
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

function getTabTheme(tab: string) {
  const key = (tab || "all").toLowerCase();
  if (key === "instagram" || key === "ig-comments") {
    return {
      shell: "from-pink-50/70 via-purple-50/50 to-orange-50/40 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-orange-950/10",
      panel: "border-pink-200/60 dark:border-pink-800/40 bg-gradient-to-b from-pink-50/80 via-content1 to-purple-50/50 dark:from-pink-950/15 dark:via-content1 dark:to-purple-950/10",
      header: "bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-orange-400/10 border-pink-200/60 dark:border-pink-800/40",
      selected: "bg-gradient-to-r from-pink-500/15 via-purple-500/10 to-orange-400/10 border-l-pink-500 shadow-sm",
      hover: "hover:bg-pink-50/80 dark:hover:bg-pink-950/20 border-l-transparent",
      cursor: "rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400",
      badge: "secondary" as const,
      icon: "text-pink-500",
    };
  }
  if (key === "whatsapp") {
    return {
      shell: "from-green-50/70 via-emerald-50/50 to-teal-50/40 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/10",
      panel: "border-green-200/60 dark:border-green-800/40 bg-gradient-to-b from-green-50/80 via-content1 to-emerald-50/50 dark:from-green-950/15 dark:via-content1 dark:to-emerald-950/10",
      header: "bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-400/10 border-green-200/60 dark:border-green-800/40",
      selected: "bg-gradient-to-r from-green-500/15 via-emerald-500/10 to-teal-400/10 border-l-green-500 shadow-sm",
      hover: "hover:bg-green-50/80 dark:hover:bg-green-950/20 border-l-transparent",
      cursor: "rounded-lg bg-gradient-to-r from-green-500 via-emerald-500 to-teal-400",
      badge: "success" as const,
      icon: "text-green-500",
    };
  }
  if (key === "messenger" || key === "fb-comments") {
    return {
      shell: "from-blue-50/70 via-sky-50/50 to-indigo-50/40 dark:from-blue-950/20 dark:via-sky-950/20 dark:to-indigo-950/10",
      panel: "border-blue-200/60 dark:border-blue-800/40 bg-gradient-to-b from-blue-50/80 via-content1 to-sky-50/50 dark:from-blue-950/15 dark:via-content1 dark:to-sky-950/10",
      header: "bg-gradient-to-r from-blue-600/10 via-sky-500/10 to-indigo-500/10 border-blue-200/60 dark:border-blue-800/40",
      selected: "bg-gradient-to-r from-blue-600/15 via-sky-500/10 to-indigo-500/10 border-l-blue-600 shadow-sm",
      hover: "hover:bg-blue-50/80 dark:hover:bg-blue-950/20 border-l-transparent",
      cursor: "rounded-lg bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-500",
      badge: "primary" as const,
      icon: "text-blue-600",
    };
  }
  return {
    shell: "from-content1 via-default-50/60 to-primary/5 dark:from-content1 dark:via-default-100/10 dark:to-primary/10",
    panel: "border-divider/70 bg-content1/95",
    header: "bg-content1/90 border-divider/70",
    selected: "bg-primary/10 border-l-primary shadow-sm",
    hover: "hover:bg-default-100/80 border-l-transparent",
    cursor: "rounded-lg bg-primary",
    badge: "primary" as const,
    icon: "text-primary",
  };
}

function ChannelIcon({ channel }: { channel: string }) {
  const channelLower = (channel || "web_chat").toLowerCase();
  
  if (channelLower === "whatsapp") {
    return (
      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center" title="WhatsApp">
        <MessageCircle size={12} className="text-white" />
      </div>
    );
  }
  
  if (channelLower === "instagram") {
    return (
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center" title="Instagram">
        <Instagram size={12} className="text-white" />
      </div>
    );
  }
  
  if (channelLower === "facebook" || channelLower === "messenger") {
    return (
      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center" title="Facebook">
        <Facebook size={12} className="text-white" />
      </div>
    );
  }
  
  // Default: web_chat (widget)
  return (
    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center" title="Widget">
      <Globe size={12} className="text-white" />
    </div>
  );
}

export default function ContactCenterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { tenant } = useAuth();
  const { markConversationRead, setActiveConversationId } = useNotificationCenter();
  const [activeTab, setActiveTab] = useState("all");
  const tabTheme = getTabTheme(activeTab);
  
  // Facebook Comments states
  const [fbPages, setFbPages] = useState<FacebookPage[]>([]);
  const [selectedFbPage, setSelectedFbPage] = useState('');
  const [fbPosts, setFbPosts] = useState<Post[]>([]);
  const [selectedFbPost, setSelectedFbPost] = useState<Post | null>(null);
  const [loadingFbPosts, setLoadingFbPosts] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState<string | null>(null);
  const [commentReplyText, setCommentReplyText] = useState('');
  const [postCommentText, setPostCommentText] = useState('');
  const [postReaction, setPostReaction] = useState<{ label: string; emoji: string } | null>(null);
  const [commentReactions, setCommentReactions] = useState<Record<string, { label: string; emoji: string }>>({});
  const [sendingComment, setSendingComment] = useState(false);
  const [dmModalOpen, setDmModalOpen] = useState(false);
  const [dmRecipient, setDmRecipient] = useState<{ id: string; name: string } | null>(null);
  const [dmText, setDmText] = useState('');
  const [sendingDm, setSendingDm] = useState(false);
  const [fbReactionsEnabled, setFbReactionsEnabled] = useState(true);
  const [visibleComments, setVisibleComments] = useState(5);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [firstUnreadIndex, setFirstUnreadIndex] = useState<number>(-1);
  const [messageInput, setMessageInput] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [igSyncing, setIgSyncing] = useState(false);
  const [imagePreview, setImagePreview] = useState<{file: File; url: string; caption: string} | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousTabRef = useRef(activeTab);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visitorTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adminTypingStateRef = useRef(false);
  const { subscribe, emit, joinWidgetAdmin, leaveWidgetAdmin, setTenantId, isConnected } = useSocket();
  const [visitorTyping, setVisitorTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetchFbPostsRef = useRef<(() => void) | null>(null);

  // Track theme to adapt subtle patterned background (WhatsApp-like)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const messagesBackground = useMemo(() => {
    // Neutral line-icons pattern (light/dark aware) — replaces wave pattern
    const stroke = isDark ? "%234b5563" : "%23cbd5e1"; // encoded hex
    const svg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='360' height='360' viewBox='0 0 360 360'><defs><pattern id='p' x='0' y='0' width='60' height='60' patternUnits='userSpaceOnUse'><g stroke='${stroke}' stroke-width='1.2' fill='none' opacity='0.45'><rect x='6' y='6' width='16' height='12' rx='2'/><path d='M8 14l4-4 4 4 6-6'/><circle cx='42' cy='12' r='6'/><path d='M38 12h8M42 8v8'/><path d='M8 40l14-6-4 14-3-5-7-3z'/><rect x='36' y='36' width='12' height='10' rx='2'/></g></pattern></defs><rect width='360' height='360' fill='url(%23p)'/></svg>")`;
    return { backgroundImage: svg, backgroundRepeat: "repeat", backgroundSize: "360px 360px" } as React.CSSProperties;
  }, [isDark]);

  const [showContactPanel, setShowContactPanel] = useState(false);
  const [contactEdit, setContactEdit] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });
  const [savingContact, setSavingContact] = useState(false);
  const conversationIdFromQuery = searchParams.get("conversationId");

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

  const emitAdminTyping = useCallback(
    (isTyping: boolean) => {
      if (!selectedConv?.metadata?.widgetId || !selectedConv?.metadata?.visitorId) {
        return;
      }
      if (adminTypingStateRef.current === isTyping) return;
      adminTypingStateRef.current = isTyping;
      emit("admin:typing", {
        conversationId: selectedConv._id,
        widgetId: selectedConv.metadata.widgetId,
        visitorId: selectedConv.metadata.visitorId,
        isTyping,
      });
    },
    [emit, selectedConv]
  );

  // --- Data Loading ---

  const loadConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      // Load web_chat, facebook, and instagram conversations
      params.set("channels", "web_chat,facebook,instagram");
      if (statusFilter !== "all") params.set("status", statusFilter);

      const data = await api.get<Conversation[]>(
        `${API_ENDPOINTS.conversations.list}?${params.toString()}`
      );
      const conversationsData = unwrapResponse<Conversation[]>(data);
      
      // Preserve unreadCount: 0 for conversations that were marked as read locally
      // BUT allow updates if server has new unread messages
      setConversations((prev) => {
        const newConversations = Array.isArray(conversationsData) ? conversationsData : [];
        return newConversations.map((newConv) => {
          const existingConv = prev.find((c) => c._id === newConv._id);
          // Only preserve 0 if:
          // 1. Local was 0 (marked as read)
          // 2. Server also has 0 (no new messages)
          // If server has > 0, it means new messages arrived, so use server value
          if (existingConv && existingConv.unreadCount === 0 && newConv.unreadCount === 0) {
            return { ...newConv, unreadCount: 0 };
          }
          return newConv;
        });
      });
    } catch (error: any) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoadingConvs(false);
    }
  }, [statusFilter]);

  const syncInstagramMessages = async () => {
    setIgSyncing(true);
    try {
      await api.post(API_ENDPOINTS.integrations.instagram.syncMessages, {});
      await loadConversations();
      addToast({
        title: "Instagram sincronizado",
        description: "Mensajes de Instagram actualizados",
        color: "success",
      });
    } catch (error: any) {
      addToast({
        title: "Error al sincronizar Instagram",
        description: error?.message || "Error desconocido",
        color: "danger",
      });
    } finally {
      setIgSyncing(false);
    }
  };

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
      
      const reversed = normalized.slice().reverse();
      
      // Find first unread message (inbound message with status != 'read')
      const firstUnread = reversed.findIndex(
        (m) => m.direction === "inbound" && m.status?.toLowerCase() !== "read"
      );
      setFirstUnreadIndex(firstUnread);
      
      setMessages(reversed);
      setTimeout(scrollToBottom, 100);

      // Don't mark as read immediately - let the visibility/scroll handler do it
      // This ensures messages are only marked as READ when user actually sees them
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
      // Leave previous conversation room before switching
      if (selectedConv?._id && selectedConv._id !== conv._id) {
        leaveWidgetAdmin(selectedConv._id);
      }

      setSelectedConv(conv);
      loadMessages(conv._id);
      joinWidgetAdmin(conv._id);
      setActiveConversationId(conv._id);
      markConversationRead(conv._id);
      setContactEdit({
        name: conv.contactId?.name || "",
        email: conv.contactId?.email || "",
        phone: conv.contactId?.phone || "",
        company: conv.contactId?.company || "",
        notes: conv.contactId?.notes || "",
      });
    },
    [selectedConv?._id, leaveWidgetAdmin, loadMessages, joinWidgetAdmin, markConversationRead, setActiveConversationId]
  );

  // --- Actions ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConv) return;

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setImagePreview({ file, url, caption: "" });
    } else {
      // For non-images, send directly
      setUploadingFile(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await api.post(API_ENDPOINTS.upload, formData);
        const rawUrl = uploadRes.data?.url || uploadRes.url;
        const base = API_URL.replace(/\/api\/v1\/?$/, "");
        const fileUrl = rawUrl?.startsWith("http") ? rawUrl : `${base}${rawUrl}`;

        if (!fileUrl) throw new Error("No URL returned from upload");

        const messageData = {
          content: `📎 ${file.name}`,
          type: "file",
          media: {
            url: fileUrl,
            mimeType: file.type,
            fileName: file.name,
            fileSize: file.size,
          },
        };

        await api.post(API_ENDPOINTS.conversations.messages(selectedConv._id), messageData);
        addToast({ title: "Archivo enviado", color: "success" });
        loadMessages(selectedConv._id);
      } catch (error: any) {
        console.error("Error uploading file:", error);
        addToast({ title: "Error al subir archivo", color: "danger" });
      } finally {
        setUploadingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const sendImageWithCaption = async () => {
    if (!imagePreview || !selectedConv) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", imagePreview.file);

      const uploadRes = await api.post(API_ENDPOINTS.upload, formData);
      const rawUrl = uploadRes.data?.url || uploadRes.url;
      const base = API_URL.replace(/\/api\/v1\/?$/, "");
      const fileUrl = rawUrl?.startsWith("http") ? rawUrl : `${base}${rawUrl}`;

      if (!fileUrl) throw new Error("No URL returned from upload");

      const messageData = {
        content: imagePreview.caption || "📷 Imagen",
        type: "image",
        media: {
          url: fileUrl,
          mimeType: imagePreview.file.type,
          fileName: imagePreview.file.name,
          fileSize: imagePreview.file.size,
        },
      };

      await api.post(API_ENDPOINTS.conversations.messages(selectedConv._id), messageData);
      addToast({ title: "Imagen enviada", color: "success" });
      loadMessages(selectedConv._id);
      
      URL.revokeObjectURL(imagePreview.url);
      setImagePreview(null);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      addToast({ title: "Error al subir imagen", color: "danger" });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const cancelImagePreview = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview.url);
      setImagePreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConv) return;

    setSendingMsg(true);
    const content = messageInput.trim();
    setMessageInput("");
    emitAdminTyping(false);

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
    if (tenant?.id) {
      setTenantId(tenant.id);
    }
  }, [tenant?.id, setTenantId]);

  // Join on selection and leave on unmount/change
  useEffect(() => {
    if (!selectedConv?._id) return;
    joinWidgetAdmin(selectedConv._id);
    return () => {
      leaveWidgetAdmin(selectedConv._id);
    };
  }, [selectedConv?._id, joinWidgetAdmin, leaveWidgetAdmin]);

  // Re-join on reconnect safety net
  useEffect(() => {
    if (isConnected && selectedConv?._id) {
      joinWidgetAdmin(selectedConv._id);
    }
  }, [isConnected, selectedConv?._id, joinWidgetAdmin]);


  // Handle tab visibility changes: leave when hidden, rejoin when visible
  useEffect(() => {
    const handler = () => {
      if (!selectedConv?._id) return;
      if (document.visibilityState === 'hidden') {
        leaveWidgetAdmin(selectedConv._id);
      } else if (document.visibilityState === 'visible') {
        joinWidgetAdmin(selectedConv._id);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [selectedConv?._id, joinWidgetAdmin, leaveWidgetAdmin]);

  // Keep NotificationCenter informed of the active conversation to suppress sounds/pushes while chatting
  useEffect(() => {
    setActiveConversationId(selectedConv?._id || null);
    return () => setActiveConversationId(null);
  }, [selectedConv?._id, setActiveConversationId]);

  useEffect(() => {
    if (!conversationIdFromQuery || conversations.length === 0) return;
    if (selectedConv?._id === conversationIdFromQuery) return;
    const targetConversation = conversations.find((conv) => conv._id === conversationIdFromQuery);
    if (targetConversation) {
      selectConversation(targetConversation);
    }
  }, [conversationIdFromQuery, conversations, selectedConv?._id, selectConversation]);

  // Mark messages as read when conversation is actively being viewed
  useEffect(() => {
    if (!selectedConv?._id || messages.length === 0) return;
    if (typeof document === 'undefined' || document.visibilityState !== 'visible') return;
    
    // Only mark as read if there are unread messages
    const hasUnreadMessages = messages.some(
      (m) => m.direction === "inbound" && m.status?.toLowerCase() !== "read"
    );
    
    if (!hasUnreadMessages) return;
    
    // Mark as read after a short delay (user has time to see the messages)
    const timer = setTimeout(async () => {
      try {
        await api.post(API_ENDPOINTS.conversations.markRead(selectedConv._id));
        
        // Update local state
        setConversations((prev) =>
          prev.map((c) =>
            c._id === selectedConv._id ? { ...c, unreadCount: 0 } : c
          )
        );
        
        // Update messages status locally
        setMessages((prev) =>
          prev.map((m) =>
            m.direction === "inbound" ? { ...m, status: "read" } : m
          )
        );
        
        // Clear unread indicator
        setFirstUnreadIndex(-1);
      } catch (error) {
        console.error('[LiveChat] Error marking as read:', error);
      }
    }, 1500); // 1.5 second delay to ensure user sees the messages
    
    return () => clearTimeout(timer);
  }, [selectedConv?._id, messages.length]);

  useEffect(() => {
    const handleNewMessage = (data: any) => {
      const raw = data?.message || data;
      if (raw?.metadata?.isComment) {
        if (activeTab === 'fb-comments' && raw?.metadata?.platform === 'facebook' && selectedFbPage) {
          fetchFbPostsRef.current?.();
        }
        return;
      }

      const incomingConversationId = data?.conversationId || raw?.conversationId || raw?.conversation;
      const isActiveConversation = Boolean(
        selectedConv?._id &&
          (String(incomingConversationId || "") === String(selectedConv._id) || !incomingConversationId)
      );

      if (isActiveConversation) {
        const msg = {
          ...raw,
          conversationId: raw?.conversationId || selectedConv?._id,
          createdAt: raw?.createdAt || raw?.created_time || raw?.timestamp || new Date().toISOString(),
          status:
            raw.direction === "outbound" && raw.status?.toLowerCase() === "sent"
              ? "delivered"
              : raw.status,
        };
        setMessages((prev) => {
          const id = String((msg as any)?._id || "");
          if (id && prev.some((m) => String((m as any)?._id || "") === id)) return prev;
          return [...prev, msg];
        });
        setVisitorTyping(false);
        setTimeout(scrollToBottom, 100);
      }

      if (incomingConversationId) {
        let conversationExists = false;
        setConversations((prev) =>
          prev.map((c) => {
            if (String(c._id) !== String(incomingConversationId)) return c;
            conversationExists = true;
            return {
              ...c,
              lastMessage: raw?.content || c.lastMessage,
              lastMessageAt: new Date().toISOString(),
              unreadCount: isActiveConversation ? 0 : (c.unreadCount || 0) + 1,
            };
          })
        );

        if (!conversationExists) {
          loadConversations();
        }
      }
    };

    const handleConvUpdated = (data: any) => {
      console.log("[LiveChat] conversation.updated:", data);
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
      console.log("[LiveChat] message.status.updated:", data);
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
      console.log("[LiveChat] contact.enriched:", data);
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

    const handleConversationCreated = (data: any) => {
      console.log("[LiveChat] conversation.created:", data);
      
      // Optimistically add to conversations list
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === data._id);
        if (exists) return prev;
        return [data, ...prev];
      });
      
      // Also reload to ensure we have full data
      loadConversations();
      
      addToast({ 
        title: `Nueva conversación: ${data.contactId?.name || 'Visitante'}`, 
        color: "primary" 
      });
    };

    const handleVisitorTyping = (data: any) => {
      if (!selectedConv?._id || data?.conversationId !== selectedConv._id) return;
      if (data?.sender !== "visitor") return;

      const isTypingNow = Boolean(data?.isTyping);
      setVisitorTyping(isTypingNow);

      if (visitorTypingTimeoutRef.current) {
        clearTimeout(visitorTypingTimeoutRef.current);
      }
      if (isTypingNow) {
        visitorTypingTimeoutRef.current = setTimeout(() => {
          setVisitorTyping(false);
        }, 2000);
      }
    };

    // ─── Facebook Comments Real-Time ───
    const handleFbCommentNew = (data: any) => {
      if (data?.pageId && data.pageId !== selectedFbPage) return;
      const newComment = data?.comment as Comment;
      if (!newComment || !data?.postId) return;

      setFbPosts((prev) => {
        const postIdx = prev.findIndex(p => p.id === data.postId);
        if (postIdx === -1) return prev;
        const updated = [...prev];
        const post = { ...updated[postIdx] };
        const existingComments = post.comments?.data || [];
        // Avoid duplicates by id
        if (existingComments.some(c => c.id === newComment.id)) return prev;
        // Remove temp comments with same message (optimistic update replacement)
        const filtered = existingComments.filter(c => 
          !(c.id.startsWith('temp-') && c.message === newComment.message && c.from?.id === newComment.from?.id)
        );
        post.comments = { data: [...filtered, newComment] };
        updated[postIdx] = post;
        if (selectedFbPost?.id === data.postId) {
          setSelectedFbPost(post);
        }
        return updated;
      });
    };

    const handleFbCommentReply = (data: any) => {
      if (data?.pageId && data.pageId !== selectedFbPage) return;
      const newReply = data?.reply as Comment;
      if (!newReply || !data?.postId || !data?.parentCommentId) return;

      setFbPosts((prev) => {
        const postIdx = prev.findIndex(p => p.id === data.postId);
        if (postIdx === -1) return prev;
        const updated = [...prev];
        const post = { ...updated[postIdx] };
        const existingComments = post.comments?.data || [];
        // Avoid duplicates by id
        if (existingComments.some(c => c.id === newReply.id)) return prev;
        // Remove temp comments with same message (optimistic update replacement)
        const filtered = existingComments.filter(c => 
          !(c.id.startsWith('temp-') && c.message === newReply.message && c.from?.id === newReply.from?.id)
        );
        post.comments = { data: [...filtered, newReply] };
        updated[postIdx] = post;
        if (selectedFbPost?.id === data.postId) {
          setSelectedFbPost(post);
        }
        return updated;
      });
    };

    const cleanupNewMsg = subscribe("message.new", handleNewMessage);
    const cleanupAdminMsg = subscribe("admin:message:new", handleNewMessage);
    // Also listen to tenant-wide inbound messages to update list badges even if not joined to specific rooms
    const cleanupTenantMsg = subscribe("message.received", handleNewMessage);
    const cleanupConvUpdated = subscribe("conversation.updated", handleConvUpdated);
    const cleanupStatusUpdated = subscribe("message.status.updated", handleStatusUpdated);
    const cleanupContactEnriched = subscribe("contact.enriched", handleContactEnriched);
    const cleanupConvCreated = subscribe("conversation.created", handleConversationCreated);
    const cleanupVisitorTyping = subscribe("admin:typing", handleVisitorTyping);
    const cleanupVisitorTypingAlt = subscribe("widget:typing", handleVisitorTyping);
    const cleanupFbCommentNew = subscribe("fb.comment.new", handleFbCommentNew);
    const cleanupFbCommentReply = subscribe("fb.comment.reply", handleFbCommentReply);

    return () => {
      cleanupNewMsg();
      cleanupAdminMsg();
      cleanupTenantMsg();
      cleanupConvUpdated();
      cleanupStatusUpdated();
      cleanupContactEnriched();
      cleanupConvCreated();
      cleanupVisitorTyping();
      cleanupVisitorTypingAlt();
      cleanupFbCommentNew();
      cleanupFbCommentReply();
    };
  }, [subscribe, selectedConv, loadConversations, activeTab, selectedFbPage, selectedFbPost]);

  useEffect(() => {
    setVisitorTyping(false);
    adminTypingStateRef.current = false;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (visitorTypingTimeoutRef.current) {
      clearTimeout(visitorTypingTimeoutRef.current);
      visitorTypingTimeoutRef.current = null;
    }
  }, [selectedConv?._id]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (visitorTypingTimeoutRef.current) clearTimeout(visitorTypingTimeoutRef.current);
    };
  }, []);

  // --- Helpers ---

  const filteredConversations = conversations.filter((conv) => {
    // IMPORTANT: Exclude comment conversations - they belong in the Comments tab, not here
    if ((conv.metadata as any)?.isComment) return false;
    
    // Filter by channel based on active tab (robust matching using regex)
    const channel = (conv.channel || '').toLowerCase();
    const isMessenger = /(messenger|fb|facebook)/.test(channel);
    const isInstagram = /(instagram|ig)/.test(channel);
    const isWhatsApp = /(whatsapp|wa)/.test(channel);

    if (activeTab === 'messenger' && !isMessenger) return false;
    if (activeTab === 'instagram' && !isInstagram) return false;
    if (activeTab === 'whatsapp' && !isWhatsApp) return false;
    // 'all' tab shows everything, no channel filter

    // Filter by status
    if (statusFilter !== "all" && conv.status !== statusFilter) return false;

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        conv.contactId?.name?.toLowerCase().includes(q) ||
        conv.lastMessage?.toLowerCase().includes(q) ||
        conv.subject?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  // Aggregate unread counts for tab badges
  const unreadCounts = useMemo(() => {
    const counts = { all: 0, messenger: 0, instagram: 0, whatsapp: 0 };
    for (const c of conversations) {
      const uc = c?.unreadCount || 0;
      if (!uc) continue;
      const ch = (c.channel || '').toLowerCase();
      const isM = /(messenger|fb|facebook)/.test(ch);
      const isIG = /(instagram|ig)/.test(ch);
      const isWA = /(whatsapp|wa)/.test(ch);
      counts.all += uc;
      if (isM) counts.messenger += uc;
      if (isIG) counts.instagram += uc;
      if (isWA) counts.whatsapp += uc;
    }
    return counts;
  }, [conversations]);

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

  // Handle tab from URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (previousTabRef.current === activeTab) return;
    if (selectedConv?._id) {
      leaveWidgetAdmin(selectedConv._id);
    }
    setSelectedConv(null);
    setMessages([]);
    setFirstUnreadIndex(-1);
    setMessageInput("");
    setVisitorTyping(false);
    setShowContactPanel(false);
    setActiveConversationId(null);
    previousTabRef.current = activeTab;
  }, [activeTab, selectedConv?._id, leaveWidgetAdmin, setActiveConversationId]);

  const handleTabChange = (key: string) => {
    if (selectedConv?._id) {
      leaveWidgetAdmin(selectedConv._id);
    }
    setSelectedConv(null);
    setMessages([]);
    setFirstUnreadIndex(-1);
    setMessageInput("");
    setVisitorTyping(false);
    setShowContactPanel(false);
    setActiveConversationId(null);
    setActiveTab(key);
    router.push(`/contact-center?tab=${key}`);
  };

  // Facebook Comments functions
  const fetchFbPages = useCallback(async () => {
    try {
      const data = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/integrations/facebook/status`);
      const rawPages = data.data?.accounts?.filter((a: any) => a.platform === 'facebook' && a.status === 'connected') || [];
      const pages: FacebookPage[] = rawPages.map((p: any) => ({
        pageId: p.pageId,
        accountName: p.accountName,
        avatarUrl: p.metadata?.profilePicture || `https://graph.facebook.com/${p.pageId}/picture?type=normal`,
      }));
      setFbPages(pages);
      if (pages.length > 0 && !selectedFbPage) setSelectedFbPage(pages[0].pageId);
    } catch (error) {
      console.error('Error loading FB pages:', error);
      toast.error('Error al cargar páginas de Facebook');
    }
  }, [selectedFbPage]);

  const fetchFbPosts = useCallback(async () => {
    if (!selectedFbPage) return;
    setLoadingFbPosts(true);
    try {
      const data = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/integrations/facebook/feed?pageId=${selectedFbPage}&limit=20`);
      const posts = data.data?.posts || [];
      setFbPosts(posts);
      if (posts.length > 0) {
        setSelectedFbPost((current) => posts.find((post: Post) => post.id === current?.id) || posts[0]);
      } else {
        setSelectedFbPost(null);
      }
    } catch (error) {
      console.error('Error loading FB posts:', error);
      toast.error('Error al cargar publicaciones');
    } finally {
      setLoadingFbPosts(false);
    }
  }, [selectedFbPage]);

  useEffect(() => {
    fetchFbPostsRef.current = fetchFbPosts;
  }, [fetchFbPosts]);

  const sendDirectMessage = useCallback(async () => {
    if (!dmRecipient || !dmText.trim() || !selectedFbPage) return;
    setSendingDm(true);
    try {
      await api.post(`${API_URL}/integrations/facebook/send-direct-message`, {
        pageId: selectedFbPage,
        recipientPsid: dmRecipient.id,
        message: dmText.trim(),
      });
      toast.success(`Mensaje enviado a ${dmRecipient.name}`);
      setDmModalOpen(false);
      setDmRecipient(null);
      setDmText('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Error al enviar mensaje directo');
    } finally {
      setSendingDm(false);
    }
  }, [dmRecipient, dmText, selectedFbPage]);

  const openDmModal = useCallback((comment: Comment) => {
    setDmRecipient({ id: comment.from?.id || '', name: comment.from?.name || 'Usuario' });
    setDmText('');
    setDmModalOpen(true);
  }, []);

  const sendPostComment = useCallback(async () => {
    if (!postCommentText.trim() || !selectedFbPost) return;

    const tempId = `temp-post-${Date.now()}`;
    const pageName = fbPages.find(p => p.pageId === selectedFbPage)?.accountName || 'Página';
    const pageAvatar = fbPages.find(p => p.pageId === selectedFbPage)?.avatarUrl;
    const optimisticComment: Comment = {
      id: tempId,
      from: { id: selectedFbPage, name: pageName, picture: { data: { url: pageAvatar } } },
      message: postCommentText,
      created_time: new Date().toISOString(),
    };

    const messageToSend = postCommentText;
    const updated = fbPosts.map(p => p.id === selectedFbPost.id
      ? { ...p, comments: { data: [...(p.comments?.data || []), optimisticComment] } }
      : p);
    setFbPosts(updated);
    setSelectedFbPost(updated.find(p => p.id === selectedFbPost.id) || null);
    setPostCommentText('');
    setSendingComment(true);

    try {
      const response = await api.post(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/facebook/reply-comment`,
        { commentId: selectedFbPost.id, message: messageToSend, pageId: selectedFbPage, postId: selectedFbPost.id }
      );

      if (response.success && response.commentId) {
        const realComment: Comment = {
          id: response.commentId,
          from: { id: selectedFbPage, name: pageName, picture: { data: { url: pageAvatar } } },
          message: messageToSend,
          created_time: new Date().toISOString(),
        };
        const replaced = fbPosts.map(p => p.id === selectedFbPost.id
          ? { ...p, comments: { data: (p.comments?.data || []).map(c => c.id === tempId ? realComment : c) } }
          : p);
        setFbPosts(replaced);
        setSelectedFbPost(replaced.find(p => p.id === selectedFbPost.id) || null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al publicar comentario');
      setFbPosts(fbPosts);
      setSelectedFbPost(selectedFbPost);
      setPostCommentText(messageToSend);
    } finally {
      setSendingComment(false);
    }
  }, [postCommentText, selectedFbPage, selectedFbPost, fbPages, fbPosts]);

  const sendCommentReply = useCallback(async (commentId: string) => {
    if (!commentReplyText.trim()) return;
    
    const tempId = `temp-${Date.now()}`;
    const pageName = fbPages.find(p => p.pageId === selectedFbPage)?.accountName || 'Página';
    const pageAvatar = fbPages.find(p => p.pageId === selectedFbPage)?.avatarUrl;
    const optimisticComment: Comment = {
      id: tempId,
      from: { id: selectedFbPage, name: pageName, picture: { data: { url: pageAvatar } } },
      message: commentReplyText,
      created_time: new Date().toISOString(),
      parent: { id: commentId },
    };
    
    // Optimistic update - show immediately
    if (selectedFbPost) {
      const updated = fbPosts.map(p => p.id === selectedFbPost.id
        ? { ...p, comments: { data: [...(p.comments?.data || []), optimisticComment] } }
        : p);
      setFbPosts(updated);
      setSelectedFbPost(updated.find(p => p.id === selectedFbPost.id) || null);
    }
    
    const messageToSend = commentReplyText;
    setCommentReplyText('');
    setReplyingToComment(null);
    setSendingComment(true);
    
    try {
      const response = await api.post(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/facebook/reply-comment`,
        { commentId, message: messageToSend, pageId: selectedFbPage, postId: selectedFbPost?.id }
      );
      
      if (response.success) {
        toast.success('Respuesta enviada');
        
        // Replace temp comment with real one from server
        if (selectedFbPost && response.commentId) {
          const realComment: Comment = {
            id: response.commentId,
            from: { id: selectedFbPage, name: pageName, picture: { data: { url: pageAvatar } } },
            message: messageToSend,
            created_time: new Date().toISOString(),
            parent: { id: commentId },
          };
          
          const updated = fbPosts.map(p => p.id === selectedFbPost.id
            ? { 
                ...p, 
                comments: { 
                  data: (p.comments?.data || []).map(c => c.id === tempId ? realComment : c) 
                } 
              }
            : p);
          setFbPosts(updated);
          setSelectedFbPost(updated.find(p => p.id === selectedFbPost.id) || null);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar respuesta');
      
      // Rollback optimistic update on error
      if (selectedFbPost) {
        const rollback = fbPosts.map(p => p.id === selectedFbPost.id
          ? { 
              ...p, 
              comments: { 
                data: (p.comments?.data || []).filter(c => c.id !== tempId) 
              } 
            }
          : p);
        setFbPosts(rollback);
        setSelectedFbPost(rollback.find(p => p.id === selectedFbPost.id) || null);
      }
      
      // Restore text so user can retry
      setCommentReplyText(messageToSend);
      setReplyingToComment(commentId);
    } finally {
      setSendingComment(false);
    }
  }, [commentReplyText, selectedFbPage, selectedFbPost, fbPages, fbPosts]);

  // Load FB pages when tab changes to fb-comments
  useEffect(() => {
    if (activeTab === 'fb-comments') {
      fetchFbPages();
    }
  }, [activeTab, fetchFbPages]);

  // Load FB posts when page is selected
  useEffect(() => {
    if (activeTab === 'fb-comments' && selectedFbPage) {
      fetchFbPosts();
      // Check if the page token has engagement permissions for reactions
      api.get(`${API_URL}/integrations/facebook/diagnose-permissions?pageId=${selectedFbPage}`)
        .then((data: any) => {
          if (data?.hasEngagementPermissions === false) {
            setFbReactionsEnabled(false);
            toast.warning('Las reacciones (Me encanta, Me divierte, etc.) no están disponibles. Solo "Me gusta" funcionará. Para habilitar todas las reacciones, ve a Meta App Review y aprueba el permiso pages_manage_engagement, o desconecta y reconecta la página.');
          } else {
            setFbReactionsEnabled(true);
          }
        })
        .catch(() => {
          // If we can't check, assume enabled and let the API error handle it
          setFbReactionsEnabled(true);
        });
    }
  }, [activeTab, selectedFbPage, fetchFbPosts]);

  // Process threaded comments
  const { fbCommentRoots, fbCommentChildrenMap } = useMemo(() => {
    const all = (selectedFbPost?.comments?.data || []) as Comment[];
    const map: Record<string, Comment[]> = {};
    const roots: Comment[] = [];
    
    for (const c of all) {
      const parentId = (c as any)?.parent?.id;
      if (parentId) {
        // This is a reply (has parent)
        if (!map[parentId]) map[parentId] = [];
        map[parentId].push(c);
      } else {
        // This is a root comment
        roots.push(c);
        // Check if this root comment has nested replies in comment.comments.data
        const nestedReplies = (c as any)?.comments?.data || [];
        if (nestedReplies.length > 0) {
          map[c.id] = nestedReplies;
        }
      }
    }
    return { fbCommentRoots: roots.sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime()), fbCommentChildrenMap: map };
  }, [selectedFbPost]);

  useEffect(() => {
    setVisibleComments(5);
  }, [selectedFbPost?.id]);

  const syncFacebookReaction = useCallback(async (objectId: string, reaction: { label: string; emoji: string }) => {
    const reactionMap: Record<string, string> = {
      'Me gusta': 'LIKE',
      'Me encanta': 'LOVE',
      'Me divierte': 'HAHA',
      'Me asombra': 'WOW',
      'Me entristece': 'SAD',
      'Me enoja': 'ANGRY',
    };

    await api.post(`${process.env.NEXT_PUBLIC_API_URL}/integrations/facebook/react`, {
      objectId,
      pageId: selectedFbPage,
      reactionType: reactionMap[reaction.label] || 'LIKE',
    });
  }, [selectedFbPage]);

  const handlePostReaction = useCallback(async (reaction: { label: string; emoji: string }) => {
    if (!selectedFbPost) return;
    const previous = postReaction;
    setPostReaction(reaction);
    try {
      await syncFacebookReaction(selectedFbPost.id, reaction);
    } catch (error: any) {
      setPostReaction(previous);
      toast.error(error.message || 'No se pudo sincronizar la reacción con Facebook');
    }
  }, [postReaction, selectedFbPost, syncFacebookReaction]);

  const handleCommentReaction = useCallback(async (commentId: string, reaction: { label: string; emoji: string }) => {
    const previous = commentReactions[commentId];
    setCommentReactions((prev) => ({ ...prev, [commentId]: reaction }));
    try {
      await syncFacebookReaction(commentId, reaction);
    } catch (error: any) {
      setCommentReactions((prev) => {
        const next = { ...prev };
        if (previous) next[commentId] = previous;
        else delete next[commentId];
        return next;
      });
      toast.error(error.message || 'No se pudo sincronizar la reacción con Facebook');
    }
  }, [commentReactions, syncFacebookReaction]);

  const ReactionPicker = ({ onSelect }: { onSelect: (reaction: { label: string; emoji: string }) => void }) => {
    const allReactions = [
      { label: 'Me gusta', emoji: '👍', color: 'text-[#1877f2]' },
      { label: 'Me encanta', emoji: '❤️', color: 'text-[#f33e58]' },
      { label: 'Me divierte', emoji: '😆', color: 'text-[#f7b125]' },
      { label: 'Me asombra', emoji: '😮', color: 'text-[#f7b125]' },
      { label: 'Me entristece', emoji: '😢', color: 'text-[#f7b125]' },
      { label: 'Me enoja', emoji: '😡', color: 'text-[#e9710f]' },
    ];
    const reactions = fbReactionsEnabled ? allReactions : allReactions.slice(0, 1);

    if (!fbReactionsEnabled) return null;

    return (
      <div className="absolute bottom-full left-0 mb-0 hidden group-hover/like:flex hover:flex items-center bg-content1 rounded-full shadow-lg border border-divider/70 px-2 py-1 z-20 before:absolute before:left-0 before:right-0 before:-bottom-3 before:h-3 before:content-['']">
        {reactions.map((reaction) => (
          <button
            key={reaction.label}
            type="button"
            className="w-9 h-9 rounded-full flex items-center justify-center text-2xl transition-transform duration-150 hover:-translate-y-1 hover:scale-125"
            onClick={() => onSelect(reaction)}
            title={reaction.label}
          >
            {reaction.emoji}
          </button>
        ))}
      </div>
    );
  };

  const formatFbTime = (date: string) => {
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  };

  const formatFbDate = (date: string) => {
    const d = new Date(date);
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${d.getDate()} de ${months[d.getMonth()]} a las ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const getPostDescription = (post: Post) => {
    if (post.story) return post.story.replace(post.from?.name || '', '').trim() || post.story;
    const statusMap: Record<string, string> = {
      'added_photos': 'ha publicado una foto.',
      'mobile_status_update': 'ha publicado una actualización.',
      'created_note': 'ha creado una nota.',
      'shared_story': 'ha compartido una historia.',
      'created_group': 'ha creado un grupo.',
      'approved_friend': 'tiene un nuevo amigo.',
      'created_event': 'ha creado un evento.',
      'wall_post': 'ha publicado en el muro.',
      'published_story': 'ha publicado una historia.',
      'tagged_in_photo': 'ha sido etiquetado en una foto.',
    };
    if (post.status_type && statusMap[post.status_type]) return statusMap[post.status_type];
    if (post.full_picture && !post.message) return 'ha actualizado su foto de portada.';
    if (post.full_picture && post.message) return 'ha publicado una foto.';
    if (post.message) return 'ha publicado una actualización.';
    return 'ha publicado contenido.';
  };

  // --- Render ---

  const isFbCommentsTab = activeTab === 'fb-comments';
  const isIgCommentsTab = activeTab === 'ig-comments';

  return (
    <div className="h-[calc(100dvh-4rem)] min-h-0 flex flex-col overflow-hidden bg-gradient-to-br from-default-50 via-content1 to-default-100 -m-6">
      {/* Top Bar with Tabs */}
      <div className="shrink-0 border-b border-divider/70 bg-content1/95 backdrop-blur-xl px-4 py-2.5 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
              <MessagesSquare className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight leading-5">Contact Center</h1>
              <p className="text-[11px] text-default-500 leading-4 truncate">Chats directos y comentarios separados por canal</p>
            </div>
          </div>
          <Chip
            size="sm"
            variant="flat"
            color={isConnected ? "success" : "danger"}
            className="px-2 h-6"
            startContent={<span className={`w-2 h-2 rounded-full ${isConnected ? "bg-success animate-pulse" : "bg-danger"}`} />}
          >
            {isConnected ? "En vivo" : "Sin conexión"}
          </Chip>
        </div>
        <Tabs
          aria-label="Contact Center Tabs"
          variant="solid"
          color="primary"
          selectedKey={activeTab}
          onSelectionChange={(key) => handleTabChange(key as string)}
          classNames={{
            base: "w-full",
            tabList: "gap-1 bg-default-100/80 p-0.5 rounded-xl",
            tab: "h-8 px-3 data-[selected=true]:shadow-sm",
            cursor: "rounded-lg",
          }}
        >
          <Tab key="all" title={<span className="text-xs flex items-center gap-1.5"><MessagesSquare size={14} />Todos {unreadCounts.all > 0 && (<Chip size="sm" color="primary" variant="solid" className="h-4 min-w-4 text-[9px] px-1">{unreadCounts.all}</Chip>)}</span>} />
          <Tab key="messenger" title={<span className="text-xs flex items-center gap-1.5"><Facebook size={14} />Messenger {unreadCounts.messenger > 0 && (<Chip size="sm" color="primary" variant="solid" className="h-4 min-w-4 text-[9px] px-1">{unreadCounts.messenger}</Chip>)}</span>} />
          <Tab key="instagram" title={<span className="text-xs flex items-center gap-1.5"><Instagram size={14} />Instagram {unreadCounts.instagram > 0 && (<Chip size="sm" color="secondary" variant="solid" className="h-4 min-w-4 text-[9px] px-1">{unreadCounts.instagram}</Chip>)}</span>} />
          <Tab key="whatsapp" title={<span className="text-xs flex items-center gap-1.5"><MessageCircle size={14} />WhatsApp {unreadCounts.whatsapp > 0 && (<Chip size="sm" color="success" variant="solid" className="h-4 min-w-4 text-[9px] px-1">{unreadCounts.whatsapp}</Chip>)}</span>} />
          <Tab key="fb-comments" title={<span className="text-xs flex items-center gap-1.5"><Facebook size={14} />Comentarios FB</span>} />
          <Tab key="ig-comments" title={<span className="text-xs flex items-center gap-1.5"><Instagram size={14} />Comentarios IG</span>} />
        </Tabs>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 flex gap-0 overflow-hidden p-3 pt-2.5">
      {/* Conversation List / Posts List */}
      <div className={`w-[360px] min-h-0 border flex flex-col rounded-l-3xl shadow-sm overflow-hidden transition-colors duration-300 ${tabTheme.panel}`}>
        <div className={`shrink-0 p-4 border-b space-y-3 transition-colors duration-300 ${tabTheme.header}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold">
                {isFbCommentsTab ? `Publicaciones (${fbPosts.length})` : isIgCommentsTab ? 'Publicaciones Instagram' : 'Bandeja de entrada'}
              </h2>
              <p className="text-xs text-default-500">
                {isFbCommentsTab ? 'Selecciona una publicación para responder' : isIgCommentsTab ? 'Comentarios de Instagram separados del chat' : `${filteredConversations.length} conversación${filteredConversations.length === 1 ? '' : 'es'}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {activeTab === 'instagram' && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  radius="full"
                  isLoading={igSyncing}
                  onPress={syncInstagramMessages}
                  title="Sincronizar Instagram DMs"
                >
                  <Instagram size={15} className="text-foreground" />
                </Button>
              )}
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                radius="full"
                onPress={isFbCommentsTab ? fetchFbPosts : isIgCommentsTab ? undefined : loadConversations}
              >
                <RefreshCw size={15} />
              </Button>
            </div>
          </div>
          
          {isFbCommentsTab ? (
            <Select
              size="sm"
              placeholder="Selecciona una página"
              selectedKeys={selectedFbPage ? [selectedFbPage] : []}
              onChange={(e) => setSelectedFbPage(e.target.value)}
              startContent={<Facebook size={14} className="text-primary" />}
            >
              {fbPages.map(p => (
                <SelectItem key={p.pageId}>{p.accountName}</SelectItem>
              ))}
            </Select>
          ) : isIgCommentsTab ? (
            <div className="rounded-2xl border border-divider/70 bg-secondary/5 p-3 text-center">
              <Instagram className="mx-auto mb-2 text-secondary" size={22} />
              <p className="text-xs font-medium">Comentarios de Instagram</p>
              <p className="text-[11px] text-default-500 mt-1">Separado de Facebook y chats directos</p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {isFbCommentsTab ? (
            // Facebook Posts List
            loadingFbPosts ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="sm" />
              </div>
            ) : fbPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Facebook className="text-default-300 mb-3" size={40} />
                <p className="text-sm text-default-500">
                  No hay publicaciones
                </p>
                <p className="text-xs text-default-400 mt-1">
                  Selecciona una página de Facebook
                </p>
              </div>
            ) : (
              fbPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => setSelectedFbPost(post)}
                  className={`w-full text-left px-3 py-3 flex gap-3 transition-colors border-b border-divider/70 ${
                    selectedFbPost?.id === post.id
                      ? "bg-primary/10 border-l-4 border-l-primary"
                      : "hover:bg-default-100/70 border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="relative shrink-0">
                    {post.full_picture ? (
                      <img 
                        src={post.full_picture} 
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-divider" 
                        alt="" 
                      />
                    ) : (
                      <Avatar
                        icon={<ImageIcon size={18} />}
                        className="bg-default-200"
                        size="md"
                      />
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center ring-2 ring-content1">
                      <Facebook size={10} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold line-clamp-2 text-foreground">
                      {post.message ? (post.message.length > 80 ? post.message.substring(0, 80) + '...' : post.message) : post.story || `${post.from?.name || 'Página'} ${getPostDescription(post)}`}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-default-500 truncate">Publicado por . {post.admin_creator?.name || post.from?.name || 'Página'}</span>
                      <span className="text-[10px] text-default-400">·</span>
                      <span className="text-[10px] text-default-400 shrink-0">{formatFbTime(post.created_time)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-default-500">
                      <span className="inline-flex items-center gap-1">
                        <ThumbsUp size={11} /> {post.reactions?.summary?.total_count || post.likes?.summary?.total_count || 0}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle size={11} /> {post.comments?.data?.length || 0}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )
          ) : isIgCommentsTab ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Instagram className="text-default-300 mb-3" size={40} />
              <p className="text-sm text-default-500">
                No hay publicaciones de Instagram cargadas
              </p>
              <p className="text-xs text-default-400 mt-1">
                Este tab no muestra comentarios de Facebook
              </p>
            </div>
          ) : (
            // Conversations List
            loadingConvs ? (
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
                className={`w-full text-left p-3.5 flex items-center gap-3 transition-all border-b border-divider/60 group border-l-4 ${
                  selectedConv?._id === conv._id
                    ? tabTheme.selected
                    : tabTheme.hover
                }`}
                onClick={() => selectConversation(conv)}
              >
                <div className="relative flex-shrink-0">
                  <Avatar
                    color="primary"
                    name={conv.contactId?.name?.substring(0, 2).toUpperCase() || "V"}
                    size="md"
                    className="shadow-sm"
                  />
                  <div className="absolute -bottom-1 -right-1">
                    <ChannelIcon channel={conv.channel} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                      {conv.contactId?.name || "Visitor"}
                    </span>
                    <span className="text-xs text-default-400 flex-shrink-0">
                      {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ""}
                    </span>
                  </div>
                  {(conv.subject && !conv.subject.startsWith("Chat Widget")) || conv.metadata?.pageName ? (
                    <div className="flex items-center gap-1 mt-0.5 min-w-0">
                      {conv.subject && !conv.subject.startsWith("Chat Widget") && (
                        <p className="text-xs text-primary-500 font-medium truncate">
                          {conv.subject}
                        </p>
                      )}
                      {conv.metadata?.pageName && (
                        <span className="text-[10px] text-default-400 truncate">
                          [{conv.metadata.pageName}]
                        </span>
                      )}
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
                  ) : null}
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
                        <Chip color="primary" size="sm" variant="solid" className="min-w-6 h-6 font-bold shadow-sm">
                          {conv.unreadCount}
                        </Chip>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
            )
          )}
        </div>
      </div>

      {/* Chat Area / Post Detail */}
      <div className="flex-1 min-h-0 flex flex-col bg-content1/95 border-y border-r border-divider/70 overflow-hidden shadow-sm">
        {isFbCommentsTab ? (
          // Facebook Comments View
          !selectedFbPost ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-gradient-to-br from-content1 via-default-50/60 to-primary/5">
              <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-5 shadow-sm border border-primary/10">
                <Facebook className="text-primary" size={40} />
              </div>
              <h3 className="text-xl font-bold mb-2">Comentarios de Facebook</h3>
              <p className="text-default-500 text-sm max-w-md">
                Selecciona una publicación del panel izquierdo para ver y responder comentarios sin mezclarlo con los chats directos.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col bg-default-100">
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                <div className="max-w-xl mx-auto">
                  <Card shadow="sm" className="border border-divider overflow-hidden bg-content1">
                    <CardHeader className="flex gap-3 items-start pb-2 pt-4 px-4">
                      <Avatar 
                        name={selectedFbPost.from?.name?.substring(0, 2) || 'P'} 
                        src={selectedFbPost.from?.picture?.data?.url}
                        className="bg-primary text-white shrink-0" 
                        size="md"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="text-base leading-5">
                          <span className="font-bold text-primary">{selectedFbPost.from?.name || 'Página'}</span>
                          <span className="text-default-600"> {getPostDescription(selectedFbPost)}</span>
                        </div>
                        <div className="text-xs text-default-500 mt-0.5">
                          Publicado por {selectedFbPost.admin_creator?.name || selectedFbPost.from?.name || 'Página'} · {formatFbDate(selectedFbPost.created_time)} · 🌐
                        </div>
                      </div>
                      <Button isIconOnly size="sm" variant="light" className="shrink-0">
                        <MoreVertical size={16} />
                      </Button>
                    </CardHeader>
                    <CardBody className="pt-0 px-0 pb-0">
                      {selectedFbPost.message && <p className="px-4 mb-2 text-sm text-foreground whitespace-pre-wrap">{selectedFbPost.message}</p>}
                      {selectedFbPost.full_picture && (
                        <img 
                          src={selectedFbPost.full_picture} 
                          className="w-full max-h-[360px] object-cover" 
                          alt="" 
                        />
                      )}
                      <div className="relative px-4 pt-0">
                        <div className="flex items-center justify-between pt-2 pb-2 text-sm text-default-500 border-b border-divider/70">
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-flex -space-x-1 text-base leading-none"><span>👍</span><span>❤️</span></span>
                            {(selectedFbPost.reactions?.summary?.total_count || selectedFbPost.likes?.summary?.total_count || 0) + (postReaction ? 1 : 0)}
                          </span>
                          <span>{selectedFbPost.comments?.data?.length || 0} comentarios</span>
                        </div>
                        <div className="flex items-center gap-6 py-2 text-sm text-default-600 border-b border-divider/70">
                          <div className="relative group/like">
                            <ReactionPicker onSelect={handlePostReaction} />
                            <button
                              className={`inline-flex items-center gap-2 font-semibold hover:bg-default-100 rounded-lg px-3 py-1.5 ${postReaction?.label === 'Me encanta' ? 'text-[#f33e58]' : postReaction ? 'text-[#1877f2]' : ''}`}
                              onClick={() => postReaction ? setPostReaction(null) : handlePostReaction({ label: 'Me gusta', emoji: '👍' })}
                            >
                              <span>{postReaction?.emoji || <ThumbsUp size={17} />}</span> {postReaction?.label || 'Me gusta'}
                            </button>
                          </div>
                          <button className="inline-flex items-center gap-2 font-semibold hover:bg-default-100 rounded-lg px-3 py-1.5"><MessageCircle size={17} /> Comentar</button>
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <button className="text-sm font-semibold text-default-600 inline-flex items-center gap-1">Más recientes <span className="text-xs">▾</span></button>
                        </div>
                        <div className="space-y-3 pb-4">
                    {fbCommentRoots.slice(0, visibleComments).map(comment => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar 
                          name={comment.from?.name?.substring(0, 2) || 'U'} 
                          src={comment.from?.picture?.data?.url}
                          className="bg-default-300 text-white flex-shrink-0" 
                          size="sm" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="bg-default-100 rounded-2xl px-3 py-2 inline-block max-w-full">
                            <div className="font-semibold text-xs text-foreground">{comment.from?.name || 'Usuario'}</div>
                            <div className="text-xs text-foreground whitespace-pre-wrap break-words">{comment.message}</div>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 px-2 text-[10px] text-default-500">
                            <div className="relative group/like">
                              <ReactionPicker onSelect={(reaction) => handleCommentReaction(comment.id, reaction)} />
                              <button
                                className={`font-semibold hover:underline ${commentReactions[comment.id]?.label === 'Me encanta' ? 'text-[#f33e58]' : commentReactions[comment.id] ? 'text-[#1877f2]' : ''}`}
                                onClick={() => {
                                  if (commentReactions[comment.id]) {
                                    setCommentReactions((prev) => {
                                      const next = { ...prev };
                                      delete next[comment.id];
                                      return next;
                                    });
                                    return;
                                  }
                                  handleCommentReaction(comment.id, { label: 'Me gusta', emoji: '👍' });
                                }}
                              >
                                {commentReactions[comment.id]?.label || 'Me gusta'}
                              </button>
                            </div>
                            <button
                              className="font-semibold hover:underline"
                              onClick={() => { 
                                setReplyingToComment(replyingToComment === comment.id ? null : comment.id); 
                                setCommentReplyText(''); 
                              }}
                            >
                              Responder
                            </button>
                            <button
                              className="font-semibold text-primary hover:underline"
                              onClick={() => openDmModal(comment)}
                            >Enviar mensaje</button>
                            <span>{formatFbTime(comment.created_time)}</span>
                            {((comment.like_count || 0) + (commentReactions[comment.id] ? 1 : 0)) > 0 && (
                              <span className="inline-flex items-center gap-1 ml-auto text-default-500 font-semibold">
                                {(comment.like_count || 0) + (commentReactions[comment.id] ? 1 : 0)} <span className="text-base leading-none">{commentReactions[comment.id]?.emoji || '👍'}</span>
                              </span>
                            )}
                          </div>

                          {/* Reply Input - Compact */}
                          {replyingToComment === comment.id && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <Avatar 
                                name="P" 
                                className="bg-primary text-white flex-shrink-0" 
                                size="sm" 
                              />
                              <div className="flex-1 flex items-center gap-1.5 bg-default-100 rounded-full pl-2.5 pr-1 py-0.5">
                                <Input
                                  aria-label="Escribe una respuesta"
                                  variant="bordered"
                                  size="sm"
                                  classNames={{ 
                                    inputWrapper: 'shadow-none border-none bg-transparent h-7', 
                                    input: 'text-xs' 
                                  }}
                                  value={commentReplyText}
                                  onValueChange={setCommentReplyText}
                                  onKeyDown={(e) => { 
                                    if (e.key === 'Enter' && !e.shiftKey) { 
                                      e.preventDefault(); 
                                      sendCommentReply(comment.id); 
                                    } 
                                  }}
                                  placeholder={`Respondes como ${fbPages.find(p => p.pageId === selectedFbPage)?.accountName || 'tu página'}`}
                                />
                                <Button size="sm" variant="light" isIconOnly className="h-7 w-7 min-w-0 text-default-500"><Smile className="w-3.5 h-3.5" /></Button>
                                <Button size="sm" variant="light" isIconOnly className="h-7 w-7 min-w-0 text-default-500"><Camera className="w-3.5 h-3.5" /></Button>
                                <Button size="sm" variant="light" className="h-7 min-w-0 px-1.5 text-[10px] text-default-500">GIF</Button>
                                <Button 
                                  size="sm" 
                                  color="primary" 
                                  isDisabled={!commentReplyText.trim() || sendingComment} 
                                  onPress={() => sendCommentReply(comment.id)} 
                                  isIconOnly
                                  className="h-7 w-7 min-w-0"
                                >
                                  <Send className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Threaded Replies - Compact */}
                          {fbCommentChildrenMap[comment.id]?.length > 0 && (
                            <div className="mt-2 space-y-2 ml-6">
                              {fbCommentChildrenMap[comment.id].map(reply => (
                                <div key={reply.id} className="flex gap-1.5">
                                  <Avatar 
                                    name={reply.from?.name?.substring(0, 2) || 'U'} 
                                    src={reply.from?.picture?.data?.url}
                                    className="bg-default-300 text-white flex-shrink-0" 
                                    size="sm" 
                                  />
                                  <div className="bg-default-100 rounded-2xl px-3 py-2 inline-block max-w-full">
                                    <div className="font-semibold text-xs text-foreground">{reply.from?.name || 'Usuario'}</div>
                                    <div className="text-xs text-foreground whitespace-pre-wrap break-words">{reply.message}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                        </div>
                        {fbCommentRoots.length > visibleComments && (
                          <div className="flex justify-center pb-4">
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              onPress={() => setVisibleComments((prev) => prev + 5)}
                            >
                              Mostrar más comentarios ({fbCommentRoots.length - visibleComments} restantes)
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>

              <div className="shrink-0 px-4 py-2 border-t border-divider/70 bg-content1">
                <div className="max-w-xl mx-auto flex items-center gap-2">
                  <Avatar
                    name={(fbPages.find(p => p.pageId === selectedFbPage)?.accountName || 'P').substring(0, 2)}
                    className="bg-primary text-white shrink-0"
                    size="sm"
                  />
                  <div className="flex-1 flex items-center gap-1.5 bg-default-100 rounded-full pl-3 pr-1 py-1">
                    <Input
                      aria-label="Comentar publicación"
                      variant="bordered"
                      size="sm"
                      classNames={{ inputWrapper: 'shadow-none border-none bg-transparent h-8', input: 'text-xs' }}
                      value={postCommentText}
                      onValueChange={setPostCommentText}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendPostComment();
                        }
                      }}
                      placeholder={`Comentas como ${fbPages.find(p => p.pageId === selectedFbPage)?.accountName || 'tu página'}`}
                    />
                    <Button size="sm" variant="light" isIconOnly className="h-7 w-7 min-w-0 text-default-500"><ShieldCheck className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="light" isIconOnly className="h-7 w-7 min-w-0 text-default-500"><Smile className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="light" isIconOnly className="h-7 w-7 min-w-0 text-default-500"><Camera className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="light" className="h-7 min-w-0 px-1.5 text-[10px] text-default-500">GIF</Button>
                    <Button
                      size="sm"
                      color="primary"
                      isDisabled={!postCommentText.trim() || sendingComment}
                      onPress={sendPostComment}
                      isIconOnly
                      className="h-7 w-7 min-w-0"
                    >
                      <Send className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        ) : isIgCommentsTab ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-gradient-to-br from-content1 via-default-50/60 to-secondary/5">
            <div className="w-24 h-24 rounded-3xl bg-secondary/10 flex items-center justify-center mb-5 shadow-sm border border-secondary/10">
              <Instagram className="text-secondary" size={40} />
            </div>
            <h3 className="text-xl font-bold mb-2">Comentarios de Instagram</h3>
            <p className="text-default-500 text-sm max-w-md">
              Aquí se mostrarán únicamente publicaciones y comentarios de Instagram. Los comentarios de Facebook permanecen separados en su propio tab.
            </p>
          </div>
        ) : !selectedConv ? (
          // Live Chat Empty State
          <div className={`flex-1 flex flex-col items-center justify-center text-center px-8 bg-gradient-to-br ${tabTheme.shell}`}>
            <div className="w-24 h-24 rounded-3xl bg-content1/70 flex items-center justify-center mb-5 shadow-sm border border-current/10">
              <MessagesSquare className={tabTheme.icon} size={40} />
            </div>
            <h3 className="text-xl font-bold mb-2">Selecciona una conversación</h3>
            <p className="text-default-500 text-sm max-w-md">
              Responde mensajes directos de Messenger, Instagram, WhatsApp y el widget desde una bandeja centralizada.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-[72px] shrink-0 border-b border-divider/70 flex items-center justify-between px-5 bg-content1/95 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <Avatar
                  color="primary"
                  name={
                    selectedConv.contactId?.name
                      ?.substring(0, 2)
                      .toUpperCase() || "V"
                  }
                  size="md"
                  className="shadow-sm"
                />
                <div>
                  <p className="text-sm font-semibold">
                    {selectedConv.contactId?.name || "Visitor"}
                  </p>
                  <div className="flex items-center gap-2">
                    <Chip 
                      color={selectedConv.channel === 'facebook' ? 'primary' : 'default'} 
                      size="sm" 
                      variant="dot"
                      startContent={<ChannelIcon channel={selectedConv.channel} />}
                    >
                      {selectedConv.channel === 'facebook' ? 'Facebook' : selectedConv.channel === 'instagram' ? 'Instagram' : 'Widget'}
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
            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-3" style={messagesBackground}>
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
                  {messages.map((msg, index) => {
                    const key = String(
                      (msg as any)?._id ||
                      (msg as any)?.id ||
                      (msg as any)?.uuid ||
                      (msg as any)?.messageId ||
                      (msg as any)?.clientId ||
                      `${(msg as any)?.direction || 'm'}-${(msg as any)?.createdAt || (msg as any)?.created_time || (msg as any)?.timestamp || index}-${index}`
                    );
                    return (
                    <Fragment key={key}>
                      {/* Unread divider - show before first unread message */}
                      {index === firstUnreadIndex && firstUnreadIndex !== -1 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center gap-3 my-4 px-4"
                        >
                          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-primary/40" />
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                            <MessagesSquare className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-medium text-primary">
                              {messages.slice(firstUnreadIndex).filter(m => m.direction === "inbound" && m.status?.toLowerCase() !== "read").length} mensaje{messages.slice(firstUnreadIndex).filter(m => m.direction === "inbound" && m.status?.toLowerCase() !== "read").length !== 1 ? 's' : ''} no leído{messages.slice(firstUnreadIndex).filter(m => m.direction === "inbound" && m.status?.toLowerCase() !== "read").length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-primary/40 to-primary/40" />
                        </motion.div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${msg.direction === "outbound" ? "items-end" : "items-start"}`}
                      >
                      {msg.direction === "inbound" && msg.senderName && (
                        <p className="text-xs font-semibold mb-1 ml-3 text-default-500 opacity-85">
                          {msg.senderName}
                        </p>
                      )}
                      <div className="flex flex-col max-w-[75%]">
                        <div
                          className={`rounded-2xl overflow-hidden shadow-sm border ${
                            msg.direction === "outbound"
                              ? "text-white rounded-br-md border-primary/20"
                              : "bg-content1 rounded-bl-md border-divider/70"
                          } ${((msg.type === "image" && msg.media?.url) || (msg.media?.mimeType || "").startsWith("image/")) ? "p-0" : "px-3.5 py-2.5"}`}
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
                          {((msg.type === "image" && msg.media?.url) || (msg.media?.mimeType || "").startsWith("image/")) ? (
                            <>
                              <img
                                src={msg.media!.url}
                                alt={msg.media?.fileName || "Imagen"}
                                className="max-w-[280px] max-h-[350px] w-full cursor-pointer object-cover hover:opacity-95 transition-opacity"
                                loading="lazy"
                                onClick={() => setViewingImage(msg.media!.url)}
                              />
                              {msg.content && msg.content !== "📷 Imagen" && (
                                <p className="text-sm whitespace-pre-wrap break-words px-[10px] py-2 pb-2" style={{ hyphens: "none" }}>
                                  {msg.content}
                                </p>
                              )}
                            </>
                          ) : msg.type === "file" && msg.media?.url ? (
                            <a
                              href={msg.media.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline break-all text-sm"
                            >
                              {msg.content || msg.media.fileName || "Archivo"}
                            </a>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap break-words" style={{ hyphens: "none" }}>
                              {msg.content}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 px-1 mt-1">
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
                    </Fragment>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-divider/70 p-4 bg-content1/95 backdrop-blur-xl">
              {visitorTyping && (
                <div className="text-xs text-default-500 mb-2">Visitante está escribiendo...</div>
              )}
              <div className="flex items-center gap-2 rounded-2xl border border-divider/70 bg-default-50/70 p-2 shadow-sm">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    radius="full"
                    isLoading={uploadingFile}
                    onPress={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon size={16} />
                  </Button>
                  <Input
                    placeholder="Escribe un mensaje..."
                    size="sm"
                    variant="bordered"
                    radius="full"
                    value={messageInput}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    onValueChange={(value) => {
                      setMessageInput(value);

                      if (!selectedConv?.metadata?.widgetId || !selectedConv?.metadata?.visitorId) {
                        return;
                      }

                      emitAdminTyping(value.trim().length > 0);

                      if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                      }

                      typingTimeoutRef.current = setTimeout(() => {
                        emitAdminTyping(false);
                      }, 900);
                    }}
                  />
                  <Button
                    color="primary"
                    isDisabled={!messageInput.trim()}
                    isIconOnly
                    isLoading={sendingMsg}
                    size="sm"
                    radius="full"
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
        <div className="w-80 min-h-0 border-y border-r border-divider/70 flex flex-col bg-content1/95 overflow-hidden rounded-r-3xl shadow-sm">
          <div className="shrink-0 p-3 border-b border-divider/70 bg-content1/90">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-bold">Información del contacto</h3>
              <Chip
                size="sm"
                variant="flat"
                color={(statusColors[selectedConv.status] || "default") as any}
                className="h-5 text-[10px]"
              >
                {statusLabels[selectedConv.status] || selectedConv.status}
              </Chip>
            </div>
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                color="primary"
                name={contactEdit.name?.substring(0, 2).toUpperCase() || "V"}
                size="md"
                className="shrink-0 shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{contactEdit.name || "Visitor"}</p>
                <div className="flex items-center gap-1.5 mt-1 min-w-0">
                  <ChannelIcon channel={selectedConv.channel} />
                  {selectedConv.contactId?.source && (
                    <span className="text-[11px] text-default-500 truncate">{selectedConv.contactId.source}</span>
                  )}
                  {!selectedConv.contactId?.source && (
                    <span className="text-[11px] text-default-500 truncate">{selectedConv.channel}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 space-y-2.5 flex-1 min-h-0 overflow-y-auto">
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
            <div className="border-t border-divider/70 pt-2.5">
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
                minRows={2}
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

            {selectedConv.assignedTo && (
              <div className="rounded-2xl border border-divider/70 bg-default-50/60 p-3">
                <p className="text-xs text-default-500 mb-2">Asignado a</p>
                <div className="flex items-center gap-2">
                  <Avatar
                    name={`${selectedConv.assignedTo.firstName?.[0]}${selectedConv.assignedTo.lastName?.[0]}`}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">
                      {selectedConv.assignedTo.firstName} {selectedConv.assignedTo.lastName}
                    </p>
                    <p className="text-[10px] text-default-400 truncate">
                      {selectedConv.assignedTo.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-divider/70 bg-default-50/60 p-3 space-y-2">
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

      {/* Modal: Image Preview (before send) */}
      {imagePreview && (
        <Modal 
          isOpen={true} 
          onClose={cancelImagePreview}
          size="3xl"
          classNames={{
            base: "bg-black/95",
            closeButton: "text-white hover:bg-white/20"
          }}
        >
          <ModalContent>
            <ModalHeader className="text-white">Vista previa</ModalHeader>
            <ModalBody className="flex flex-col items-center">
              <img
                src={imagePreview.url}
                alt="Preview"
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
              <Textarea
                placeholder="Añade un mensaje..."
                value={imagePreview.caption}
                onValueChange={(value) => setImagePreview({...imagePreview, caption: value})}
                className="mt-4"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-white/10 border-white/20"
                }}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={cancelImagePreview} className="text-white">
                Cancelar
              </Button>
              <Button 
                color="primary" 
                onPress={sendImageWithCaption}
                isLoading={uploadingFile}
                startContent={!uploadingFile && <Send size={16} />}
              >
                Enviar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal: View Full Image */}
      {viewingImage && (
        <Modal 
          isOpen={true} 
          onClose={() => setViewingImage(null)}
          size="full"
          classNames={{
            base: "bg-black/95",
            closeButton: "text-white hover:bg-white/20 z-50"
          }}
        >
          <ModalContent>
            <ModalBody className="flex items-center justify-center p-0">
              <img
                src={viewingImage}
                alt="Full size"
                className="max-w-full max-h-screen object-contain"
                onClick={() => setViewingImage(null)}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Modal: Send Direct Message (from FB comments) */}
      <Modal
        isOpen={dmModalOpen}
        onClose={() => { setDmModalOpen(false); setDmRecipient(null); setDmText(''); }}
        size="md"
      >
        <ModalContent>
          <ModalHeader>Enviar mensaje directo</ModalHeader>
          <ModalBody>
            {dmRecipient && (
              <div className="flex items-center gap-3 mb-2 p-3 bg-default-100 rounded-lg">
                <Avatar
                  name={dmRecipient.name?.substring(0, 2) || 'U'}
                  className="bg-primary text-white"
                  size="sm"
                />
                <div>
                  <div className="font-semibold text-sm">{dmRecipient.name}</div>
                  <div className="text-xs text-default-500">Facebook Messenger</div>
                </div>
              </div>
            )}
            <Textarea
              label="Mensaje"
              labelPlacement="outside"
              placeholder={`Escribe un mensaje para ${dmRecipient?.name || 'este usuario'}...`}
              value={dmText}
              onValueChange={setDmText}
              minRows={3}
              maxRows={6}
              variant="bordered"
              autoFocus
            />
            <p className="text-xs text-default-400">
              Este mensaje se enviará por Messenger y se creará una conversación en la bandeja de entrada.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => { setDmModalOpen(false); setDmRecipient(null); setDmText(''); }}>
              Cancelar
            </Button>
            <Button
              color="primary"
              isDisabled={!dmText.trim() || sendingDm}
              onPress={sendDirectMessage}
              isLoading={sendingDm}
              startContent={!sendingDm && <Send size={16} />}
            >
              Enviar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      </div>
    </div>
  );
}
