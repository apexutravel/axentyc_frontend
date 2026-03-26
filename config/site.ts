export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "CconeHub",
  description: "SaaS Social CRM Omnichannel Multi-Tenant Platform",
  navItems: [
    {
      label: "Producto",
      href: "/#producto",
    },
    {
      label: "Integraciones",
      href: "/#integraciones",
    },
    {
      label: "Precios",
      href: "/pricing",
    },
    {
      label: "Empresa",
      href: "/about",
    },
  ],
  navMenuItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Inbox",
      href: "/inbox",
    },
    {
      label: "Contacts",
      href: "/contacts",
    },
    {
      label: "Leads",
      href: "/leads",
    },
    {
      label: "Deals",
      href: "/deals",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  sidebarItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: "LayoutDashboard",
    },
    {
      label: "Contact Center",
      href: "/live-chat",
      icon: "MessagesSquare",
    },
    {
      label: "Inbox",
      href: "/inbox",
      icon: "MessageSquare",
    },
    {
      label: "Contacts",
      href: "/contacts",
      icon: "Users",
    },
    {
      label: "Leads",
      href: "/leads",
      icon: "UserPlus",
    },
    {
      label: "Deals",
      href: "/deals",
      icon: "Handshake",
    },
    {
      label: "Team",
      href: "/team",
      icon: "Users",
    },
    {
      label: "Automations",
      href: "/automations",
      icon: "Zap",
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: "BarChart3",
    },
    {
      label: "Integrations",
      href: "/integrations",
      icon: "Plug",
    },
    {
      label: "Settings",
      href: "/settings",
      icon: "Settings",
    },
  ],
  links: {
    website: "https://cconehub.com",
  },
};
