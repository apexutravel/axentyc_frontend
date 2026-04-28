"use client";

import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { ThemeSwitch } from "@/components/theme-switch";
import { Search, Bell, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationCenter, NotificationType } from "@/contexts/NotificationCenterContext";
import { useSocket } from "@/hooks/useSocket";

function formatRelativeTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  return new Date(dateStr).toLocaleDateString("es", { day: "numeric", month: "short" });
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
                {visibleNotifications.length === 0 ? (
                  <div className="py-8 px-3">
                    <p className="text-sm text-default-500 text-center">No hay notificaciones nuevas</p>
                  </div>
                ) : (
                  <div className="divide-y divide-divider pb-2">
                    {visibleNotifications.map((notification) => (
                      <a
                        key={notification.id}
                        className={`flex items-start gap-2.5 px-3 py-2.5 w-full transition-colors hover:bg-default-100 ${
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
                        <span
                          className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                            notification.read ? "bg-default-300" : "bg-primary"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{notification.title}</p>
                          <p className="text-xs text-default-600 truncate mt-0.5">{notification.message}</p>
                          <p className="text-[10px] text-default-400 mt-1">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
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
