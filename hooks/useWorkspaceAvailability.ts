"use client";

import { useEffect, useState } from "react";
import { WorkspaceAvailability, WorkspaceService } from "@/lib/workspaces";

export function useWorkspaceAvailability(name: string, slug: string, excludeId?: string) {
  const [result, setResult] = useState<WorkspaceAvailability | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const cleanName = name.trim();
    if (!cleanName || !slug) {
      setResult(null);
      setChecking(false);
      return;
    }

    let cancelled = false;
    setResult(null);
    setChecking(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await WorkspaceService.availability(cleanName, slug, excludeId);
        if (!cancelled) setResult(((response as any)?.data ?? response) as WorkspaceAvailability);
      } catch {
        if (!cancelled) setResult(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [name, slug, excludeId]);

  return { result, checking };
}
