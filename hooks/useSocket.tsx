"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { WS_URL } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";

type EventHandler = (...args: any[]) => void;

interface Subscription {
  event: string;
  handler: EventHandler;
}

interface SocketContextValue {
  isConnected: boolean;
  tenantJoined: boolean;
  emit: (event: string, data: any) => void;
  subscribe: (event: string, handler: EventHandler) => () => void;
  off: (event: string, handler?: EventHandler) => void;
  setTenantId: (tenantId: string) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  joinWidgetAdmin: (conversationId: string) => void;
  leaveWidgetAdmin: (conversationId: string) => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const tenantIdRef = useRef<string | null>(null);
  const subsRef = useRef<Map<string, Subscription>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [tenantJoined, setTenantJoined] = useState(false);
  const [tenantId, setTenantIdState] = useState<string | null>(null);
  const { tenant } = useAuth();

  useEffect(() => {
    console.log("[Socket] Creating connection to:", WS_URL);
    const s = io(WS_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socketRef.current = s;

    s.on("connect", () => {
      console.log("[Socket] ✅ Connected:", s.id);
      setIsConnected(true);

      // Auto-join tenant room on connect / reconnect
      const tid = tenantIdRef.current;
      if (tid) {
        console.log("[Socket] Auto-joining tenant room on connect:", tid);
        s.emit("join:tenant", tid);
        setTenantJoined(true);
      } else {
        console.log("[Socket] Connected but no tenant ID stored yet");
      }

      // Re-apply all subscriptions on reconnect
      subsRef.current.forEach(({ event, handler }) => {
        s.on(event, handler);
      });
    });

    s.on("disconnect", (reason) => {
      console.log("[Socket] ❌ Disconnected:", reason);
      setIsConnected(false);
      setTenantJoined(false);
    });

    s.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });

    return () => {
      console.log("[Socket] Cleaning up connection");
      s.removeAllListeners();
      s.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Keep tenantId in sync with Auth context and attempt join when available
  useEffect(() => {
    if (!tenant?.id) {
      tenantIdRef.current = null;
      setTenantIdState(null);
      setTenantJoined(false);
      return;
    }
    console.log("[Socket] Auth provided tenant ID:", tenant.id);
    tenantIdRef.current = tenant.id;
    setTenantIdState(tenant.id);
    const s = socketRef.current;
    if (s?.connected) {
      console.log("[Socket] Joining tenant due to Auth effect:", tenant.id);
      s.emit("join:tenant", tenant.id);
      setTenantJoined(true);
    }
  }, [tenant?.id]);

  // SAFETY NET: React effect that guarantees the tenant join happens
  // whenever BOTH isConnected and tenantId are true, regardless of timing
  useEffect(() => {
    if (!isConnected || !tenantId) return;
    const s = socketRef.current;
    if (!s?.connected) return;
    console.log("[Socket] Effect safety-net: joining tenant room:", tenantId);
    s.emit("join:tenant", tenantId);
    setTenantJoined(true);
  }, [isConnected, tenantId]);

  const setTenantId = useCallback((tid: string) => {
    tenantIdRef.current = tid;
    setTenantIdState(tid);
    const s = socketRef.current;
    if (s?.connected) {
      console.log("[Socket] Joining tenant room immediately:", tid);
      s.emit("join:tenant", tid);
      setTenantJoined(true);
    } else {
      console.log("[Socket] Tenant ID stored, will join on connect:", tid);
    }
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const subscribe = useCallback((event: string, handler: EventHandler): (() => void) => {
    const id = `${event}:${Math.random().toString(36).slice(2, 9)}`;
    subsRef.current.set(id, { event, handler });

    const s = socketRef.current;
    if (s) {
      s.on(event, handler);
    }

    return () => {
      subsRef.current.delete(id);
      socketRef.current?.off(event, handler);
    };
  }, []);

  const off = useCallback((event: string, handler?: EventHandler) => {
    const s = socketRef.current;
    if (!s) return;
    if (handler) {
      s.off(event, handler);
    } else {
      s.removeAllListeners(event);
    }
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("join:conversation", conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("leave:conversation", conversationId);
  }, []);

  const joinWidgetAdmin = useCallback((conversationId: string) => {
    socketRef.current?.emit("admin:join:widget", { conversationId });
  }, []);

  const leaveWidgetAdmin = useCallback((conversationId: string) => {
    socketRef.current?.emit("admin:leave:widget", { conversationId });
  }, []);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        tenantJoined,
        emit,
        subscribe,
        off,
        setTenantId,
        joinConversation,
        leaveConversation,
        joinWidgetAdmin,
        leaveWidgetAdmin,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
