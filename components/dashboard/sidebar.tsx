"use client";

import { usePathname } from "next/navigation";
import NextLink from "next/link";
import { Tooltip } from "@heroui/tooltip";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import {
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  Inbox,
  Users,
  UserPlus,
  Handshake,
  Zap,
  BarChart3,
  FileText,
  ReceiptText,
  CreditCard,
  Plug,
  Settings,
  Building2,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaces } from "@/contexts/WorkspaceContext";

const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  Inbox,
  Users,
  UserPlus,
  Handshake,
  Zap,
  BarChart3,
  FileText,
  ReceiptText,
  CreditCard,
  Plug,
  Settings,
  Building2,
  User,
};

interface SidebarItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  group?: string;
  children?: SidebarItem[];
}

interface SidebarProps {
  items: SidebarItem[];
}

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const { workspaces, activeWorkspace, activeWorkspaceId, setActiveWorkspaceId, isLoading: workspacesLoading, hasWorkspace, canManage } = useWorkspaces();
  const groupedItems = [
    { key: "workspace", label: "Trabajo", items: items.filter((item) => item.group === "workspace" || !item.group) },
    { key: "admin", label: "Administración", items: items.filter((item) => item.group === "admin") },
    { key: "account", label: "Mi cuenta", items: items.filter((item) => item.group === "account") },
  ].filter((group) => group.items.length > 0);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      className="h-screen sticky top-0 flex flex-col border-r border-divider bg-content1 z-40"
      initial={false}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <div className={`flex items-center h-16 border-b border-divider ${collapsed ? "justify-center px-2" : "gap-2 px-3"}`}>
        {collapsed ? (
          <Tooltip content="Expandir menú" placement="right">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl text-default-500 transition-colors hover:bg-default-100 hover:text-foreground"
              onClick={() => setCollapsed(false)}
            >
              <ChevronRight size={20} />
            </button>
          </Tooltip>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                animate={{ opacity: 1 }}
                className="min-w-0 flex-1 overflow-hidden"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
              >
                <NextLink className="flex items-center gap-2 overflow-hidden rounded-xl p-1 transition-colors hover:bg-default-100" href="/">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">A</span>
                  </div>
                  <span className="font-bold text-lg whitespace-nowrap text-foreground">
                    AXENTYC
                  </span>
                </NextLink>
              </motion.div>
            </AnimatePresence>
            <button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-default-500 transition-colors hover:bg-default-100 hover:text-foreground"
              onClick={() => setCollapsed(true)}
            >
              <ChevronLeft size={18} />
            </button>
          </>
        )}
      </div>

      <div className="border-b border-divider p-3">
        {!hasWorkspace ? (
          collapsed ? (
            <Tooltip content="Crear tu primera empresa" placement="right">
              <NextLink
                className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                href="/workspaces"
              >
                <Building2 size={18} />
              </NextLink>
            </Tooltip>
          ) : (
            <NextLink
              className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5 text-left transition-colors hover:bg-primary/10"
              href="/workspaces"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {workspacesLoading ? "Cargando..." : canManage ? "Crea tu empresa" : "Sin empresa asignada"}
                </span>
                <span className="block truncate text-xs text-default-500">
                  {canManage ? "Desbloquea el resto del menú" : "Pide acceso al administrador"}
                </span>
              </span>
            </NextLink>
          )
        ) : !collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-default-400">
                Workspace activo
              </span>
              <Tooltip content="Crear y editar workspaces" placement="right">
                <NextLink
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-default-500 transition-colors hover:bg-default-100 hover:text-foreground"
                  href="/workspaces"
                >
                  <Settings size={15} />
                </NextLink>
              </Tooltip>
            </div>
            <Dropdown placement="bottom-start">
              <DropdownTrigger>
                <button className="flex w-full items-center gap-3 rounded-2xl border border-divider bg-content2 px-3 py-2.5 text-left transition-colors hover:bg-default-100">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {activeWorkspace?.name || (workspacesLoading ? "Cargando..." : "Sin workspace")}
                    </span>
                    <span className="block truncate text-xs text-default-500">
                      Este menú trabaja aquí
                    </span>
                  </span>
                  <ChevronDown className="shrink-0 text-default-400" size={15} />
                </button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Seleccionar workspace"
                disabledKeys={workspaces.length === 0 ? ["empty"] : []}
                selectedKeys={activeWorkspaceId ? [activeWorkspaceId] : []}
                selectionMode="single"
                onAction={(key) => {
                  if (key !== "empty") {
                    setActiveWorkspaceId(String(key));
                  }
                }}
              >
                {workspaces.length > 0 ? (
                  workspaces.map((workspace) => (
                    <DropdownItem key={workspace._id} textValue={workspace.name}>
                      <div className="flex items-center gap-3">
                        <span className="h-7 w-7 rounded-lg border border-divider bg-primary/20" />
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium text-foreground">{workspace.name}</span>
                          <span className="truncate text-xs capitalize text-default-500">{workspace.type}</span>
                        </span>
                      </div>
                    </DropdownItem>
                  ))
                ) : (
                  <DropdownItem key="empty" textValue="Sin workspaces">
                    No hay workspaces disponibles
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>
          </div>
        ) : (
          <Tooltip content={activeWorkspace?.name || "Workspace"} placement="right">
            <NextLink
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors hover:bg-primary/20"
              href="/workspaces"
            >
              <Building2 size={18} />
            </NextLink>
          </Tooltip>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        {groupedItems.map((group) => (
          <div key={group.key} className="space-y-1">
            {!collapsed && (
              <div className="flex items-center gap-2 px-3 pb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-default-400">
                  {group.label}
                </span>
              </div>
            )}
            {group.items.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href)) ||
            !!item.children?.some((child) => pathname === child.href || pathname.startsWith(child.href));

          if (item.children?.length) {
            const isOpen = openMenus[item.label] ?? false;
            const submenuContent = (
              <button
                className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-default-600 hover:bg-default-100 hover:text-foreground"
                }`}
                onClick={() => setOpenMenus((current) => ({ ...current, [item.label]: !isOpen }))}
              >
                <span className="relative flex-shrink-0">
                  <Icon
                    className={`${isActive ? "text-primary" : "text-default-500 group-hover:text-foreground"}`}
                    size={20}
                  />
                </span>
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm whitespace-nowrap flex-1 text-left"
                      exit={{ opacity: 0, x: -10 }}
                      initial={{ opacity: 0, x: -10 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!collapsed && (
                  <ChevronDown className={`text-default-400 transition-transform ${isOpen ? "rotate-180" : ""}`} size={15} />
                )}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.label} content={item.label} placement="right">
                  {submenuContent}
                </Tooltip>
              );
            }

            return (
              <div key={item.label} className="space-y-1">
                {submenuContent}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      animate={{ height: "auto", opacity: 1 }}
                      className="ml-4 space-y-1 overflow-hidden border-l border-divider pl-3"
                      exit={{ height: 0, opacity: 0 }}
                      initial={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.16 }}
                    >
                      {item.children.map((child) => {
                        const ChildIcon = iconMap[child.icon] || LayoutDashboard;
                        const childActive = pathname === child.href || pathname.startsWith(child.href);

                        return (
                          <NextLink
                            key={child.href}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                              childActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-default-500 hover:bg-default-100 hover:text-foreground"
                            }`}
                            href={child.href}
                          >
                            <ChildIcon className={childActive ? "text-primary" : "text-default-400"} size={16} />
                            <span>{child.label}</span>
                          </NextLink>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          const linkContent = (
            <NextLink
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-default-600 hover:bg-default-100 hover:text-foreground"
              }`}
              href={item.href}
            >
              <span className="relative flex-shrink-0">
                <Icon
                  className={`${isActive ? "text-primary" : "text-default-500 group-hover:text-foreground"}`}
                  size={20}
                />
                {item.badge != null && item.badge > 0 && collapsed && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold leading-none shadow-sm">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </span>
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm whitespace-nowrap flex-1"
                    exit={{ opacity: 0, x: -10 }}
                    initial={{ opacity: 0, x: -10 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {!collapsed && item.badge != null && item.badge > 0 && (
                <span className="ml-auto flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-danger text-white text-[11px] font-semibold leading-none">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </NextLink>
          );

          if (collapsed) {
            return (
              <Tooltip
                key={item.href}
                content={item.label}
                placement="right"
              >
                {linkContent}
              </Tooltip>
            );
          }

          return <div key={item.href}>{linkContent}</div>;
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-divider p-3 space-y-1">
        {!collapsed && (
          <NextLink
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-default-500 hover:bg-danger-50 hover:text-danger transition-all duration-150"
            href="/logout"
          >
            <LogOut size={20} />
            <span className="text-sm">Cerrar Sesi&oacute;n</span>
          </NextLink>
        )}
      </div>
    </motion.aside>
  );
}
