"use client";

import { useState, useEffect, useCallback } from "react";
import { useSocket } from "./useSocket";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";
import { toast } from "sonner";

export function useUnreadEmails() {
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useSocket();

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await api.get(API_ENDPOINTS.emails.unreadCount);
      const count = (res as any)?.data ?? res;
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  useEffect(() => {
    if (!socket) return;

    const unsubReceived = socket.subscribe("email.received", (data: any) => {
      setUnreadCount((prev) => prev + 1);
      toast.success(`Nuevo email de ${data.from?.name || data.from?.address}`);
    });

    const unsubUpdated = socket.subscribe("email.updated", (data: any) => {
      if (data.isRead !== undefined) {
        loadUnreadCount();
      }
    });

    const unsubDeleted = socket.subscribe("email.deleted", () => {
      loadUnreadCount();
    });

    const unsubSyncComplete = socket.subscribe("email.sync.complete", (data: any) => {
      if (data.newEmails > 0) {
        setUnreadCount(data.unreadCount);
        toast.success(`${data.newEmails} nuevo${data.newEmails > 1 ? 's' : ''} email${data.newEmails > 1 ? 's' : ''} sincronizado${data.newEmails > 1 ? 's' : ''}`);
      }
    });

    return () => {
      unsubReceived();
      unsubUpdated();
      unsubDeleted();
      unsubSyncComplete();
    };
  }, [socket, loadUnreadCount]);

  return unreadCount;
}
