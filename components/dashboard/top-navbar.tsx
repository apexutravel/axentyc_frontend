"use client";

import { Avatar } from "@heroui/avatar";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { ThemeSwitch } from "@/components/theme-switch";
import { Menu, Bell, Wifi, WifiOff, Facebook, Instagram, MessageCircle, Mail, Globe, Building2, User, Zap, MessagesSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationCenter, NotificationType, ChatNotification } from "@/contexts/NotificationCenterContext";
import { useSocket } from "@/hooks/useSocket";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

function formatRelativeTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  return new Date(dateStr).toLocaleDateString("es", { day: "numeric", month: "short" });
}

function getNotificationBadge(notification: ChatNotification) {
  const p = (notification.platform || "").toLowerCase();
  const box = (bg: string, icon: React.ReactNode) => (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bg}`}>{icon}</span>
  );
  if (notification.type === "email" || p.includes("email")) return box("bg-orange-500/10", <Mail size={20} className="text-orange-500" />);
  if (p.includes("instagram")) return box("bg-pink-500/10", <Instagram size={20} className="text-pink-500" />);
  if (p.includes("facebook") || p.includes("messenger")) return box("bg-blue-500/10", <Facebook size={20} className="text-blue-500" />);
  if (p.includes("whatsapp")) return box("bg-green-500/10", <MessageCircle size={20} className="text-green-500" />);
  if (notification.type === "system") {
    const automation = /automat/i.test(notification.title || "");
    return box("bg-warning/10", automation ? <Zap size={20} className="text-warning" /> : <Bell size={20} className="text-warning" />);
  }
  if (notification.type === "conversation") return box("bg-primary/10", <MessagesSquare size={20} className="text-primary" />);
  return box("bg-default-100", <Globe size={20} className="text-default-500" />);
}

export function TopNavbar({ onMenu }: { onMenu?: () => void }) {
  const router = useRouter();
  const { user, tenant, logout } = useAuth();
  const { isConnected, tenantJoined } = useSocket();
  const {
    notifications,
    unreadCount,
    activeFilter,
    setActiveFilter,
    filteredNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotificationCenter();
  const visibleNotifications = filteredNotifications.slice(0, 8);

  // Group notifications by conversation to count messages per user
  const groupedNotifications = useMemo(() => {
    const groups = new Map<string, { notifications: ChatNotification[]; count: number }>();
    
    filteredNotifications.forEach((notification) => {
      const key = notification.conversationId || notification.id;
      if (!groups.has(key)) {
        groups.set(key, { notifications: [], count: 0 });
      }
      const group = groups.get(key)!;
      group.notifications.push(notification);
      group.count++;
    });
    
    return Array.from(groups.values()).map((group) => {
      const latest = group.notifications[group.notifications.length - 1];
      return {
        ...latest,
        messageCount: group.count,
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
  }, [filteredNotifications]);

  const filterTabs: { key: NotificationType | "all"; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "message", label: "Mensajes" },
    { key: "conversation", label: "Chats" },
    { key: "email", label: "Emails" },
    { key: "system", label: "Avisos" },
  ];

  const handleLogout = () => {
    logout();
  };

  const userInitials = user 
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <header className="h-16 border-b border-divider bg-content1 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30">
      <div className="flex flex-1 items-center">
        <button aria-label="Abrir menú" className="flex h-10 w-10 items-center justify-center rounded-xl text-default-600 hover:bg-default-100 lg:hidden" type="button" onClick={onMenu}>
          <Menu size={22} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 mr-1" title={`Socket: ${isConnected ? 'connected' : 'disconnected'} | Tenant: ${tenantJoined ? 'joined' : 'pending'}`}>
          {isConnected ? (
            <Wifi className={tenantJoined ? "text-success" : "text-warning"} size={14} />
          ) : (
            <WifiOff className="text-danger" size={14} />
          )}
          <span className={`text-[10px] font-medium ${isConnected ? (tenantJoined ? 'text-success' : 'text-warning') : 'text-danger'}`}>
            {isConnected ? (tenantJoined ? 'Live' : 'Connecting...') : 'Offline'}
          </span>
        </div>

        <ThemeSwitch />

        <Popover placement="bottom-end">
          <PopoverTrigger>
            <div className="relative">
              <button className="p-2 rounded-lg hover:bg-default-100 transition-colors">
                <Bell className="text-default-500" size={20} />
              </button>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold leading-none shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[360px] max-w-[calc(100vw-1.5rem)] overflow-hidden p-0">
            {/* PopoverContent is inline-flex + items-center: without w-full the list grows to the widest message */}
            <div className="flex w-full min-w-0 flex-col">
              {/* Header */}
              <div className="px-3 py-2.5 border-b border-divider">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-semibold">Notificaciones</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="text-[11px] text-primary hover:underline disabled:text-default-400"
                      disabled={unreadCount === 0}
                      onClick={(e) => {
                        e.preventDefault();
                        markAllAsRead();
                      }}
                    >
                      Marcar leídas
                    </button>
                    <button
                      className="text-[11px] text-default-500 hover:underline disabled:text-default-400"
                      disabled={notifications.length === 0}
                      onClick={(e) => {
                        e.preventDefault();
                        clearNotifications();
                      }}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
                <div className="flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none]">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.key}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                        activeFilter === tab.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-default-100 text-default-600 hover:bg-default-200"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveFilter(tab.key);
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-[min(420px,70vh)] w-full overflow-y-auto overflow-x-hidden">
                {groupedNotifications.length === 0 ? (
                  <div className="py-8 px-3">
                    <p className="text-sm text-default-500 text-center">No hay notificaciones nuevas</p>
                  </div>
                ) : (
                  <div className="divide-y divide-divider pb-2">
                    {groupedNotifications.map((notification) => (
                      <button
                        key={notification.id}
                        className={`flex w-full min-w-0 items-start gap-3 px-3 py-3 transition-colors hover:bg-default-100 text-left ${
                          !notification.read ? "bg-primary/5" : ""
                        }`}
                        onClick={() => {
                          markAsRead(notification.id);
                          if (notification.type === "email") {
                            router.push("/inbox");
                          } else if (notification.conversationId) {
                            const platform = notification.platform?.toLowerCase() || "";
                            let tab = "all";
                            if (platform.includes("instagram") || platform.includes("ig")) tab = "instagram";
                            else if (platform.includes("facebook") || platform.includes("messenger")) tab = "messenger";
                            else if (platform.includes("whatsapp") || platform.includes("wa")) tab = "whatsapp";
                            router.push(`/contact-center?conversationId=${notification.conversationId}&tab=${tab}`);
                          } else {
                            router.push("/contact-center");
                          }
                        }}
                      >
                        <div className="relative shrink-0">
                          {getNotificationBadge(notification)}
                          {(notification as any).messageCount > 1 && (
                            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold leading-none text-white">
                              {(notification as any).messageCount}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center justify-between gap-2">
                            <p className="min-w-0 truncate text-xs font-semibold text-foreground">{notification.senderName || notification.title}</p>
                            <p className="shrink-0 text-[10px] text-default-400">{formatRelativeTime(notification.createdAt)}</p>
                          </div>
                          {notification.pageName && (
                            <p className="truncate text-[10px] text-default-500">{notification.pageName}</p>
                          )}
                          <p className="mt-0.5 line-clamp-2 break-words text-xs text-default-600">{notification.message}</p>
                        </div>
                        {!notification.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              as="button"
              className="transition-transform"
              color="primary"
              name={userInitials}
              size="sm"
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem key="profile" className="h-14 gap-2" textValue="Profile">
              <p className="font-semibold">{user?.email}</p>
              <p className="text-xs text-default-500">{user?.role} · {tenant?.name}</p>
            </DropdownItem>
            <DropdownItem key="account" href="/account" startContent={<User size={16} />}>
              Cuenta
            </DropdownItem>
            <DropdownItem key="workspaces" href="/workspaces" startContent={<Building2 size={16} />}>
              Workspaces
            </DropdownItem>
            <DropdownItem key="help">Ayuda</DropdownItem>
            <DropdownItem key="logout" color="danger" onPress={handleLogout}>
              Cerrar Sesi&oacute;n
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </header>
  );
}
