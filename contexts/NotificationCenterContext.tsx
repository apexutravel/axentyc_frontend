"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import { api } from "@/lib/api";

export type NotificationType = "message" | "conversation" | "email" | "system";

export interface ChatNotification {
  id: string;
  conversationId?: string;
  type: NotificationType;
  title: string;
  message: string;
  senderName?: string;
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
    console.log("[Notification] Sound played");
  } catch (e) {
    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTAAAAAA//8AAP//AAD//wAA//8AAP//AAD//wAA"
      );
      audio.volume = 1;
      void audio.play();
      console.log("[Notification] Sound fallback played");
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
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const activeConvIdRef = useRef<string | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const globalActiveRef = useRef<{ id: string | null; isActive: boolean }>({ id: null, isActive: false });
  const setActiveConversationId = useCallback((conversationId: string | null) => {
    console.log("[Notification] 🎯 setActiveConversationId:", conversationId);
    activeConvIdRef.current = conversationId;
    setActiveConvId(conversationId);
  }, []);

  const pushNotification = useCallback((next: ChatNotification) => {
    console.log("[Notification] pushNotification called:", {
      type: next?.type,
      conversationId: next?.conversationId,
      activeConvId: activeConvIdRef.current,
      willSuppress: next?.type === "message" && 
                    next?.conversationId && 
                    activeConvIdRef.current && 
                    String(next.conversationId) === String(activeConvIdRef.current)
    });
    
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
        console.log("[Notification] ✅ SUPPRESSED (active conversation local/global):", next.conversationId);
        return;
      }
    }
    
    console.log("[Notification] ⚠️ NOT SUPPRESSED - will play sound and show notification");
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
        // console.log("[Notification] ℹ️ Broadcast received:", globalActiveRef.current);
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
      console.log("[Notification] Setting tenant ID:", tid);
      setTenantId(tid);
    } else {
      console.log("[Notification] Tenant ID not available yet");
    }
  }, [tenant?.id, user?.tenantId, setTenantId]);

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
          console.log("[FCM] Token registered successfully");
        }

        unsubscribeForeground = firebase.onForegroundMessage((payload: any) => {
          console.log("[FCM] Foreground message:", payload);
          
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
            console.log("[FCM] ✅ SUPPRESSED (active conversation local/global):", conversationId);
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
      console.log("[Notification] message.received event:", JSON.stringify(data, null, 2));
      const conversationId = data?.conversationId || data?.message?.conversationId;
      const message = data?.message || data;
      
      // Use contact name if available, otherwise use senderName from message
      const contactName = data?.contactId?.name || data?.contact?.name;
      const senderName = contactName || message?.senderName || "Visitante";
      
      if (!conversationId || !message?.content) {
        console.log("[Notification] Skipped - missing conversationId or content");
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
        createdAt: message.createdAt || new Date().toISOString(),
        read: false,
      };
      
      console.log("[Notification] Created grouped notification:", notification);
      pushNotification(notification);
    };

    const handleConversationCreated = (data: any) => {
      console.log("[Notification] conversation.created event:", JSON.stringify(data, null, 2));
      const conversationId = data?._id || data?.conversationId;
      const contactName = data?.contactId?.name || "Visitante";
      
      const notification: ChatNotification = {
        id: `conv:${conversationId}:new`,
        conversationId: conversationId ? String(conversationId) : undefined,
        type: "conversation",
        title: "Nueva conversación",
        message: `${contactName} inició un chat`,
        senderName: contactName,
        createdAt: new Date().toISOString(),
        read: false,
      };
      console.log("[Notification] Created conversation notification:", notification);
      pushNotification(notification);
    };

    const handleContactEnriched = (data: any) => {
      console.log("[Notification] contact.enriched event:", JSON.stringify(data, null, 2));
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

    console.log("[Notification] Registering socket event listeners");
    const handleEmailReceived = (data: any) => {
      console.log("[Notification] email.received event:", data?.subject);
      const senderName = data?.from?.name || data?.from?.address || "Remitente";
      const subject = data?.subject || "(Sin asunto)";
      const notification: ChatNotification = {
        id: `email:${data?._id || Date.now()}`,
        type: "email",
        title: `Email de ${senderName}`,
        message: subject,
        senderName,
        createdAt: data?.date || new Date().toISOString(),
        read: false,
      };
      pushNotification(notification);
    };

    const handleEmailSyncComplete = (data: any) => {
      if (data?.newEmails > 0) {
        const notification: ChatNotification = {
          id: `email-sync:${Date.now()}`,
          type: "email",
          title: "Nuevos emails sincronizados",
          message: `${data.newEmails} nuevo${data.newEmails > 1 ? "s" : ""} email${data.newEmails > 1 ? "s" : ""}`,
          createdAt: new Date().toISOString(),
          read: false,
        };
        pushNotification(notification);
      }
    };

    const cleanup1 = subscribe("message.received", handleIncomingMessage);
    const cleanup2 = subscribe("conversation.created", handleConversationCreated);
    const cleanup3 = subscribe("contact.enriched", handleContactEnriched);
    const cleanup4 = subscribe("email.received", handleEmailReceived);
    const cleanup5 = subscribe("email.sync.complete", handleEmailSyncComplete);

    return () => {
      console.log("[Notification] Cleaning up event listeners");
      cleanup1();
      cleanup2();
      cleanup3();
      cleanup4();
      cleanup5();
    };
  }, [subscribe, pushNotification]);

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

  const unreadCount = useMemo(
    () => notifications.reduce((total, item) => total + (item.read ? 0 : 1), 0),
    [notifications]
  );

  const filteredNotifications = useMemo(
    () => activeFilter === "all" ? notifications : notifications.filter((n) => n.type === activeFilter),
    [notifications, activeFilter]
  );

  const value = useMemo(
    () => ({
      notifications,
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
    [notifications, unreadCount, activeFilter, filteredNotifications, markAsRead, markAllAsRead, markConversationRead, clearNotifications, setActiveConversationId]
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
