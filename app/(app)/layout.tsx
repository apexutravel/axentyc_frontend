"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { siteConfig } from "@/config/site";
import { useNotificationCenter } from "@/contexts/NotificationCenterContext";
import { useWorkspaces } from "@/contexts/WorkspaceContext";
import { useUnreadEmails } from "@/hooks/useUnreadEmails";

function isAllowedWithoutWorkspace(pathname: string) {
  return siteConfig.noWorkspaceAllowedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function FullScreenSpinner({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-default-500">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount } = useNotificationCenter();
  const unreadEmails = useUnreadEmails();
  const { isReady, hasWorkspace, canManage, activeWorkspaceId } = useWorkspaces();

  const allowed = hasWorkspace || isAllowedWithoutWorkspace(pathname);

  // Without a workspace only the account-level pages exist
  useEffect(() => {
    if (isReady && !allowed) router.replace("/workspaces");
  }, [isReady, allowed, router]);

  const sidebarItems = useMemo(() => {
    if (!hasWorkspace) {
      return siteConfig.noWorkspaceSidebarItems.filter((item) => canManage || item.href !== "/workspaces");
    }
    return siteConfig.sidebarItems.map((item) => {
      if (item.href === "/contact-center") {
        return { ...item, badge: unreadCount };
      }
      if (item.href === "/inbox") {
        return { ...item, badge: unreadEmails };
      }
      return item;
    });
  }, [hasWorkspace, canManage, unreadCount, unreadEmails]);

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <Sidebar items={sidebarItems} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            {!isReady ? (
              <FullScreenSpinner label="Cargando tu espacio de trabajo..." />
            ) : !allowed ? (
              <FullScreenSpinner label="Redirigiendo..." />
            ) : (
              // Remounting on workspace change makes every page reload its data for the new company
              <div key={activeWorkspaceId ?? "no-workspace"} className="contents">
                {children}
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
