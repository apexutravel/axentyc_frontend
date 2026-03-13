"use client";

import { usePathname } from "next/navigation";
import NextLink from "next/link";
import { Tooltip } from "@heroui/tooltip";
import { Chip } from "@heroui/chip";
import {
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  Users,
  UserPlus,
  Handshake,
  Zap,
  BarChart3,
  Plug,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  Users,
  UserPlus,
  Handshake,
  Zap,
  BarChart3,
  Plug,
  Settings,
};

interface SidebarItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

interface SidebarProps {
  items: SidebarItem[];
}

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      className="h-screen sticky top-0 flex flex-col border-r border-divider bg-content1 z-40"
      initial={false}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <div className="flex items-center h-16 px-4 border-b border-divider">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 overflow-hidden"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-bold text-lg whitespace-nowrap">
                CconeHub
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">C</span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          const linkContent = (
            <NextLink
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-default-600 hover:bg-default-100 hover:text-foreground"
              }`}
              href={item.href}
            >
              <Icon
                className={`flex-shrink-0 ${isActive ? "text-primary" : "text-default-500 group-hover:text-foreground"}`}
                size={20}
              />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm whitespace-nowrap"
                    exit={{ opacity: 0, x: -10 }}
                    initial={{ opacity: 0, x: -10 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {!collapsed && item.badge && item.badge > 0 && (
                <Chip
                  className="ml-auto"
                  color="danger"
                  size="sm"
                  variant="flat"
                >
                  {item.badge}
                </Chip>
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
        <button
          className="flex items-center justify-center w-full px-3 py-2 rounded-lg text-default-400 hover:bg-default-100 hover:text-foreground transition-all duration-150"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && (
            <span className="text-xs ml-2">Colapsar</span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
