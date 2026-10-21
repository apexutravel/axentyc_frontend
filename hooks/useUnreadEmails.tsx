"use client";

import { useState, useEffect, useCallback } from "react";
import { useSocket } from "./useSocket";
import { useWorkspaces } from "@/contexts/WorkspaceContext";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";
import { toast } from "sonner";

export function useUnreadEmails() {
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useSocket();
  const { hasWorkspace, activeWorkspaceId } = useWorkspaces();

  const loadUnreadCount = useCallback(async () => {
    if (!hasWorkspace) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await api.get(API_ENDPOINTS.emails.unreadCount);
      const count = (res as any)?.data ?? res;
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch {
      setUnreadCount(0);
    }
  }, [hasWorkspace, activeWorkspaceId]);

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  useEffect(() => {
    if (!socket) return;

    // Events of other companies of the same account must not touch this workspace's counters
    const mine = (workspaceId?: string) => !workspaceId || workspaceId === activeWorkspaceId;

    const unsubReceived = socket.subscribe("email.received", (data: any) => {
      if (!mine(data?.workspaceId)) return;
      if (data?.folder && data.folder !== "INBOX") return;
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
      if (!mine(data?.workspaceId)) return;
      if (data.newEmails > 0) {
        setUnreadCount(data.unreadCount);
        const where = data.accountLabel ? ` en ${data.accountLabel}` : '';
        toast.success(`${data.newEmails} nuevo${data.newEmails > 1 ? 's' : ''} email${data.newEmails > 1 ? 's' : ''}${where}`);
      }
    });

    return () => {
      unsubReceived();
      unsubUpdated();
      unsubDeleted();
      unsubSyncComplete();
    };
  }, [socket, loadUnreadCount, activeWorkspaceId]);

  return unreadCount;
}
