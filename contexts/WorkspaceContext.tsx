"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Workspace, WorkspaceService } from "@/lib/workspaces";
import { useAuth } from "@/contexts/AuthContext";

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  activeWorkspaceId: string | null;
  /** The workspace list is being (re)loaded */
  isLoading: boolean;
  /** Auth and the workspace list have been resolved for the current account */
  isReady: boolean;
  /** The account has at least one workspace the user can open */
  hasWorkspace: boolean;
  /** Owner / admin: may create and configure workspaces */
  canManage: boolean;
  setActiveWorkspaceId: (workspaceId: string) => void;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const STORAGE_KEY = "axentyc.activeWorkspaceId";
const MANAGER_ROLES = ["owner", "admin"];

function readStored(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

function writeStored(workspaceId: string | null) {
  if (typeof window === "undefined") return;
  if (workspaceId) window.localStorage.setItem(STORAGE_KEY, workspaceId);
  else window.localStorage.removeItem(STORAGE_KEY);
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading, tenant } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Account (tenant) the current list belongs to. Prevents using ids of a previous account.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const requestSeq = useRef(0);

  const tenantId = tenant?.id || user?.tenantId || null;

  const applyActive = useCallback((workspaceId: string | null) => {
    // Storage first: api.ts reads it synchronously when pages mount
    const previous = readStored();
    writeStored(workspaceId);
    setActiveId(workspaceId);
    if (workspaceId && previous !== workspaceId && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("axentyc:workspace-changed", { detail: workspaceId }));
    }
  }, []);

  const setActiveWorkspaceId = useCallback(
    (workspaceId: string) => {
      applyActive(workspaceId);
    },
    [applyActive],
  );

  const refreshWorkspaces = useCallback(async () => {
    if (!isAuthenticated || !tenantId) {
      applyActive(null);
      setWorkspaces([]);
      return;
    }

    const seq = ++requestSeq.current;
    setIsLoading(true);
    try {
      const list = await WorkspaceService.list();
      if (seq !== requestSeq.current) return; // a newer request superseded this one
      const normalized = (((list as any)?.data ?? list) || []) as Workspace[];
      const safe = Array.isArray(normalized) ? normalized : [];
      setWorkspaces(safe);

      const stored = readStored();
      const next = safe.find((w) => w._id === stored) || safe[0] || null;
      applyActive(next?._id ?? null);
      setLoadedFor(tenantId);
    } catch {
      if (seq !== requestSeq.current) return;
      setWorkspaces([]);
      applyActive(null);
      setLoadedFor(tenantId);
    } finally {
      if (seq === requestSeq.current) setIsLoading(false);
    }
  }, [isAuthenticated, tenantId, applyActive]);

  // (Re)load whenever the account changes; drop anything that belonged to the previous one
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      applyActive(null);
      setWorkspaces([]);
      setLoadedFor(null);
      return;
    }
    setWorkspaces([]);
    setLoadedFor(null);
    applyActive(null);
    refreshWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, tenantId]);

  // The backend rejected our workspace (deleted, access revoked...): resync with the server
  useEffect(() => {
    const onInvalid = () => {
      refreshWorkspaces();
    };
    window.addEventListener("axentyc:workspace-invalid", onInvalid);
    return () => window.removeEventListener("axentyc:workspace-invalid", onInvalid);
  }, [refreshWorkspaces]);

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w._id === activeWorkspaceId) || null,
    [workspaces, activeWorkspaceId],
  );

  const isReady = !authLoading && (!isAuthenticated || (!!tenantId && loadedFor === tenantId));
  const hasWorkspace = workspaces.length > 0 && !!activeWorkspaceId;
  const canManage = MANAGER_ROLES.includes((user?.role || "").toLowerCase());

  const value = useMemo(
    () => ({
      workspaces,
      activeWorkspace,
      activeWorkspaceId,
      isLoading,
      isReady,
      hasWorkspace,
      canManage,
      setActiveWorkspaceId,
      refreshWorkspaces,
    }),
    [workspaces, activeWorkspace, activeWorkspaceId, isLoading, isReady, hasWorkspace, canManage, setActiveWorkspaceId, refreshWorkspaces],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaces() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspaces must be used within a WorkspaceProvider");
  }
  return context;
}
