"use client";

import { useEffect } from "react";

interface WidgetLoaderProps {
  enabled?: boolean;
}

export default function WidgetLoader({ enabled = false }: WidgetLoaderProps) {
  useEffect(() => {
    if (!enabled) return;

    // Cargar configuración del widget desde el backend
    const loadWidget = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat-widget`
        );
        const data = await response.json();
        const config = data?.data || data;

        if (!config?.widgetId || !config?.enabled) return;

        // Inyectar el script del widget
        const script = document.createElement("script");
        script.innerHTML = `
          (function() {
            window.AXENTYCWidget = {
              widgetId: '${config.widgetId}',
              apiUrl: '${process.env.NEXT_PUBLIC_API_URL}'
            };
            var widgetScript = document.createElement('script');
            widgetScript.src = '${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "")}/widget/widget.js';
            widgetScript.async = true;
            document.head.appendChild(widgetScript);
          })();
        `;
        document.head.appendChild(script);
      } catch (error) {
        console.error("Error loading widget:", error);
      }
    };

    loadWidget();
  }, [enabled]);

  return null;
}
