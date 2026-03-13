"use client";

import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Badge } from "@heroui/badge";
import { ThemeSwitch } from "@/components/theme-switch";
import { Search, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function TopNavbar() {
  const { user, tenant, logout } = useAuth();

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
        <ThemeSwitch />

        <Badge color="danger" content="3" shape="circle" size="sm">
          <button className="p-2 rounded-lg hover:bg-default-100 transition-colors">
            <Bell className="text-default-500" size={20} />
          </button>
        </Badge>

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
