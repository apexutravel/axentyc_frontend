"use client";

import { useEffect } from "react";

export function ChatWidgetEmbed() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Cargar configuración del widget dinámicamente desde el backend
    const loadWidget = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const response = await fetch(`${apiUrl}/chat-widget`);
        const data = await response.json();
        const config = data?.data || data;

        if (!config?.widgetId || !config?.enabled) return;

        // Configurar widget con datos del backend
        (window as any).CconeHubWidget = {
          widgetId: config.widgetId,
          apiUrl: apiUrl,
        };

        // Cargar script del widget
        const script = document.createElement("script");
        const baseUrl = apiUrl.replace('/api/v1', '');
        script.src = `${baseUrl}/widget/widget.js`;
        script.async = true;
        document.body.appendChild(script);
      } catch (error) {
        console.error("Error loading widget:", error);
      }
    };

    loadWidget();

    return () => {
      const existingScript = document.querySelector('script[src*="/widget/widget.js"]');
      if (existingScript) {
        existingScript.remove();
      }
      const widgetNode = document.getElementById("cconehub-widget");
      if (widgetNode) {
        widgetNode.remove();
      }
    };
  }, []);

  return null;
}
