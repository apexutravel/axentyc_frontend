"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@heroui/drawer";
import { motion } from "framer-motion";
import { addToast } from "@heroui/toast";
import {
  Plug,
  Check,
  ExternalLink,
  Copy,
  RefreshCw,
  Palette,
  Code,
  MessageSquare,
  Eye,
  Save,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";

interface WidgetConfig {
  _id?: string;
  widgetId: string;
  enabled: boolean;
  title: string;
  subtitle: string;
  welcomeMessage: string;
  primaryColor: string;
  textColor: string;
  position: string;
  avatarUrl?: string;
  allowedDomains: string[];
  showBranding: boolean;
  collectEmail: boolean;
  collectPhone: boolean;
  offlineMessage?: string;
  customCSS?: string;
}

const defaultConfig: WidgetConfig = {
  widgetId: "",
  enabled: true,
  title: "Chatea con nosotros",
  subtitle: "Estamos aquí para ayudarte",
  welcomeMessage: "¡Hola! ¿En qué podemos ayudarte?",
  primaryColor: "#0084FF",
  textColor: "#FFFFFF",
  position: "right",
  avatarUrl: "",
  allowedDomains: [],
  showBranding: true,
  collectEmail: true,
  collectPhone: false,
  offlineMessage:
    "En este momento no estamos disponibles. Déjanos tu mensaje y te responderemos pronto.",
  customCSS: "",
};

const colorPresets = [
  { name: "Azul", value: "#0084FF" },
  { name: "Verde", value: "#25D366" },
  { name: "Rojo", value: "#FF4444" },
  { name: "Morado", value: "#7C3AED" },
  { name: "Naranja", value: "#FF6B35" },
  { name: "Amarillo", value: "#FFA726" },
  { name: "Rosa", value: "#EC4899" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Oscuro", value: "#1F2937" },
];

const otherIntegrations = [
  {
    name: "WhatsApp Business",
    description:
      "Conecta tu cuenta de WhatsApp Business para enviar y recibir mensajes.",
    icon: "💬",
    status: "connected" as const,
  },
  {
    name: "Instagram",
    description: "Gestiona mensajes directos y comentarios de Instagram.",
    icon: "📸",
    status: "connected" as const,
  },
  {
    name: "Facebook Messenger",
    description:
      "Conecta tu página de Facebook para gestionar mensajes.",
    icon: "👤",
    status: "disconnected" as const,
  },
  {
    name: "TikTok",
    description: "Recibe mensajes y comentarios de TikTok Business.",
    icon: "🎵",
    status: "disconnected" as const,
  },
  {
    name: "Email (SMTP)",
    description:
      "Conecta tu correo para enviar y recibir emails desde el CRM.",
    icon: "📧",
    status: "disconnected" as const,
  },
  {
    name: "Stripe",
    description: "Procesa pagos y gestiona suscripciones.",
    icon: "💳",
    status: "disconnected" as const,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function IntegrationsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [config, setConfig] = useState<WidgetConfig>(defaultConfig);
  const [scriptCode, setScriptCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [widgetExists, setWidgetExists] = useState(false);
  const [domainsInput, setDomainsInput] = useState("");

  const loadWidgetConfig = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<any>(API_ENDPOINTS.widget.get);
      const data = response.data || response;
      
      if (data && data.exists) {
        setConfig({ ...defaultConfig, ...data });
        setWidgetExists(true);
        setDomainsInput(data.allowedDomains?.join(", ") || "");
        
        try {
          const scriptResponse = await api.get<any>(API_ENDPOINTS.widget.script);
          const scriptData = scriptResponse.data || scriptResponse;
          
          if (scriptData?.script) {
            setScriptCode(scriptData.script);
          }
        } catch {
          // Script fetch failed, not critical
        }
      } else {
        setConfig(defaultConfig);
        setWidgetExists(false);
        setScriptCode("");
      }
    } catch {
      setConfig(defaultConfig);
      setWidgetExists(false);
      setScriptCode("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWidgetConfig();
  }, [loadWidgetConfig]);

  const openDrawer = () => {
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        title: config.title,
        subtitle: config.subtitle,
        welcomeMessage: config.welcomeMessage,
        primaryColor: config.primaryColor,
        textColor: config.textColor,
        position: config.position,
        showBranding: config.showBranding,
        collectEmail: config.collectEmail,
        collectPhone: config.collectPhone,
        enabled: config.enabled,
      };
      if (config.avatarUrl) payload.avatarUrl = config.avatarUrl;
      if (config.offlineMessage) payload.offlineMessage = config.offlineMessage;
      if (config.customCSS) payload.customCSS = config.customCSS;
      if (domainsInput) {
        payload.allowedDomains = domainsInput
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean);
      } else {
        payload.allowedDomains = [];
      }

      await api.post(API_ENDPOINTS.widget.save, payload);

      addToast({
        title: widgetExists
          ? "Configuración guardada"
          : "Widget creado exitosamente",
        color: "success",
      });

      await loadWidgetConfig();
    } catch (error: any) {
      addToast({
        title: error.message || "Error al guardar",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateId = async () => {
    try {
      await api.post(API_ENDPOINTS.widget.regenerate);
      addToast({ title: "Widget ID regenerado", color: "success" });
      await loadWidgetConfig();
    } catch (error: any) {
      addToast({
        title: error.message || "Error al regenerar",
        color: "danger",
      });
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    addToast({ title: "Script copiado al portapapeles", color: "success" });
    setTimeout(() => setCopied(false), 2000);
  };

  const updateConfig = (key: keyof WidgetConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <motion.div
      animate="show"
      className="space-y-6"
      initial="hidden"
      variants={container}
    >
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold">Integraciones</h1>
        <p className="text-default-500 text-sm mt-1">
          Conecta tus redes sociales y servicios externos.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={item}
      >
        {/* Chat Widget Card */}
        <motion.div variants={item}>
          <Card className="border border-divider h-full border-primary/30">
            <CardBody className="gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🌐</div>
                  <div>
                    <p className="text-sm font-semibold">Chat Widget</p>
                    <Chip
                      color={widgetExists && config.enabled ? "success" : "default"}
                      size="sm"
                      startContent={
                        widgetExists && config.enabled ? (
                          <Check size={10} />
                        ) : (
                          <Plug size={10} />
                        )
                      }
                      variant="flat"
                    >
                      {widgetExists && config.enabled
                        ? "Activo"
                        : widgetExists
                          ? "Inactivo"
                          : "No configurado"}
                    </Chip>
                  </div>
                </div>
              </div>
              <p className="text-xs text-default-400">
                Inserta un chat en vivo en cualquier sitio web para interactuar
                con visitantes en tiempo real.
              </p>
              <Button
                className="mt-auto"
                color="primary"
                size="sm"
                variant={widgetExists ? "flat" : "solid"}
                onPress={openDrawer}
              >
                {widgetExists ? "Configurar" : "Activar Widget"}
              </Button>
            </CardBody>
          </Card>
        </motion.div>

        {/* Other Integration Cards */}
        {otherIntegrations.map((integration) => (
          <motion.div key={integration.name} variants={item}>
            <Card className="border border-divider h-full">
              <CardBody className="gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{integration.icon}</div>
                    <div>
                      <p className="text-sm font-semibold">
                        {integration.name}
                      </p>
                      <Chip
                        color={
                          integration.status === "connected"
                            ? "success"
                            : "default"
                        }
                        size="sm"
                        startContent={
                          integration.status === "connected" ? (
                            <Check size={10} />
                          ) : (
                            <Plug size={10} />
                          )
                        }
                        variant="flat"
                      >
                        {integration.status === "connected"
                          ? "Conectado"
                          : "Desconectado"}
                      </Chip>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-default-400">
                  {integration.description}
                </p>
                <Button
                  className="mt-auto"
                  color={
                    integration.status === "connected" ? "default" : "primary"
                  }
                  endContent={
                    integration.status === "connected" ? undefined : (
                      <ExternalLink size={14} />
                    )
                  }
                  size="sm"
                  variant={
                    integration.status === "connected" ? "flat" : "solid"
                  }
                >
                  {integration.status === "connected"
                    ? "Configurar"
                    : "Conectar"}
                </Button>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ====================== WIDGET DRAWER ====================== */}
      <Drawer
        isOpen={drawerOpen}
        placement="right"
        size="xl"
        onOpenChange={setDrawerOpen}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex items-center justify-between border-b border-divider">
                <div>
                  <h2 className="text-lg font-bold">Configurar Chat Widget</h2>
                  <p className="text-xs text-default-500 font-normal">
                    Personaliza y obtén el código de instalación
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {widgetExists && (
                    <>
                      <span className="text-xs text-default-400">Widget</span>
                      <Switch
                        isSelected={config.enabled}
                        size="sm"
                        onValueChange={(v) => updateConfig("enabled", v)}
                      />
                    </>
                  )}
                </div>
              </DrawerHeader>

              <DrawerBody className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Spinner size="lg" />
                  </div>
                ) : (
                  <Tabs
                    classNames={{ tabList: "px-4 pt-2", panel: "px-4 pb-4" }}
                    variant="underlined"
                  >
                    {/* ---- Tab: Diseño ---- */}
                    <Tab
                      key="design"
                      title={
                        <div className="flex items-center gap-1.5">
                          <Palette size={14} />
                          <span>Diseño</span>
                        </div>
                      }
                    >
                      <div className="space-y-5 mt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Título"
                            size="sm"
                            value={config.title}
                            variant="bordered"
                            onValueChange={(v) => updateConfig("title", v)}
                          />
                          <Input
                            label="Subtítulo"
                            size="sm"
                            value={config.subtitle}
                            variant="bordered"
                            onValueChange={(v) => updateConfig("subtitle", v)}
                          />
                        </div>

                        <Input
                          label="URL del avatar / logo"
                          placeholder="https://..."
                          size="sm"
                          value={config.avatarUrl || ""}
                          variant="bordered"
                          onValueChange={(v) => updateConfig("avatarUrl", v)}
                        />

                        <Select
                          label="Posición"
                          selectedKeys={[config.position]}
                          size="sm"
                          variant="bordered"
                          onSelectionChange={(keys) => {
                            const sel = Array.from(keys)[0] as string;
                            if (sel) updateConfig("position", sel);
                          }}
                        >
                          <SelectItem key="right">Derecha</SelectItem>
                          <SelectItem key="left">Izquierda</SelectItem>
                        </Select>

                        <div>
                          <p className="text-sm font-medium mb-2">
                            Color principal
                          </p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {colorPresets.map((c) => (
                              <button
                                key={c.value}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                  config.primaryColor === c.value
                                    ? "border-foreground scale-110"
                                    : "border-transparent hover:scale-105"
                                }`}
                                style={{ backgroundColor: c.value }}
                                title={c.name}
                                onClick={() =>
                                  updateConfig("primaryColor", c.value)
                                }
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              className="w-10 h-8 rounded cursor-pointer border border-divider"
                              type="color"
                              value={config.primaryColor}
                              onChange={(e) =>
                                updateConfig("primaryColor", e.target.value)
                              }
                            />
                            <Input
                              className="w-28"
                              size="sm"
                              value={config.primaryColor}
                              variant="bordered"
                              onValueChange={(v) =>
                                updateConfig("primaryColor", v)
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-2">
                            Color del texto
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              className="w-10 h-8 rounded cursor-pointer border border-divider"
                              type="color"
                              value={config.textColor}
                              onChange={(e) =>
                                updateConfig("textColor", e.target.value)
                              }
                            />
                            <Input
                              className="w-28"
                              size="sm"
                              value={config.textColor}
                              variant="bordered"
                              onValueChange={(v) =>
                                updateConfig("textColor", v)
                              }
                            />
                          </div>
                        </div>

                        {/* Live Preview */}
                        <Divider />
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Eye size={14} className="text-default-500" />
                            <p className="text-sm font-medium">Vista previa</p>
                          </div>
                          <div className="bg-default-100 rounded-lg p-3">
                            <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-[280px] mx-auto">
                              <div
                                className="px-3 py-2.5 flex items-center gap-2"
                                style={{
                                  backgroundColor: config.primaryColor,
                                  color: config.textColor,
                                }}
                              >
                                {config.avatarUrl && (
                                  <img
                                    alt=""
                                    className="w-7 h-7 rounded-full object-cover"
                                    src={config.avatarUrl}
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                    }}
                                  />
                                )}
                                <div>
                                  <p className="text-xs font-semibold">
                                    {config.title || "Chat"}
                                  </p>
                                  <p className="text-[10px] opacity-80">
                                    {config.subtitle || ""}
                                  </p>
                                </div>
                              </div>
                              <div className="p-2.5 space-y-2 min-h-[120px]" style={{ background: '#f0f2f5' }}>
                                <div className="flex justify-start">
                                  <div className="flex flex-col gap-0.5 max-w-[90%]">
                                    <div className="bg-white rounded-lg px-2.5 py-1.5">
                                      <p className="text-[10px] text-gray-800">
                                        {config.welcomeMessage ||
                                          "¡Hola! ¿En qué podemos ayudarte?"}
                                      </p>
                                    </div>
                                    <span className="text-[8px] text-gray-500 px-1">10:30</span>
                                  </div>
                                </div>
                                <div className="flex justify-end">
                                  <div className="flex flex-col gap-0.5 max-w-[90%] items-end">
                                    <div className="rounded-lg px-2.5 py-1.5" style={{ backgroundColor: config.primaryColor, color: 'white' }}>
                                      <p className="text-[10px]">
                                        Hola, necesito ayuda
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 px-1">
                                      <span className="text-[8px] text-gray-500">10:31</span>
                                      <svg width="12" height="9" viewBox="0 0 16 11" fill="#53bdeb">
                                        <path d="M11.766.522A.75.75 0 0 0 10.732.5L6.232 5l-1.982-1.982a.75.75 0 0 0-1.06 1.06l2.5 2.5a.75.75 0 0 0 1.06 0l5-5a.75.75 0 0 0 .016-1.056zm3.5 0a.75.75 0 0 0-1.034-.022l-5 5a.75.75 0 0 0 1.06 1.06l5-5a.75.75 0 0 0-.026-1.038z"/>
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-start">
                                  <div className="flex flex-col gap-0.5 max-w-[90%]">
                                    <div className="bg-white rounded-lg px-2.5 py-1.5">
                                      <p className="text-[10px] text-gray-800">
                                        Claro, estamos aquí para ayudarte
                                      </p>
                                    </div>
                                    <span className="text-[8px] text-gray-500 px-1">10:32</span>
                                  </div>
                                </div>
                              </div>
                              {config.showBranding && (
                                <div className="text-center py-1 bg-gray-50 border-t border-gray-100">
                                  <p className="text-[8px] text-gray-400">
                                    Powered by <strong>CconeHub</strong>
                                  </p>
                                </div>
                              )}
                            </div>
                            <div
                              className={`mt-2 flex ${config.position === "right" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
                                style={{
                                  backgroundColor: config.primaryColor,
                                }}
                              >
                                <svg
                                  fill="none"
                                  height="18"
                                  stroke={config.textColor}
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                  width="18"
                                >
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Tab>

                    {/* ---- Tab: Mensajes ---- */}
                    <Tab
                      key="messages"
                      title={
                        <div className="flex items-center gap-1.5">
                          <MessageSquare size={14} />
                          <span>Mensajes</span>
                        </div>
                      }
                    >
                      <div className="space-y-5 mt-2">
                        <div>
                          <p className="text-sm font-medium mb-1">
                            Mensaje de bienvenida
                          </p>
                          <p className="text-xs text-default-400 mb-2">
                            Se envía automáticamente al abrir el chat.
                          </p>
                          <textarea
                            className="w-full h-20 p-2.5 rounded-lg border border-divider bg-content2 text-sm resize-y"
                            value={config.welcomeMessage}
                            onChange={(e) =>
                              updateConfig("welcomeMessage", e.target.value)
                            }
                          />
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-1">
                            Mensaje fuera de línea
                          </p>
                          <p className="text-xs text-default-400 mb-2">
                            Se muestra cuando no hay agentes disponibles.
                          </p>
                          <textarea
                            className="w-full h-20 p-2.5 rounded-lg border border-divider bg-content2 text-sm resize-y"
                            value={config.offlineMessage || ""}
                            onChange={(e) =>
                              updateConfig("offlineMessage", e.target.value)
                            }
                          />
                        </div>

                        <Divider />

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                Solicitar email
                              </p>
                              <p className="text-xs text-default-400">
                                Pedir email antes de iniciar el chat
                              </p>
                            </div>
                            <Switch
                              isSelected={config.collectEmail}
                              size="sm"
                              onValueChange={(v) =>
                                updateConfig("collectEmail", v)
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                Solicitar teléfono
                              </p>
                              <p className="text-xs text-default-400">
                                Pedir número de teléfono
                              </p>
                            </div>
                            <Switch
                              isSelected={config.collectPhone}
                              size="sm"
                              onValueChange={(v) =>
                                updateConfig("collectPhone", v)
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                Mostrar branding
                              </p>
                              <p className="text-xs text-default-400">
                                &quot;Powered by CconeHub&quot;
                              </p>
                            </div>
                            <Switch
                              isSelected={config.showBranding}
                              size="sm"
                              onValueChange={(v) =>
                                updateConfig("showBranding", v)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </Tab>

                    {/* ---- Tab: Instalación ---- */}
                    <Tab
                      key="install"
                      title={
                        <div className="flex items-center gap-1.5">
                          <Code size={14} />
                          <span>Instalación</span>
                        </div>
                      }
                    >
                      <div className="space-y-5 mt-2">
                        {!widgetExists ? (
                          <div className="text-center py-8">
                            <Code
                              className="mx-auto mb-3 text-default-300"
                              size={40}
                            />
                            <p className="text-sm font-medium mb-1">
                              Guarda primero la configuración
                            </p>
                            <p className="text-xs text-default-400 mb-3">
                              Configura el diseño y mensajes, luego guarda para
                              obtener el código.
                            </p>
                            <Button
                              color="primary"
                              size="sm"
                              onPress={handleSave}
                            >
                              Crear y Guardar
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium">Widget ID</p>
                                <Button
                                  color="warning"
                                  size="sm"
                                  startContent={<RefreshCw size={12} />}
                                  variant="flat"
                                  onPress={handleRegenerateId}
                                >
                                  Regenerar
                                </Button>
                              </div>
                              <code className="block px-3 py-2 bg-content2 rounded-lg text-xs font-mono break-all">
                                {config.widgetId}
                              </code>
                              <p className="text-[10px] text-warning mt-1">
                                Regenerar invalidará instalaciones existentes.
                              </p>
                            </div>

                            <Divider />

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium">
                                  Código de instalación
                                </p>
                                <Button
                                  color="primary"
                                  size="sm"
                                  startContent={
                                    copied ? (
                                      <Check size={12} />
                                    ) : (
                                      <Copy size={12} />
                                    )
                                  }
                                  variant="flat"
                                  onPress={handleCopyScript}
                                >
                                  {copied ? "¡Copiado!" : "Copiar"}
                                </Button>
                              </div>
                              <p className="text-xs text-default-400 mb-2">
                                Pega este código antes de{" "}
                                <code className="text-primary">
                                  &lt;/body&gt;
                                </code>{" "}
                                en tu sitio web.
                              </p>
                              <pre className="p-3 bg-content2 rounded-lg text-[11px] font-mono overflow-x-auto whitespace-pre-wrap break-all border border-divider max-h-40 overflow-y-auto">
                                {scriptCode}
                              </pre>
                            </div>

                            <Divider />

                            <div>
                              <p className="text-sm font-medium mb-2">
                                Dominios permitidos
                              </p>
                              <p className="text-xs text-default-400 mb-2">
                                Vacío = todos los dominios permitidos.
                              </p>
                              <Input
                                placeholder="ejemplo.com, miapp.com"
                                size="sm"
                                value={domainsInput}
                                variant="bordered"
                                onValueChange={setDomainsInput}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </Tab>
                  </Tabs>
                )}
              </DrawerBody>

              <DrawerFooter className="border-t border-divider">
                <Button variant="light" onPress={onClose}>
                  Cerrar
                </Button>
                <Button
                  color="primary"
                  isLoading={saving}
                  startContent={<Save size={14} />}
                  onPress={handleSave}
                >
                  {widgetExists ? "Guardar Cambios" : "Crear Widget"}
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </motion.div>
  );
}
