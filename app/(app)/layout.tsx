"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { siteConfig } from "@/config/site";
import { useNotificationCenter } from "@/contexts/NotificationCenterContext";
import { useUnreadEmails } from "@/hooks/useUnreadEmails";
import { useMemo } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { unreadCount } = useNotificationCenter();
  const unreadEmails = useUnreadEmails();

  const sidebarItemsWithBadge = useMemo(() => {
    return siteConfig.sidebarItems.map((item) => {
      if (item.href === "/live-chat" || item.href === "/contact-center") {
        return { ...item, badge: unreadCount };
      }
      if (item.href === "/inbox") {
        return { ...item, badge: unreadEmails };
      }
      return item;
    });
  }, [unreadCount, unreadEmails]);

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <Sidebar items={sidebarItemsWithBadge} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
