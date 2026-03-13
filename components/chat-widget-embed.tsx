"use client";

import { useEffect } from "react";

export function ChatWidgetEmbed() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    (window as any).CconeHubWidget = {
      widgetId: "wdg_09c4690b7278aa5bb95b19d302a0e9be",
      apiUrl: "http://localhost:3001/api/v1",
    };

    const script = document.createElement("script");
    const widgetScriptVersion = "20260312-2";
    script.src = `http://localhost:3001/widget/widget.js?v=${widgetScriptVersion}`;
    script.async = true;
    document.body.appendChild(script);

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
