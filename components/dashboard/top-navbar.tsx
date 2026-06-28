"use client";

import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { ThemeSwitch } from "@/components/theme-switch";
import { Search, Bell, Wifi, WifiOff, Facebook, Instagram, MessageCircle, Mail, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationCenter, NotificationType, ChatNotification } from "@/contexts/NotificationCenterContext";
import { useSocket } from "@/hooks/useSocket";
import { useEffect, useMemo } from "react";

function formatRelativeTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  return new Date(dateStr).toLocaleDateString("es", { day: "numeric", month: "short" });
}

function getPlatformIcon(platform?: string) {
  if (!platform) return <Globe size={16} className="text-default-500" />;
  const p = platform.toLowerCase();
  if (p.includes('facebook') || p.includes('messenger')) return <Facebook size={16} className="text-blue-500" />;
  if (p.includes('instagram') || p.includes('ig')) return <Instagram size={16} className="text-pink-500" />;
  if (p.includes('whatsapp') || p.includes('wa')) return <MessageCircle size={16} className="text-green-500" />;
  if (p.includes('email')) return <Mail size={16} className="text-orange-500" />;
  if (p.includes('web') || p.includes('widget')) return <Globe size={16} className="text-default-500" />;
  return <Globe size={16} className="text-default-500" />;
}

export function TopNavbar() {
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
  ];

  const handleLogout = () => {
    logout();
  };

  const userInitials = user 
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <header className="h-16 border-b border-divider bg-content1 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <Input
          aria-label="Search"
          classNames={{
            inputWrapper: "bg-default-100 max-w-md",
            input: "text-sm",
          }}
          placeholder="Buscar contactos, leads, conversaciones..."
          startContent={
            <Search className="text-default-400" size={16} />
          }
          type="search"
        />
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
          <PopoverContent className="w-[300px] p-0">
            <div className="flex flex-col">
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
                <div className="flex gap-1">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.key}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
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
              <div className="max-h-[380px] overflow-y-auto">
                {groupedNotifications.length === 0 ? (
                  <div className="py-8 px-3">
                    <p className="text-sm text-default-500 text-center">No hay notificaciones nuevas</p>
                  </div>
                ) : (
                  <div className="divide-y divide-divider pb-2">
                    {groupedNotifications.map((notification) => (
                      <a
                        key={notification.id}
                        className={`flex items-start gap-3 px-3 py-3 w-full transition-colors hover:bg-default-100 ${
                          !notification.read ? "bg-primary/5" : ""
                        }`}
                        href={
                          notification.type === "email"
                            ? "/inbox"
                            : notification.conversationId
                              ? `/live-chat?conversationId=${notification.conversationId}`
                              : "/live-chat"
                        }
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="relative flex-shrink-0">
                          {getPlatformIcon(notification.platform)}
                          {(notification as any).messageCount > 1 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-danger text-white text-[9px] font-bold leading-none">
                              {(notification as any).messageCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-foreground truncate">{notification.senderName || notification.title}</p>
                            <p className="text-[10px] text-default-400 flex-shrink-0">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                          </div>
                          <p className="text-xs text-default-600 truncate mt-0.5">{notification.message}</p>
                        </div>
                      </a>
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
            <DropdownItem key="settings" href="/dashboard/settings">
              Configuraci&oacute;n
            </DropdownItem>
            <DropdownItem key="team">Mi Equipo</DropdownItem>
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
