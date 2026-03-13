export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "CconeHub",
  description: "SaaS Social CRM Omnichannel Multi-Tenant Platform",
  navItems: [
    {
      label: "Pricing",
      href: "/pricing",
    },
    {
      label: "About",
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
      href: "/dashboard/inbox",
    },
    {
      label: "Contacts",
      href: "/dashboard/contacts",
    },
    {
      label: "Leads",
      href: "/dashboard/leads",
    },
    {
      label: "Deals",
      href: "/dashboard/deals",
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
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
      label: "Inbox",
      href: "/dashboard/inbox",
      icon: "MessageSquare",
    },
    {
      label: "Contacts",
      href: "/dashboard/contacts",
      icon: "Users",
    },
    {
      label: "Leads",
      href: "/dashboard/leads",
      icon: "UserPlus",
    },
    {
      label: "Deals",
      href: "/dashboard/deals",
      icon: "Handshake",
    },
    {
      label: "Automations",
      href: "/dashboard/automations",
      icon: "Zap",
    },
    {
      label: "Analytics",
      href: "/dashboard/analytics",
      icon: "BarChart3",
    },
    {
      label: "Live Chat",
      href: "/dashboard/live-chat",
      icon: "MessagesSquare",
    },
    {
      label: "Integrations",
      href: "/dashboard/integrations",
      icon: "Plug",
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: "Settings",
    },
  ],
  links: {
    website: "https://cconehub.com",
  },
};
