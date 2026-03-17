"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { siteConfig } from "@/config/site";
import { useUnreadConversations } from "@/hooks/useUnreadConversations";
import { useUnreadEmails } from "@/hooks/useUnreadEmails";
import { useMemo } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const totalUnreadMessages = useUnreadConversations();
  const unreadEmails = useUnreadEmails();

  const sidebarItemsWithBadge = useMemo(() => {
    return siteConfig.sidebarItems.map((item) => {
      if (item.href === "/live-chat") {
        return { ...item, badge: totalUnreadMessages };
      }
      if (item.href === "/inbox") {
        return { ...item, badge: unreadEmails };
      }
      return item;
    });
  }, [totalUnreadMessages, unreadEmails]);

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
