import NextLink from "next/link";

import { Navbar } from "@/components/navbar";
import { ChatWidgetEmbed } from "@/components/chat-widget-embed";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow w-full min-w-0">{children}</main>
      <ChatWidgetEmbed />
      <footer className="border-t border-divider">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">C</span>
              </div>
              <span className="font-bold">CconeHub</span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-default-500">
              <NextLink className="hover:text-foreground transition-colors" href="/pricing">Precios</NextLink>
              <NextLink className="hover:text-foreground transition-colors" href="/about">Nosotros</NextLink>
              <NextLink className="hover:text-foreground transition-colors" href="mailto:contacto@cconehub.com">Contacto</NextLink>
            </div>

            {/* Copyright */}
            <p className="text-xs text-default-400">
              &copy; {new Date().getFullYear()} CconeHub
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
