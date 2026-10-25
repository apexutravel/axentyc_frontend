"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import { useWorkspaces } from "@/contexts/WorkspaceContext";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";

export type NotificationType = "message" | "conversation" | "email" | "system";

export interface ChatNotification {
  id: string;
  conversationId?: string;
  type: NotificationType;
  title: string;
  message: string;
  senderName?: string;
  platform?: string;
  pageName?: string;
  /** Company (workspace) the notification belongs to */
  workspaceId?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationCenterContextType {
  notifications: ChatNotification[];
  unreadCount: number;
  activeFilter: NotificationType | "all";
  setActiveFilter: (filter: NotificationType | "all") => void;
  filteredNotifications: ChatNotification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  markConversationRead: (conversationId: string) => void;
  clearNotifications: () => void;
  setActiveConversationId: (conversationId: string | null) => void;
}

const STORAGE_KEY = "axentyc_notifications";
const MAX_NOTIFICATIONS = 50;

const NotificationCenterContext = createContext<NotificationCenterContextType | undefined>(undefined);

function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);

    // Second tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1174, ctx.currentTime + 0.18);
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc2.start(ctx.currentTime + 0.18);
    osc2.stop(ctx.currentTime + 0.4);

    osc2.onended = () => ctx.close();
    
  } catch (e) {
    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTAAAAAA//8AAP//AAD//wAA//8AAP//AAD//wAA"
      );
      audio.volume = 1;
      void audio.play();
      
    } catch {
      console.warn("[Notification] Sound failed:", e);
    }
  }
}

function sendDesktopNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (document.visibilityState === "visible") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/icon", tag: "axentyc-chat" });
  } catch {
    // notification not supported (e.g. some mobile browsers)
  }
}

function createChatNotification(data: any): ChatNotification | null {
  const payload = data?.message || data;
  const conversationId = data?.conversationId || payload?.conversationId;
  const content = payload?.content;

  if (!content || typeof content !== "string") return null;
  if (payload?.direction && payload.direction !== "inbound") return null;

  const rawId = payload?._id || `${conversationId || "unknown"}:${payload?.createdAt || Date.now()}:${content.slice(0, 24)}`;

  return {
    id: String(rawId),
    conversationId: conversationId ? String(conversationId) : undefined,
    type: "message" as NotificationType,
    title: payload?.senderName || "Nuevo mensaje",
    message: content,
    senderName: payload?.senderName,
    createdAt: payload?.createdAt || new Date().toISOString(),
    read: false,
  };
}

export function NotificationCenterProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotificationType | "all">("all");
  const permissionRequested = useRef(false);
  const { tenant, user } = useAuth();
  const { subscribe, setTenantId, isConnected, tenantJoined } = useSocket();
  const { activeWorkspaceId, hasWorkspace } = useWorkspaces();
  const activeWorkspaceRef = useRef<string | null>(null);
  activeWorkspaceRef.current = activeWorkspaceId;
  // Realtime events are broadcast per account: keep only those of the active workspace
  const isForActiveWorkspace = (workspaceId?: string | null) =>
    !workspaceId || !activeWorkspaceRef.current || String(workspaceId) === activeWorkspaceRef.current;
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const activeConvIdRef = useRef<string | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const globalActiveRef = useRef<{ id: string | null; isActive: boolean }>({ id: null, isActive: false });
  const setActiveConversationId = useCallback((conversationId: string | null) => {
    
    activeConvIdRef.current = conversationId;
    setActiveConvId(conversationId);
  }, []);

  const pushNotification = useCallback((next: ChatNotification) => {
    
    
    if (next?.type === "message" && next?.conversationId) {
      const isLocalActive = !!(
        activeConvIdRef.current &&
        String(next.conversationId) === String(activeConvIdRef.current) &&
        typeof document !== 'undefined' && document.visibilityState === 'visible'
      );
      const isGlobalActive = !!(
        globalActiveRef.current?.isActive &&
        String(next.conversationId) === String(globalActiveRef.current?.id)
      );
      if (isLocalActive || isGlobalActive) {
        
        return;
      }
    }
    
    
    setNotifications((prev) => {
      // Group by conversation: replace existing notification for same conversation
      if (next.conversationId) {
        const filtered = prev.filter(n => n.conversationId !== next.conversationId);
        return [next, ...filtered].slice(0, MAX_NOTIFICATIONS);
      }
      // For non-conversation notifications, check duplicates
      const isDuplicate = prev.some((item) => item.id === next.id);
      if (isDuplicate) return prev;
      return [next, ...prev].slice(0, MAX_NOTIFICATIONS);
    });
    playNotificationSound();
    sendDesktopNotification(next.title, next.message);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || permissionRequested.current) return;
    if ("Notification" in window && Notification.permission === "default") {
      permissionRequested.current = true;
      Notification.requestPermission();
    }
  }, []);

  // Initialize BroadcastChannel to inform SW of active conversation state
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      bcRef.current = new BroadcastChannel("cch-active-conv");
      bcRef.current.onmessage = (event: MessageEvent) => {
        const data = (event?.data || {}) as { id?: string | null; isActive?: boolean };
        globalActiveRef.current = { id: data?.id || null, isActive: Boolean(data?.isActive) };
      };
    } catch (e) {
      console.warn("[Notification] BroadcastChannel not available:", e);
      bcRef.current = null;
    }
    const post = () => {
      try {
        bcRef.current?.postMessage({
          id: activeConvIdRef.current,
          isActive: Boolean(activeConvIdRef.current) && document.visibilityState === "visible",
        });
        if (navigator?.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "cch-active-conv",
            id: activeConvIdRef.current,
            isActive: Boolean(activeConvIdRef.current) && document.visibilityState === "visible",
          });
        }
      } catch {}
    };
    // Post immediately and on visibility changes
    post();
    const onVis = () => post();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      try { bcRef.current?.close?.(); } catch {}
      bcRef.current = null;
    };
  }, []);

  // Re-broadcast whenever active conversation changes
  useEffect(() => {
    try {
      bcRef.current?.postMessage({
        id: activeConvId,
        isActive: Boolean(activeConvId) && document.visibilityState === "visible",
      });
      if (navigator?.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "cch-active-conv",
          id: activeConvId,
          isActive: Boolean(activeConvId) && document.visibilityState === "visible",
        });
      }
    } catch {}
  }, [activeConvId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ChatNotification[];
      if (!Array.isArray(parsed)) return;
      setNotifications(
        parsed
          .filter((item) => item && item.id && item.message)
          .slice(0, MAX_NOTIFICATIONS)
      );
    } catch {
      // ignore malformed local storage
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    const tid = tenant?.id || user?.tenantId;
    if (tid) {
      
      setTenantId(tid);
    } else {
      
    }
  }, [tenant?.id, user?.tenantId, setTenantId]);

  // Load unread conversations on mount to create notifications for missed messages
  useEffect(() => {
    if (!tenant?.id || !hasWorkspace || !activeWorkspaceId) return;
    
    const loadUnreadConversations = async () => {
      try {
        
        const params = new URLSearchParams();
        params.set("channels", "web_chat,facebook,instagram,whatsapp");
        const data = await api.get(`${API_ENDPOINTS.conversations.list}?${params.toString()}`);
        const conversations = ((data as any)?.data ?? data) as any[];
        
        
        
        if (!Array.isArray(conversations)) return;
        
        const unreadConversations = conversations.filter((c) => (c?.unreadCount || 0) > 0);
        
        
        unreadConversations.forEach((conv) => {
          // The API returns lastMessage as plain text (older payloads sent an object)
          const lastMsg = conv?.lastMessage && typeof conv.lastMessage === "object" ? conv.lastMessage : {};
          const name =
            conv?.contactId?.name ||
            conv?.contact?.name ||
            conv?.contactId?.socialProfiles?.instagram?.username ||
            conv?.contactId?.socialProfiles?.facebook?.username ||
            lastMsg?.senderName ||
            "Visitante";
          const content = (
            (typeof conv?.lastMessage === "string" ? conv.lastMessage : "") ||
            lastMsg?.content ||
            conv?.subject ||
            ""
          ).toString();
          const platform = (conv?.channel || "").toLowerCase();
          const pageName = conv?.metadata?.pageName;

          const notification: ChatNotification = {
            id: `unread:${conv._id}`,
            conversationId: conv._id,
            type: "message",
            title: `Nuevo mensaje de ${name}`,
            message: content.substring(0, 100),
            senderName: name,
            platform: platform || undefined,
            pageName: pageName,
            workspaceId: conv?.workspaceId ? String(conv.workspaceId) : activeWorkspaceId,
            createdAt: lastMsg?.createdAt || conv?.lastMessageAt || conv?.updatedAt || new Date().toISOString(),
            read: false,
          };

          
          pushNotification(notification);
        });
      } catch (error) {
        console.error("[Notification] Error loading unread conversations:", error);
      }
    };
    
    loadUnreadConversations();
  }, [tenant?.id, hasWorkspace, activeWorkspaceId, pushNotification]);

  // Register FCM token and listen to foreground messages
  useEffect(() => {
    if (!tenant?.id) return;
    let unsubscribeForeground: (() => void) | undefined;

    const initFCM = async () => {
      try {
        const firebase = await import("@/lib/firebase");
        
        const token = await firebase.requestNotificationPermission();
        if (token) {
          await api.post("/users/fcm-token", { token });
          
        }

        unsubscribeForeground = firebase.onForegroundMessage((payload: any) => {
          
          
          const conversationId = payload.data?.conversationId;
          
          // Suppress FCM notifications for active conversation
          const isLocalActive = !!(
            conversationId && activeConvIdRef.current && String(conversationId) === String(activeConvIdRef.current) &&
            typeof document !== 'undefined' && document.visibilityState === 'visible'
          );
          const isGlobalActive = !!(
            conversationId && globalActiveRef.current?.isActive && String(conversationId) === String(globalActiveRef.current?.id)
          );
          if (isLocalActive || isGlobalActive) {
            
            return;
          }
          
          const notification: ChatNotification = {
            id: `fcm:${Date.now()}`,
            conversationId,
            type: "message",
            title: payload.notification?.title || "Nuevo mensaje",
            message: payload.notification?.body || "",
            senderName: payload.data?.senderName,
            createdAt: new Date().toISOString(),
            read: false,
          };
          pushNotification(notification);
        });
      } catch (error) {
        console.warn("[FCM] Firebase initialization failed (non-critical):", error);
      }
    };

    initFCM();

    return () => {
      unsubscribeForeground?.();
    };
  }, [tenant?.id, pushNotification]);

  // Register socket event listeners — subscribe() stores them in a registry
  // and re-applies on reconnect, so no isConnected guard needed
  useEffect(() => {
    const handleIncomingMessage = (data: any) => {
      
      const conversationId = data?.conversationId || data?.message?.conversationId;
      const message = data?.message || data;
      if (message?.metadata?.isComment) return;
      const messageWorkspaceId = message?.workspaceId || data?.workspaceId;
      if (!isForActiveWorkspace(messageWorkspaceId)) return;
      
      // Use contact name if available, otherwise use senderName from message
      const contactName =
        data?.contactId?.name ||
        data?.contactId?.username ||
        data?.contact?.name ||
        message?.senderName;
      const senderName = contactName || "Visitante";
      
      if (!conversationId || !message?.content) {
        
        return;
      }

      // Create grouped notification: one per conversation, not per message
      const notification: ChatNotification = {
        id: `conv:${conversationId}:${Date.now()}`,
        conversationId: String(conversationId),
        type: "message",
        title: `Nuevo mensaje de ${senderName}`,
        message: message.content.substring(0, 100),
        senderName,
        platform: message?.metadata?.platform || (data?.channel || '').toLowerCase() || undefined,
        pageName: data?.pageName || message?.metadata?.pageName,
        workspaceId: messageWorkspaceId ? String(messageWorkspaceId) : undefined,
        createdAt: message.createdAt || new Date().toISOString(),
        read: false,
      };
      
      
      pushNotification(notification);
    };

    const handleConversationCreated = (data: any) => {
      
      if (data?.metadata?.isComment) return;
      if (!isForActiveWorkspace(data?.workspaceId)) return;
      const conversationId = data?._id || data?.conversationId;
      const contactName = data?.contactId?.name || "Visitante";
      
      const notification: ChatNotification = {
        id: `conv:${conversationId}:new`,
        conversationId: conversationId ? String(conversationId) : undefined,
        type: "conversation",
        title: "Nueva conversación",
        message: `${contactName} inició un chat`,
        senderName: contactName,
        workspaceId: data?.workspaceId ? String(data.workspaceId) : undefined,
        createdAt: new Date().toISOString(),
        read: false,
      };
      
      pushNotification(notification);
    };

    const handleContactEnriched = (data: any) => {
      
      const contactId = data?._id || data?.contactId;
      const newName = data?.name;
      
      if (!contactId || !newName) return;
      
      // Update existing notifications with the new contact name
      setNotifications((prev) => 
        prev.map((notif) => {
          // Find notifications for conversations with this contact
          // We need to match by checking if the notification is for a conversation with this contact
          // Since we don't have contactId in notifications, we update based on senderName pattern
          if (notif.senderName?.toLowerCase().startsWith('visitor')) {
            return {
              ...notif,
              senderName: newName,
              title: notif.type === 'message' 
                ? `Nuevo mensaje de ${newName}`
                : notif.title.replace(notif.senderName || '', newName),
              message: notif.type === 'conversation'
                ? `${newName} inició un chat`
                : notif.message,
            };
          }
          return notif;
        })
      );
    };

    
    const handleEmailReceived = (data: any) => {
      if (!isForActiveWorkspace(data?.workspaceId)) return;
      if (data?.folder && data.folder !== "INBOX") return;
      
      const senderName = data?.from?.name || data?.from?.address || "Remitente";
      const subject = data?.subject || "(Sin asunto)";
      const notification: ChatNotification = {
        id: `email:${data?._id || Date.now()}`,
        type: "email",
        title: `Email de ${senderName}`,
        message: subject,
        senderName,
        workspaceId: data?.workspaceId ? String(data.workspaceId) : undefined,
        createdAt: data?.date || new Date().toISOString(),
        read: false,
      };
      pushNotification(notification);
    };

    const handleEmailSyncComplete = (data: any) => {
      if (!isForActiveWorkspace(data?.workspaceId)) return;
      if (data?.newEmails > 0) {
        const notification: ChatNotification = {
          id: `email-sync:${Date.now()}`,
          type: "email",
          title: data?.accountLabel ? `Nuevos emails en ${data.accountLabel}` : "Nuevos emails sincronizados",
          message: `${data.newEmails} nuevo${data.newEmails > 1 ? "s" : ""} email${data.newEmails > 1 ? "s" : ""}`,
          createdAt: new Date().toISOString(),
          read: false,
        };
        pushNotification(notification);
      }
    };

    const handleTaskDue = (data: any) => {
      if (!isForActiveWorkspace(data?.workspaceId)) return;
      if (data?.assignedTo && user?.id && String(data.assignedTo) !== String(user.id)) return;
      pushNotification({
        id: `task:${data?.taskId}`,
        type: "system",
        title: "Tarea por vencer",
        message: data?.title || "Tienes una tarea pendiente",
        workspaceId: data?.workspaceId ? String(data.workspaceId) : undefined,
        createdAt: new Date().toISOString(),
        read: false,
      });
    };

    // Notifications raised by automations ("send_notification" action)
    const handleServerNotification = (data: any) => {
      if (!isForActiveWorkspace(data?.workspaceId)) return;
      pushNotification({
        id: `auto:${Date.now()}`,
        conversationId: data?.conversationId ? String(data.conversationId) : undefined,
        type: "system",
        title: data?.title || "Automatización",
        message: data?.message || "",
        workspaceId: data?.workspaceId ? String(data.workspaceId) : undefined,
        createdAt: data?.createdAt || new Date().toISOString(),
        read: false,
      });
    };

    const cleanup6 = subscribe("task.due", handleTaskDue);
    const cleanup7 = subscribe("notification", handleServerNotification);
    const cleanup1 = subscribe("message.received", handleIncomingMessage);
    const cleanup2 = subscribe("conversation.created", handleConversationCreated);
    const cleanup3 = subscribe("contact.enriched", handleContactEnriched);
    const cleanup4 = subscribe("email.received", handleEmailReceived);
    const cleanup5 = subscribe("email.sync.complete", handleEmailSyncComplete);

    return () => {
      
      cleanup1();
      cleanup2();
      cleanup3();
      cleanup4();
      cleanup5();
      cleanup6();
      cleanup7();
    };
  }, [subscribe, pushNotification, user?.id]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const markConversationRead = useCallback((conversationId: string) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.conversationId === conversationId ? { ...item, read: true } : item
      )
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Only show the notifications of the active workspace (untagged legacy ones stay visible)
  const visibleNotifications = useMemo(
    () => notifications.filter((n) => !n.workspaceId || n.workspaceId === activeWorkspaceId),
    [notifications, activeWorkspaceId]
  );

  const unreadCount = useMemo(
    () => visibleNotifications.reduce((total, item) => total + (item.read ? 0 : 1), 0),
    [visibleNotifications]
  );

  const filteredNotifications = useMemo(
    () => activeFilter === "all" ? visibleNotifications : visibleNotifications.filter((n) => n.type === activeFilter),
    [visibleNotifications, activeFilter]
  );

  const value = useMemo(
    () => ({
      notifications: visibleNotifications,
      unreadCount,
      activeFilter,
      setActiveFilter,
      filteredNotifications,
      markAsRead,
      markAllAsRead,
      markConversationRead,
      clearNotifications,
      setActiveConversationId,
    }),
    [visibleNotifications, unreadCount, activeFilter, filteredNotifications, markAsRead, markAllAsRead, markConversationRead, clearNotifications, setActiveConversationId]
  );

  return <NotificationCenterContext.Provider value={value}>{children}</NotificationCenterContext.Provider>;
}

export function useNotificationCenter() {
  const context = useContext(NotificationCenterContext);
  if (!context) {
    throw new Error("useNotificationCenter must be used within NotificationCenterProvider");
  }
  return context;
}
