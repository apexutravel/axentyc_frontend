"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Avatar } from "@heroui/avatar";
import { Checkbox } from "@heroui/checkbox";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { toast } from "sonner";
import {
  Mail, Settings, Plus, Inbox, Send, Trash2, RefreshCw, Search,
  Reply, ReplyAll, Forward, Trash, Star, Archive, X, FileText,
  UserPlus, Target, DollarSign, MoreVertical, CheckSquare, AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";
import { useSocket } from "@/hooks/useSocket";
import RichTextEditor from "@/components/RichTextEditor";

/* ── types ── */
interface EmailAddr { name?: string; address: string }
interface EmailItem {
  _id: string;
  from: EmailAddr;
  to: EmailAddr[];
  cc?: EmailAddr[];
  subject: string;
  preview?: string;
  textBody?: string;
  htmlBody?: string;
  date: string;
  isRead: boolean;
  isFlagged: boolean;
  folder: string;
}
interface FolderItem { name: string; path: string; specialUse?: string | null; count: number; unread: number }

/* ── helpers ── */
const FOLDER_ICONS: Record<string, React.ReactNode> = {
  INBOX: <Inbox size={16} />,
  Sent: <Send size={16} />,
  Drafts: <FileText size={16} />,
  Trash: <Trash2 size={16} />,
  Junk: <AlertCircle size={16} />,
  Archive: <Archive size={16} />,
};

const getFolderIcon = (f: FolderItem) => {
  if (f.specialUse === "\\Sent") return <Send size={16} />;
  if (f.specialUse === "\\Trash") return <Trash2 size={16} />;
  if (f.specialUse === "\\Drafts") return <FileText size={16} />;
  if (f.specialUse === "\\Junk") return <AlertCircle size={16} />;
  if (f.specialUse === "\\Archive") return <Archive size={16} />;
  return FOLDER_ICONS[f.name] || <Mail size={16} />;
};

// Only show these 4 folders in fixed order: INBOX → Sent → Archive → Trash
const FOLDER_ORDER: Record<string, number> = { "INBOX": 0, "\\Sent": 1, "\\Archive": 2, "\\Trash": 3 };
const ALLOWED_SPECIAL = new Set(["\\Sent", "\\Trash", "\\Archive"]);
const ALLOWED_NAMES = new Set(["INBOX"]);
const filterFolders = (list: FolderItem[]) =>
  list
    .filter(f => ALLOWED_NAMES.has(f.name) || (f.specialUse && ALLOWED_SPECIAL.has(f.specialUse)))
    .sort((a, b) => {
      const oa = FOLDER_ORDER[a.name] ?? FOLDER_ORDER[a.specialUse || ""] ?? 99;
      const ob = FOLDER_ORDER[b.name] ?? FOLDER_ORDER[b.specialUse || ""] ?? 99;
      return oa - ob;
    });

// Default folders shown immediately before API responds
const DEFAULT_FOLDERS: FolderItem[] = [
  { name: "INBOX", path: "INBOX", specialUse: null, count: 0, unread: 0 },
  { name: "Sent", path: "Sent", specialUse: "\\Sent", count: 0, unread: 0 },
  { name: "Archive", path: "Archive", specialUse: "\\Archive", count: 0, unread: 0 },
  { name: "Trash", path: "Trash", specialUse: "\\Trash", count: 0, unread: 0 },
];

const fmtDate = (d: string) => {
  const date = new Date(d);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays < 7) return date.toLocaleDateString("es", { weekday: "short" });
  return date.toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "2-digit" });
};

/* ── Sandboxed iframe for HTML emails ── */
function HtmlEmailFrame({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Detect if parent is dark mode
    const isDark = document.documentElement.classList.contains("dark");

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px; line-height: 1.6;
      color: ${isDark ? '#e4e4e7' : '#27272a'};
      background: ${isDark ? '#18181b' : '#ffffff'};
      word-wrap: break-word; overflow-wrap: break-word;
    }
    body { padding: 16px; }
    a { color: ${isDark ? '#60a5fa' : '#2563eb'}; }
    img { max-width: 100%; height: auto; }
    table { max-width: 100%; border-collapse: collapse; }
    td, th { padding: 4px 8px; }
    blockquote { border-left: 3px solid ${isDark ? '#3f3f46' : '#d4d4d8'}; margin: 8px 0; padding-left: 12px; color: ${isDark ? '#a1a1aa' : '#71717a'}; }
    pre, code { font-size: 13px; background: ${isDark ? '#27272a' : '#f4f4f5'}; border-radius: 4px; }
    pre { padding: 12px; overflow-x: auto; }
    code { padding: 2px 4px; }
  </style>
</head>
<body>${html}</body>
</html>`);
    doc.close();

    // Auto-resize iframe height to fit content
    const resize = () => {
      try {
        const h = doc.documentElement?.scrollHeight || doc.body?.scrollHeight || 400;
        iframe.style.height = h + 'px';
      } catch {}
    };

    // Resize after images load
    const imgs = doc.querySelectorAll('img');
    imgs.forEach(img => img.addEventListener('load', resize));
    // Initial resize after a tick
    setTimeout(resize, 100);
    setTimeout(resize, 500);

    // Make links open in new tab
    const links = doc.querySelectorAll('a');
    links.forEach(a => { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener noreferrer'); });
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-same-origin"
      className="w-full border-0"
      style={{ minHeight: '200px', height: '400px' }}
      title="Email content"
    />
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function InboxPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<FolderItem[]>(DEFAULT_FOLDERS);
  const [folderPath, setFolderPath] = useState("INBOX");
  const [folderName, setFolderName] = useState("INBOX");
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [selected, setSelected] = useState<EmailItem | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingBody, setLoadingBody] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<"all" | "read" | "unread">("all");
  const [search, setSearch] = useState("");

  // multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // compose
  const [composeOpen, setComposeOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ to: "", cc: "", bcc: "", subject: "", body: "", htmlBody: "" });
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  // CRM create modal
  const [crmModal, setCrmModal] = useState<{ type: "contact" | "lead" | "deal"; email: EmailItem } | null>(null);
  const [crmCreating, setCrmCreating] = useState(false);
  const [crmForm, setCrmForm] = useState<any>({});

  const socket = useSocket();

  /* ── data loading ── */
  const loadStatus = useCallback(async () => {
    try {
      const r = await api.get(API_ENDPOINTS.integrations.email.status);
      setStatus((r as any)?.data ?? r);
    } catch { setStatus({ status: "disconnected" }); }
    finally { setLoading(false); }
  }, []);

  const loadFolders = useCallback(async () => {
    try {
      const r = await api.get(API_ENDPOINTS.emails.folders);
      const data = (r as any)?.data ?? r ?? [];
      if (Array.isArray(data) && data.length > 0) setFolders(data);
    } catch {}
  }, []);

  const loadEmails = useCallback(async (path: string) => {
    setLoadingList(true);
    try {
      const r = await api.get(`${API_ENDPOINTS.emails.list}?folder=${encodeURIComponent(path)}`);
      const d = (r as any)?.data ?? r;
      setEmails(d.emails || []);
    } catch { toast.error("Error al cargar emails"); }
    finally { setLoadingList(false); setSelectedIds(new Set()); setSelectMode(false); }
  }, []);

  /* ── actions ── */
  const doSync = async () => {
    setSyncing(true);
    try {
      // Sync ALL folders in a single connection
      await api.post(API_ENDPOINTS.emails.sync);
      toast.success("Todas las carpetas sincronizadas");
      await loadFolders();
      await loadEmails(folderPath);
    } catch (e: any) { toast.error(e?.response?.data?.message || "Error al sincronizar"); }
    finally { setSyncing(false); }
  };

  const openEmail = async (email: EmailItem) => {
    if (selectMode) { toggleSelect(email._id); return; }
    setLoadingBody(true);
    setSelected(email);
    try {
      const r = await api.get(API_ENDPOINTS.emails.get(email._id));
      const full = (r as any)?.data ?? r;
      setSelected(full);
      if (!email.isRead) {
        await api.patch(API_ENDPOINTS.emails.markRead(email._id), { isRead: true });
        setEmails(prev => prev.map(e => e._id === email._id ? { ...e, isRead: true } : e));
        loadFolders();
      }
    } catch {}
    finally { setLoadingBody(false); }
  };

  const trashFolder = folders.find(f => f.specialUse === "\\Trash");
  const isInTrash = trashFolder ? folderPath === trashFolder.path : false;

  const doDelete = async (id: string) => {
    try {
      await api.delete(API_ENDPOINTS.emails.delete(id));
      toast.success(isInTrash ? "Eliminado permanentemente" : "Movido a papelera");
      setEmails(prev => prev.filter(e => e._id !== id));
      if (selected?._id === id) setSelected(null);
      loadFolders();
    } catch { toast.error("Error al eliminar"); }
  };

  const doBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      await api.post(API_ENDPOINTS.emails.bulkDelete, { ids: Array.from(selectedIds) });
      toast.success(isInTrash ? `${selectedIds.size} email(s) eliminados permanentemente` : `${selectedIds.size} email(s) movidos a papelera`);
      setEmails(prev => prev.filter(e => !selectedIds.has(e._id)));
      if (selected && selectedIds.has(selected._id)) setSelected(null);
      setSelectedIds(new Set());
      setSelectMode(false);
      loadFolders();
    } catch { toast.error("Error al eliminar"); }
    finally { setBulkDeleting(false); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visible.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visible.map(e => e._id)));
    }
  };

  const doSend = async () => {
    if (!form.to || !form.subject) { toast.error("Destinatario y asunto son obligatorios"); return; }
    setComposing(true);
    try {
      await api.post(API_ENDPOINTS.emails.send, {
        to: form.to.split(",").map(e => ({ address: e.trim() })),
        cc: form.cc ? form.cc.split(",").map(e => ({ address: e.trim() })) : [],
        bcc: form.bcc ? form.bcc.split(",").map(e => ({ address: e.trim() })) : [],
        subject: form.subject,
        htmlBody: form.htmlBody || form.body,
        textBody: form.body,
      });
      toast.success("Email enviado");
      setComposeOpen(false);
      setForm({ to: "", cc: "", bcc: "", subject: "", body: "", htmlBody: "" });
      if (folderPath.toLowerCase().includes("sent")) loadEmails(folderPath);
    } catch (e: any) { toast.error(e?.response?.data?.message || "Error al enviar"); }
    finally { setComposing(false); }
  };

  /* ── CRM actions ── */
  const openCrmCreate = (type: "contact" | "lead" | "deal") => {
    if (!selected) return;
    const senderName = selected.from?.name || selected.from?.address?.split("@")[0] || "";
    const senderEmail = selected.from?.address || "";
    if (type === "contact") {
      setCrmForm({ name: senderName, email: senderEmail, source: "email", notes: `Desde email: ${selected.subject}` });
    } else if (type === "lead") {
      setCrmForm({ title: selected.subject || "Lead desde email", description: `Contacto: ${senderName} <${senderEmail}>`, source: "email" });
    } else {
      setCrmForm({ title: selected.subject || "Deal desde email", description: `Contacto: ${senderName} <${senderEmail}>`, value: 0, currency: "USD" });
    }
    setCrmModal({ type, email: selected });
  };

  const submitCrmCreate = async () => {
    if (!crmModal) return;
    setCrmCreating(true);
    try {
      if (crmModal.type === "contact") {
        await api.post(API_ENDPOINTS.contacts.create, crmForm);
        toast.success("Contacto creado exitosamente");
      } else if (crmModal.type === "lead") {
        // Lead requires contactId — first create or find the contact
        let contactId: string;
        try {
          const cRes = await api.post(API_ENDPOINTS.contacts.create, {
            name: crmModal.email.from?.name || crmModal.email.from?.address?.split("@")[0],
            email: crmModal.email.from?.address,
            source: "email",
          });
          contactId = ((cRes as any)?.data ?? cRes)?._id;
        } catch {
          toast.error("Primero crea un contacto para este remitente");
          setCrmCreating(false);
          return;
        }
        await api.post(API_ENDPOINTS.leads.create, { ...crmForm, contactId });
        toast.success("Lead creado exitosamente");
      } else {
        // Deal requires contactId
        let contactId: string;
        try {
          const cRes = await api.post(API_ENDPOINTS.contacts.create, {
            name: crmModal.email.from?.name || crmModal.email.from?.address?.split("@")[0],
            email: crmModal.email.from?.address,
            source: "email",
          });
          contactId = ((cRes as any)?.data ?? cRes)?._id;
        } catch {
          toast.error("Primero crea un contacto para este remitente");
          setCrmCreating(false);
          return;
        }
        await api.post(API_ENDPOINTS.deals.create, { ...crmForm, contactId });
        toast.success("Deal creado exitosamente");
      }
      setCrmModal(null);
    } catch (e: any) { toast.error(e?.response?.data?.message || "Error al crear"); }
    finally { setCrmCreating(false); }
  };

  /* ── filtering ── */
  const visible = useMemo(() => {
    let list = emails;
    if (filter === "read") list = list.filter(e => e.isRead);
    if (filter === "unread") list = list.filter(e => !e.isRead);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.subject?.toLowerCase().includes(q) ||
        e.from?.address?.toLowerCase().includes(q) ||
        e.from?.name?.toLowerCase().includes(q) ||
        e.preview?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [emails, filter, search]);

  /* ── select folder helper ── */
  const selectFolder = (f: FolderItem) => {
    setFolderPath(f.path);
    setFolderName(f.name);
    setSelected(null);
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  /* ── effects ── */
  useEffect(() => {
    loadStatus();
    loadFolders(); // Load folders immediately, don't wait for status
  }, [loadStatus, loadFolders]);

  useEffect(() => {
    if (status?.status === "connected") { loadEmails(folderPath); }
  }, [status, folderPath, loadEmails]);

  // Reload folders when folder path changes (for count updates)
  useEffect(() => {
    if (status?.status === "connected") loadFolders();
  }, [folderPath, status, loadFolders]);

  useEffect(() => {
    if (!socket) return;
    const u1 = socket.subscribe("email.received", (d: any) => {
      if (d.folder === folderPath) setEmails(prev => [d, ...prev]);
      loadFolders();
    });
    const u2 = socket.subscribe("email.updated", (d: any) => {
      setEmails(prev => prev.map(e => e._id === d._id ? { ...e, ...d } : e));
    });
    const u3 = socket.subscribe("email.sync.complete", () => {
      loadFolders();
      loadEmails(folderPath);
    });
    const u4 = socket.subscribe("email.sent", () => {
      loadFolders();
      if (folders.find(f => f.specialUse === "\\Sent" && f.path === folderPath)) {
        loadEmails(folderPath);
      }
    });
    const u5 = socket.subscribe("email.deleted", () => {
      loadFolders();
    });
    const u6 = socket.subscribe("email.moved", (d: any) => {
      // Email moved to another folder (e.g., to Trash)
      // Remove from current view if we're viewing the source folder
      setEmails(prev => prev.filter(e => e._id !== d.id));
      // If we're viewing the target folder, add it there
      if (d.toFolder === folderPath && d.email) {
        setEmails(prev => [d.email, ...prev]);
      }
      loadFolders(); // Update folder counts
    });
    return () => { u1(); u2(); u3(); u4(); u5(); u6(); };
  }, [socket, folderPath, loadFolders, loadEmails, folders]);

  /* ── loading / not connected ── */
  if (loading) return <div className="h-full flex items-center justify-center"><Spinner size="lg" /></div>;

  if (status?.status !== "connected") {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Mail size={24} /></div>
          <h2 className="text-xl font-semibold">Configura tu Email</h2>
          <p className="text-sm text-default-500">Conecta tu cuenta SMTP/IMAP en Integraciones para usar el Inbox.</p>
          <Button as={Link} href="/integrations" color="primary" startContent={<Settings size={16} />}>Ir a Integraciones</Button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════ */
  /* RENDER                                                    */
  /* ══════════════════════════════════════════════════════════ */
  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-content1 -m-6">

      {/* ─── COL 1: Sidebar ─── */}
      <aside className="w-[200px] shrink-0 bg-content1 border-r border-divider flex flex-col">
        <div className="p-3">
          <Button color="primary" className="w-full" size="sm" startContent={<Plus size={14} />} onPress={() => setComposeOpen(true)}>
            Nuevo Email
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {filterFolders(folders).map(f => (
            <button
              key={f.path}
              onClick={() => selectFolder(f)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                folderPath === f.path
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-default-600 hover:bg-default-100"
              }`}
            >
              {getFolderIcon(f)}
              <span className="flex-1 text-left truncate">{f.name}</span>
              {f.unread > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  folderPath === f.path ? "bg-primary text-white" : "bg-primary/10 text-primary"
                }`}>{f.unread}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* ─── COL 2: Email list ─── */}
      <section className="w-[340px] shrink-0 bg-content1 border-r border-divider flex flex-col">
        {/* header */}
        <div className="p-3 border-b border-divider space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">{folderName}</h2>
            <div className="flex items-center gap-1">
              <span className="text-xs text-default-400">{visible.length}/{emails.length}</span>
              <Button size="sm" variant="light" isIconOnly
                className="min-w-7 w-7 h-7" title="Selección múltiple"
                color={selectMode ? "primary" : "default"}
                onPress={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}>
                <CheckSquare size={14} />
              </Button>
              <Button size="sm" variant="light" isIconOnly isLoading={syncing} onPress={doSync}
                className="min-w-7 w-7 h-7" title="Sincronizar con servidor">
                <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>

          {/* Bulk actions bar */}
          {selectMode && (
            <div className="flex items-center gap-2 bg-primary/5 rounded-lg px-2 py-1.5">
              <Checkbox
                size="sm"
                isSelected={selectedIds.size === visible.length && visible.length > 0}
                isIndeterminate={selectedIds.size > 0 && selectedIds.size < visible.length}
                onValueChange={toggleSelectAll}
              />
              <span className="text-xs text-default-600 flex-1">
                {selectedIds.size > 0 ? `${selectedIds.size} seleccionados` : "Seleccionar todos"}
              </span>
              {selectedIds.size > 0 && (
                <Button size="sm" color="danger" variant="flat" isLoading={bulkDeleting}
                  startContent={<Trash size={12} />} onPress={doBulkDelete} className="h-7 text-xs">
                  Eliminar
                </Button>
              )}
            </div>
          )}

          <Input size="sm" placeholder="Buscar..." value={search} onValueChange={setSearch}
            startContent={<Search size={14} className="text-default-400" />}
            isClearable onClear={() => setSearch("")}
          />
          <div className="flex gap-1">
            {(["all", "unread", "read"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-1 text-xs py-1 rounded-md transition-colors ${
                  filter === f ? "bg-primary text-white font-semibold" : "bg-default-100 text-default-600 hover:bg-default-200"
                }`}
              >{f === "all" ? "Todos" : f === "unread" ? "No leídos" : "Leídos"}</button>
            ))}
          </div>
        </div>

        {/* list */}
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex items-center justify-center h-32"><Spinner /></div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-default-400">
              <Mail size={28} className="mb-2 opacity-40" />
              <p className="text-xs">No hay emails</p>
            </div>
          ) : visible.map(email => (
            <div key={email._id}
              onClick={() => openEmail(email)}
              className={`w-full text-left px-3 py-3 border-b border-divider/40 transition-colors cursor-pointer flex items-start gap-2 ${
                selected?._id === email._id ? "bg-primary/8 border-l-3 border-l-primary" : "hover:bg-default-50"
              }`}
            >
              {selectMode && (
                <div className="pt-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                  <Checkbox size="sm" isSelected={selectedIds.has(email._id)}
                    onValueChange={() => toggleSelect(email._id)} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {/* row 1: sender + date */}
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`text-sm truncate ${!email.isRead ? "font-bold text-foreground" : "text-default-700"}`}>
                    {!email.isRead && <span className="inline-block w-2 h-2 rounded-full bg-primary mr-1.5 align-middle" />}
                    {email.from?.name || email.from?.address}
                  </span>
                  <span className="text-[11px] text-default-400 whitespace-nowrap shrink-0">{fmtDate(email.date)}</span>
                </div>
                {/* row 2: subject */}
                <p className={`text-sm truncate ${!email.isRead ? "font-semibold" : "text-default-600"}`}>
                  {email.subject || "(Sin asunto)"}
                </p>
                {/* row 3: preview */}
                <p className="text-xs text-default-400 truncate mt-0.5">
                  {email.preview || ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── COL 3: Reader ─── */}
      <main className="flex-1 min-w-0 flex flex-col bg-content1 overflow-hidden">
        {selected ? (
          <>
            {/* toolbar */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-divider bg-content1 shrink-0">
              <Button size="sm" variant="light" startContent={<Reply size={14} />}>Responder</Button>
              <Button size="sm" variant="light" startContent={<ReplyAll size={14} />}>Resp. todos</Button>
              <Button size="sm" variant="light" startContent={<Forward size={14} />}>Reenviar</Button>
              <div className="flex-1" />

              {/* CRM dropdown */}
              <Dropdown>
                <DropdownTrigger>
                  <Button size="sm" variant="flat" color="secondary" startContent={<UserPlus size={14} />}>
                    Crear en CRM
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Crear en CRM">
                  <DropdownItem key="contact" startContent={<UserPlus size={14} />}
                    onPress={() => openCrmCreate("contact")}>
                    Crear Contacto
                  </DropdownItem>
                  <DropdownItem key="lead" startContent={<Target size={14} />}
                    onPress={() => openCrmCreate("lead")}>
                    Crear Lead
                  </DropdownItem>
                  <DropdownItem key="deal" startContent={<DollarSign size={14} />}
                    onPress={() => openCrmCreate("deal")}>
                    Crear Deal
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <Button size="sm" variant="light" isIconOnly><Star size={14} className={selected.isFlagged ? "fill-warning text-warning" : ""} /></Button>
              <Button size="sm" variant="light" isIconOnly><Archive size={14} /></Button>
              <Button size="sm" variant="light" color="danger" isIconOnly onPress={() => doDelete(selected._id)}><Trash size={14} /></Button>
            </div>

            {/* header */}
            <div className="px-6 py-4 border-b border-divider shrink-0">
              <h1 className="text-lg font-bold mb-3">{selected.subject || "(Sin asunto)"}</h1>
              <div className="flex items-start gap-3">
                <Avatar size="sm" name={selected.from?.name || selected.from?.address} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{selected.from?.name || selected.from?.address}</span>
                    <span className="text-xs text-default-400">&lt;{selected.from?.address}&gt;</span>
                  </div>
                  <div className="text-xs text-default-400 mt-0.5">
                    <span>Para: {selected.to?.map(t => t.name || t.address).join(", ")}</span>
                    {selected.cc?.length ? <span className="ml-3">CC: {selected.cc.map(c => c.name || c.address).join(", ")}</span> : null}
                  </div>
                  <span className="text-xs text-default-400">
                    {new Date(selected.date).toLocaleString("es", { dateStyle: "long", timeStyle: "short" })}
                  </span>
                </div>
              </div>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {loadingBody ? (
                <div className="flex items-center justify-center h-32"><Spinner /></div>
              ) : selected.htmlBody ? (
                <HtmlEmailFrame html={selected.htmlBody} />
              ) : selected.textBody ? (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-default-700 p-6">{selected.textBody}</pre>
              ) : (
                <div className="text-center py-12 text-default-400">
                  <Mail size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin contenido</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-default-400">
            <div className="text-center">
              <Mail size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">Selecciona un email para leerlo</p>
            </div>
          </div>
        )}
      </main>

      {/* ─── Compose Modal ─── */}
      <Modal size="3xl" isOpen={composeOpen} onOpenChange={setComposeOpen} classNames={{ base: "max-h-[90vh]", body: "p-0" }}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-divider px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Send size={14} className="text-primary" />
                  </div>
                  <span className="text-base font-semibold">Nuevo mensaje</span>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col">
                  {/* To field */}
                  <div className="flex items-center border-b border-divider px-5 py-1.5">
                    <span className="text-sm text-default-400 w-12 shrink-0">Para</span>
                    <input
                      className="flex-1 bg-transparent outline-none text-sm py-1.5"
                      placeholder="destinatario@email.com"
                      value={form.to}
                      onChange={e => setForm({ ...form, to: e.target.value })}
                    />
                    <div className="flex gap-1 shrink-0">
                      {!showCc && (
                        <button className="text-xs text-default-400 hover:text-primary px-1.5 py-0.5 rounded hover:bg-default-100 transition-colors"
                          onClick={() => setShowCc(true)}>Cc</button>
                      )}
                      {!showBcc && (
                        <button className="text-xs text-default-400 hover:text-primary px-1.5 py-0.5 rounded hover:bg-default-100 transition-colors"
                          onClick={() => setShowBcc(true)}>Bcc</button>
                      )}
                    </div>
                  </div>
                  {/* CC field */}
                  {showCc && (
                    <div className="flex items-center border-b border-divider px-5 py-1.5">
                      <span className="text-sm text-default-400 w-12 shrink-0">Cc</span>
                      <input
                        className="flex-1 bg-transparent outline-none text-sm py-1.5"
                        value={form.cc}
                        onChange={e => setForm({ ...form, cc: e.target.value })}
                      />
                      <button className="text-default-300 hover:text-default-500 p-1" onClick={() => { setShowCc(false); setForm({ ...form, cc: "" }); }}>
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {/* BCC field */}
                  {showBcc && (
                    <div className="flex items-center border-b border-divider px-5 py-1.5">
                      <span className="text-sm text-default-400 w-12 shrink-0">Bcc</span>
                      <input
                        className="flex-1 bg-transparent outline-none text-sm py-1.5"
                        value={form.bcc}
                        onChange={e => setForm({ ...form, bcc: e.target.value })}
                      />
                      <button className="text-default-300 hover:text-default-500 p-1" onClick={() => { setShowBcc(false); setForm({ ...form, bcc: "" }); }}>
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {/* Subject */}
                  <div className="flex items-center border-b border-divider px-5 py-1.5">
                    <span className="text-sm text-default-400 w-12 shrink-0">Asunto</span>
                    <input
                      className="flex-1 bg-transparent outline-none text-sm py-1.5 font-medium"
                      placeholder="Asunto del mensaje"
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                    />
                  </div>
                  {/* Editor */}
                  <div className="min-h-[300px]">
                    <RichTextEditor
                      content={form.htmlBody}
                      onChange={html => setForm({ ...form, htmlBody: html, body: html.replace(/<[^>]*>/g, "") })}
                      placeholder="Escribe tu mensaje..."
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="border-t border-divider px-5 py-3 flex items-center justify-between">
                <Button
                  variant="light"
                  color="danger"
                  size="sm"
                  startContent={<Trash2 size={14} />}
                  onPress={() => {
                    setForm({ to: "", cc: "", bcc: "", subject: "", body: "", htmlBody: "" });
                    onClose();
                  }}
                >
                  Descartar
                </Button>
                <Button
                  color="primary"
                  size="md"
                  isLoading={composing}
                  startContent={!composing ? <Send size={14} /> : undefined}
                  onPress={doSend}
                  className="px-6 font-semibold"
                >
                  Enviar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ─── CRM Create Modal ─── */}
      <Modal size="lg" isOpen={!!crmModal} onOpenChange={(open) => { if (!open) setCrmModal(null); }}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                {crmModal?.type === "contact" && <><UserPlus size={18} /> Crear Contacto</>}
                {crmModal?.type === "lead" && <><Target size={18} /> Crear Lead</>}
                {crmModal?.type === "deal" && <><DollarSign size={18} /> Crear Deal</>}
              </ModalHeader>
              <ModalBody>
                <p className="text-xs text-default-400 mb-3">
                  Desde: <strong>{crmModal?.email.from?.name || crmModal?.email.from?.address}</strong>
                  {" "}&lt;{crmModal?.email.from?.address}&gt;
                </p>

                {crmModal?.type === "contact" && (
                  <div className="space-y-3">
                    <Input label="Nombre" value={crmForm.name || ""}
                      onValueChange={v => setCrmForm({ ...crmForm, name: v })} />
                    <Input label="Email" value={crmForm.email || ""}
                      onValueChange={v => setCrmForm({ ...crmForm, email: v })} />
                    <Input label="Teléfono" placeholder="+1234567890" value={crmForm.phone || ""}
                      onValueChange={v => setCrmForm({ ...crmForm, phone: v })} />
                    <Input label="Empresa" value={crmForm.company || ""}
                      onValueChange={v => setCrmForm({ ...crmForm, company: v })} />
                    <Input label="Notas" value={crmForm.notes || ""}
                      onValueChange={v => setCrmForm({ ...crmForm, notes: v })} />
                  </div>
                )}

                {crmModal?.type === "lead" && (
                  <div className="space-y-3">
                    <Input label="Título del Lead" value={crmForm.title || ""}
                      onValueChange={v => setCrmForm({ ...crmForm, title: v })} />
                    <Input label="Descripción" value={crmForm.description || ""}
                      onValueChange={v => setCrmForm({ ...crmForm, description: v })} />
                    <Input label="Valor estimado" type="number" value={crmForm.estimatedValue?.toString() || "0"}
                      onValueChange={v => setCrmForm({ ...crmForm, estimatedValue: Number(v) })} />
                    <Input label="Notas" value={crmForm.notes || ""}
                      onValueChange={v => setCrmForm({ ...crmForm, notes: v })} />
                  </div>
                )}

                {crmModal?.type === "deal" && (
                  <div className="space-y-3">
                    <Input label="Título del Deal" value={crmForm.title || ""}
                      onValueChange={v => setCrmForm({ ...crmForm, title: v })} />
                    <Input label="Descripción" value={crmForm.description || ""}
                      onValueChange={v => setCrmForm({ ...crmForm, description: v })} />
                    <div className="flex gap-3">
                      <Input label="Valor" type="number" value={crmForm.value?.toString() || "0"}
                        onValueChange={v => setCrmForm({ ...crmForm, value: Number(v) })}
                        classNames={{ base: "flex-1" }} />
                      <Input label="Moneda" value={crmForm.currency || "USD"}
                        onValueChange={v => setCrmForm({ ...crmForm, currency: v })}
                        classNames={{ base: "w-24" }} />
                    </div>
                    <Input label="Notas" value={crmForm.notes || ""}
                      onValueChange={v => setCrmForm({ ...crmForm, notes: v })} />
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Cancelar</Button>
                <Button color="primary" isLoading={crmCreating} onPress={submitCrmCreate}>
                  {crmModal?.type === "contact" ? "Crear Contacto" :
                   crmModal?.type === "lead" ? "Crear Lead" : "Crear Deal"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
