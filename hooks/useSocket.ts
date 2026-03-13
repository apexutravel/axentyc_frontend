"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { WS_URL } from "@/config/api";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback);
    return () => {
      socketRef.current?.off(event, callback);
    };
  }, []);

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (callback) {
      socketRef.current?.off(event, callback);
    } else {
      socketRef.current?.removeAllListeners(event);
    }
  }, []);

  const joinTenant = useCallback((tenantId: string) => {
    socketRef.current?.emit("join:tenant", tenantId);
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

  return {
    socket: socketRef.current,
    isConnected,
    emit,
    on,
    off,
    joinTenant,
    joinConversation,
    leaveConversation,
    joinWidgetAdmin,
  };
}
