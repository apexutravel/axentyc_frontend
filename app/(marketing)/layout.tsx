import NextLink from "next/link";
import Script from "next/script";

import { Navbar } from "@/components/navbar";

const FALLBACK_API_URL = "http://localhost:3003/api/v1";
const FALLBACK_WIDGET_ID = "wdg_139db628a956b6123969de910aba9c94";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || FALLBACK_API_URL;
  const widgetId =
    process.env.NEXT_PUBLIC_LANDING_WIDGET_ID || FALLBACK_WIDGET_ID;

  return (
    <div className="relative flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow w-full min-w-0">{children}</main>
      <Script
        id="cconehub-widget-loader"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var configuredWidgetId = '${widgetId}';
              var configuredApiUrl = '${apiUrl}';
              if (!configuredWidgetId) return;

              var isLocalHost = function(hostname) {
                return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
              };

              var resolveApiUrl = function(rawApiUrl) {
                try {
                  var parsed = new URL(rawApiUrl, window.location.origin);
                  if (isLocalHost(parsed.hostname) && !isLocalHost(window.location.hostname)) {
                    parsed.hostname = window.location.hostname;
                  }
                  return parsed.toString().replace(/\\/$/, '');
                } catch (e) {
                  return rawApiUrl;
                }
              };

              var runtimeApiUrl = resolveApiUrl(configuredApiUrl);
              var runtimeScriptHost = runtimeApiUrl.replace(/\\/api\\/v1\\/?$/, '');

              window.CconeHubWidget = {
                widgetId: configuredWidgetId,
                apiUrl: runtimeApiUrl
              };
              var script = document.createElement('script');
              script.src = runtimeScriptHost + '/widget/widget.js';
              script.async = true;
              document.head.appendChild(script);
            })();
          `,
        }}
      />
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
              <NextLink className="hover:text-foreground transition-colors" href="/privacy">Privacidad</NextLink>
              <NextLink className="hover:text-foreground transition-colors" href="/terms">Términos</NextLink>
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
