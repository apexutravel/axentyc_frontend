export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "AXENTYC",
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
  ],
  sidebarItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: "LayoutDashboard",
      group: "workspace",
    },
    {
      label: "Contact Center",
      href: "/contact-center",
      icon: "MessagesSquare",
      group: "workspace",
    },
    {
      label: "Email",
      href: "/inbox",
      icon: "Inbox",
      group: "workspace",
    },
    {
      label: "Tareas",
      href: "/tasks",
      icon: "CheckSquare",
      group: "workspace",
    },
    {
      label: "CRM",
      href: "/contacts",
      icon: "Users",
      group: "workspace",
      children: [
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
      ],
    },
    {
      label: "Finance",
      href: "/invoices",
      icon: "ReceiptText",
      group: "workspace",
      children: [
        {
          label: "Quotes",
          href: "/quotes",
          icon: "FileText",
        },
        {
          label: "Invoices",
          href: "/invoices",
          icon: "ReceiptText",
        },
        {
          label: "Payments",
          href: "/payments",
          icon: "CreditCard",
        },
      ],
    },
    {
      label: "Automations",
      href: "/automations",
      icon: "Zap",
      group: "workspace",
    },
    {
      label: "Reportes",
      href: "/analytics",
      icon: "BarChart3",
      group: "workspace",
    },
    {
      label: "Integrations",
      href: "/integrations",
      icon: "Plug",
      group: "workspace",
    },
    {
      label: "Team",
      href: "/team",
      icon: "Users",
      group: "admin",
    },
  ],
  // Menu shown while the account has no workspace yet: only the user's own information
  noWorkspaceSidebarItems: [
    {
      label: "Crear empresa",
      href: "/workspaces",
      icon: "Building2",
      group: "account",
    },
    {
      label: "Mi cuenta",
      href: "/account",
      icon: "User",
      group: "account",
    },
    {
      label: "Ajustes",
      href: "/settings",
      icon: "Settings",
      group: "account",
    },
  ],
  // Routes reachable without a workspace
  noWorkspaceAllowedPaths: ["/workspaces", "/account", "/settings"],
  links: {
    website: "https://axentyc.apexucode.com",
    parent: "https://www.apexucode.com",
  },
};
