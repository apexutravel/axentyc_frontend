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
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { motion } from "framer-motion";
import { toast } from "sonner";
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
  EyeOff,
  Save,
  X,
  Mail,
  Facebook,
  Trash2,
  HelpCircle,
  ChevronRight,
  Globe,
  Key,
  Link2,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Instagram,
  Layers3,
  Radio,
} from "lucide-react";
import { api } from "@/lib/api";
import EmailAccountsSection from "@/components/integrations/EmailAccountsSection";
import type { EmailAccount } from "@/lib/email-accounts";
import { API_ENDPOINTS } from "@/config/api";
import { BillingService } from "@/lib/billing";
import { useWorkspaces } from "@/contexts/WorkspaceContext";

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
      "Conecta números de WhatsApp Business cuando esté disponible.",
    icon: "💬",
    status: "coming_soon" as const,
  },
  {
    name: "TikTok",
    description: "Recibe mensajes y comentarios de TikTok Business.",
    icon: "🎵",
    status: "coming_soon" as const,
  },
  {
    name: "Stripe",
    description: "Procesa pagos y gestiona suscripciones.",
    icon: "💳",
    status: "coming_soon" as const,
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
  const { activeWorkspace } = useWorkspaces();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [config, setConfig] = useState<WidgetConfig>(defaultConfig);
  const [scriptCode, setScriptCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [widgetExists, setWidgetExists] = useState(false);
  const fbGuide = useDisclosure();
  const [domainsInput, setDomainsInput] = useState("");

  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [connectedAssetsUsage, setConnectedAssetsUsage] = useState<{ total: number; socialAccounts: number; emailIntegrations: number; widgets: number } | null>(null);
  const [connectedAssetsLimit, setConnectedAssetsLimit] = useState<number | null>(null);

  // --- Facebook Integration State ---
  type FbAccount = {
    _id: string;
    accountName: string;
    pageId?: string;
    accountId?: string;
    platform: 'facebook' | 'instagram';
    status: string;
    metadata?: { 
      picture?: string; 
      category?: string;
      linkedPageId?: string;
      profilePicture?: string;
      followersCount?: number;
    };
  };
  type FbStatus = { connected: boolean; accounts: FbAccount[] };

  const [fbStatus, setFbStatus] = useState<FbStatus>({ connected: false, accounts: [] });
  const [fbConnecting, setFbConnecting] = useState(false);
  const [fbDisconnecting, setFbDisconnecting] = useState(false);
  const [fbConfigExists, setFbConfigExists] = useState(false);
  const [fbWebhookUrl, setFbWebhookUrl] = useState('');
  const [fbConsentModalOpen, setFbConsentModalOpen] = useState(false);
  const [fbDeleteConfirmId, setFbDeleteConfirmId] = useState<string | null>(null);

  const loadFacebookConfig = useCallback(async () => {
    try {
      const res = await api.get<any>(API_ENDPOINTS.integrations.facebook.config);
      const data = (res as any)?.data ?? res;
      // Facebook is now globally configured - just check if available
      setFbConfigExists(data.available || false);
      setFbWebhookUrl(data.webhookUrl || '');
    } catch {
      setFbConfigExists(false);
    }
  }, []);

  const loadFacebookStatus = useCallback(async () => {
    try {
      const res = await api.get<FbStatus>(API_ENDPOINTS.integrations.facebook.status);
      const data = (res as any)?.data ?? res;
      setFbStatus(data as FbStatus);
    } catch {
      setFbStatus({ connected: false, accounts: [] });
    }
  }, []);

  const loadBillingUsage = useCallback(async () => {
    try {
      const res = await BillingService.subscription();
      const data = (res as any)?.data ?? res;
      setConnectedAssetsUsage(data?.usage?.connectedAssets || null);
      setConnectedAssetsLimit(data?.plan?.limits?.maxConnectedAssets ?? null);
    } catch {
      setConnectedAssetsUsage(null);
      setConnectedAssetsLimit(null);
    }
  }, []);

  const connectFacebook = async () => {
    if (!fbConfigExists) {
      toast.error('La integración de Facebook no está disponible. Contacta al administrador.');
      return;
    }
    // Show consent modal first
    setFbConsentModalOpen(true);
  };

  const proceedWithFacebookOAuth = async () => {
    setFbConsentModalOpen(false);
    setFbConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/integrations/facebook/callback`;
      const res = await api.get<any>(
        `${API_ENDPOINTS.integrations.facebook.oauthUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`
      );
      const data = (res as any)?.data ?? res;
      if (data?.error) {
        toast.error(data.error);
        setFbConnecting(false);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Error al iniciar conexión con Facebook");
      setFbConnecting(false);
    }
  };

  const disconnectFacebook = async (accountId: string) => {
    setFbDeleteConfirmId(accountId);
  };

  const confirmDisconnectFacebook = async () => {
    if (!fbDeleteConfirmId) return;
    setFbDisconnecting(true);
    try {
      await api.post(API_ENDPOINTS.integrations.facebook.disconnect(fbDeleteConfirmId), {});
      toast.success("Facebook Messenger desconectado");
      await loadFacebookStatus();
      await loadBillingUsage();
      setFbDeleteConfirmId(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Error al desconectar");
    } finally {
      setFbDisconnecting(false);
    }
  };

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

  useEffect(() => {
    loadFacebookConfig();
    loadFacebookStatus();
    loadBillingUsage();
  }, [loadFacebookConfig, loadFacebookStatus, loadBillingUsage]);

  const openDrawer = () => {
    setSaveFeedback(null);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    setSaveFeedback(null);
    setSaving(true);
    try {
      const payload: any = {
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

      const successMessage = widgetExists
        ? "Configuración guardada correctamente."
        : "Widget creado y guardado correctamente.";
      setSaveFeedback({
        type: "success",
        message: successMessage,
      });
      toast.success(successMessage);

      await loadWidgetConfig();
      await loadBillingUsage();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al guardar la configuración.";
      setSaveFeedback({
        type: "error",
        message: errorMessage,
      });
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateId = async () => {
    try {
      await api.post(API_ENDPOINTS.widget.regenerate);
      toast.success("Widget ID regenerado");
      await loadWidgetConfig();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Error al regenerar");
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    toast.success("Script copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const updateConfig = (key: keyof WidgetConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const connectedMetaChannels = fbStatus.accounts.filter((account) => account.status === "connected").length;
  const connectedChannelsTotal = connectedAssetsUsage?.total ?? connectedMetaChannels + emailAccounts.filter((a) => a.status === "connected").length + (widgetExists ? 1 : 0);
  const connectedChannelsLimit = connectedAssetsLimit ?? 0;
  const usagePercent = connectedChannelsLimit > 0
    ? Math.min((connectedChannelsTotal / connectedChannelsLimit) * 100, 100)
    : 0;

  return (
    <motion.div
      animate="show"
      className="space-y-6"
      initial="hidden"
      variants={container}
    >
      <motion.div variants={item}>
        <section className="relative overflow-hidden rounded-3xl border border-divider bg-gradient-to-br from-primary/15 via-content1 to-secondary/10 p-6 md:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Chip color="primary" startContent={<Radio size={14} />} variant="flat">
                Canales del workspace
              </Chip>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">Integraciones</h1>
              <p className="mt-2 text-sm text-default-500 md:text-base">
                Conecta los canales de comunicación de {activeWorkspace?.name || "este workspace"}: Facebook, Instagram, email y widget web. Cada canal conectado consume cupo del plan.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[620px]">
              <ChannelStat label="Usados" value={`${connectedChannelsTotal}/${connectedChannelsLimit || "-"}`} />
              <ChannelStat label="Social" value={String(connectedMetaChannels)} />
              <ChannelStat label="Email" value={String(emailAccounts.filter((a) => a.status === "connected").length)} />
              <ChannelStat label="Widget" value={widgetExists ? "1" : "0"} />
            </div>
          </div>
          <div className="relative mt-6">
            <div className="mb-2 flex items-center justify-between text-xs text-default-500">
              <span>Cupo de canales conectados</span>
              <span>{Math.round(usagePercent)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-default-100">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${usagePercent}%` }} />
            </div>
          </div>
        </section>
      </motion.div>

      <motion.div className="flex items-center gap-3" variants={item}>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Layers3 size={20} />
        </div>
        <div>
          <h2 className="text-lg font-black">Canales disponibles</h2>
          <p className="text-sm text-default-500">Gestiona conexiones existentes sin cambiar la lógica que ya funciona.</p>
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={item}
      >
        {/* Email accounts card (list is managed in a modal) */}
        <motion.div variants={item}>
          <EmailAccountsSection
            onChange={(accounts) => {
              setEmailAccounts((prev) => {
                // refresh plan usage only when the number of active mailboxes changed
                const count = (list: EmailAccount[]) => list.filter((a) => a.status !== "disconnected").length;
                if (count(prev) !== count(accounts)) loadBillingUsage();
                return accounts;
              });
            }}
          />
        </motion.div>

        {/* Facebook + Instagram Card */}
        <motion.div variants={item}>
          <Card className={`border h-full ${fbStatus.connected ? 'border-blue-500/30' : 'border-divider'}`}>
            <CardBody className="gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/10 to-pink-500/10 flex items-center justify-center">
                    <Facebook size={18} className="text-blue-500" />
                    <Instagram size={14} className="text-pink-500 -ml-1 -mb-1" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Facebook e Instagram</p>
                    <Chip
                      color={fbStatus.connected ? 'success' : 'default'}
                      size="sm"
                      startContent={fbStatus.connected ? <Check size={10} /> : <Plug size={10} />}
                      variant="flat"
                    >
                      {fbStatus.connected ? 'Conectado' : 'Desconectado'}
                    </Chip>
                  </div>
                </div>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  className="min-w-7 w-7 h-7 text-default-400 hover:text-blue-500"
                  onPress={fbGuide.onOpen}
                >
                  <HelpCircle size={16} />
                </Button>
              </div>

              {/* Connected accounts - grouped by page */}
              {(() => {
                const connected = fbStatus.accounts.filter(a => a.status === 'connected');
                if (connected.length === 0) return null;

                // Group: FB pages with their linked IG accounts
                const fbPages = connected.filter(a => a.platform === 'facebook');
                const igAccounts = connected.filter(a => a.platform === 'instagram');
                const igByPageId = new Map(igAccounts.map(ig => [ig.pageId, ig]));
                const standaloneIg = igAccounts.filter(ig => !fbPages.some(fb => fb.pageId === ig.pageId));

                return (
                  <div className="space-y-2">
                    {fbPages.map((fb) => {
                      const ig = igByPageId.get(fb.pageId);
                      return (
                        <div key={fb._id} className="bg-default-50 dark:bg-default-100/50 rounded-lg px-2.5 py-2 space-y-1.5">
                          {/* Facebook page row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <Facebook size={14} className="text-blue-500 flex-shrink-0" />
                              {(fb.metadata?.picture) && (
                                <img src={fb.metadata.picture} alt="" className="w-5 h-5 rounded-full flex-shrink-0" />
                              )}
                              <span className="text-xs font-medium truncate">{fb.accountName}</span>
                              <Chip size="sm" variant="flat" className="text-[9px] h-4">Messenger</Chip>
                            </div>
                            <Button
                              size="sm" variant="light" color="danger" isIconOnly
                              className="min-w-6 w-6 h-6 flex-shrink-0"
                              isLoading={fbDisconnecting}
                              onPress={() => disconnectFacebook(fb._id)}
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                          {/* Linked Instagram row */}
                          {ig && (
                            <div className="flex items-center justify-between pl-5 border-l-2 border-pink-500/20 ml-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <Instagram size={14} className="text-pink-500 flex-shrink-0" />
                                {(ig.metadata?.profilePicture) && (
                                  <img src={ig.metadata.profilePicture} alt="" className="w-5 h-5 rounded-full flex-shrink-0" />
                                )}
                                <span className="text-xs font-medium truncate">@{ig.accountName}</span>
                                {ig.metadata?.followersCount != null && (
                                  <span className="text-[10px] text-default-400">{ig.metadata.followersCount.toLocaleString()}</span>
                                )}
                                <Chip size="sm" color="secondary" variant="flat" className="text-[9px] h-4">IG DMs</Chip>
                              </div>
                              <Button
                                size="sm" variant="light" color="danger" isIconOnly
                                className="min-w-6 w-6 h-6 flex-shrink-0"
                                isLoading={fbDisconnecting}
                                onPress={() => disconnectFacebook(ig._id)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {/* Standalone Instagram accounts (no linked FB page found) */}
                    {standaloneIg.map((ig) => (
                      <div key={ig._id} className="bg-default-50 dark:bg-default-100/50 rounded-lg px-2.5 py-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Instagram size={14} className="text-pink-500 flex-shrink-0" />
                            {(ig.metadata?.profilePicture) && (
                              <img src={ig.metadata.profilePicture} alt="" className="w-5 h-5 rounded-full flex-shrink-0" />
                            )}
                            <span className="text-xs font-medium truncate">@{ig.accountName}</span>
                            <Chip size="sm" color="secondary" variant="flat" className="text-[9px] h-4">IG DMs</Chip>
                          </div>
                          <Button
                            size="sm" variant="light" color="danger" isIconOnly
                            className="min-w-6 w-6 h-6 flex-shrink-0"
                            isLoading={fbDisconnecting}
                            onPress={() => disconnectFacebook(ig._id)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <p className="text-xs text-default-400">
                Conecta páginas de Facebook e Instagram vinculados. Una página consume 1 canal; si tiene Instagram vinculado y se activa, consume otro canal. Messenger, DMs y comentarios quedan incluidos.
              </p>
              
              {!fbConfigExists && (
                <div className="bg-warning/10 border border-warning/30 rounded-lg px-3 py-2">
                  <p className="text-xs text-warning">⚠️ Integración no disponible. Contacta al administrador.</p>
                </div>
              )}

              <div className="mt-auto flex gap-2">
                <Button
                  color="primary"
                  size="sm"
                  isLoading={fbConnecting}
                  isDisabled={!fbConfigExists}
                  onPress={connectFacebook}
                >
                  {fbStatus.connected ? 'Agregar canal' : 'Conectar Facebook'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </motion.div>

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
                {widgetExists && (
                  <Switch
                    size="sm"
                    isSelected={config.enabled}
                    onValueChange={async (checked) => {
                      const previousState = config.enabled;
                      setConfig({ ...config, enabled: checked });
                      try {
                        await api.post(API_ENDPOINTS.widget.save, { enabled: checked });
                        toast.success(checked ? "Widget activado" : "Widget desactivado");
                      } catch (e: any) {
                        toast.error(e?.response?.data?.message || "Error al actualizar widget");
                        setConfig({ ...config, enabled: previousState });
                      }
                    }}
                  />
                )}
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
            <Card className="border border-divider h-full opacity-60">
              <CardBody className="gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{integration.icon}</div>
                    <div>
                      <p className="text-sm font-semibold">
                        {integration.name}
                      </p>
                      <Chip
                        color="default"
                        size="sm"
                        variant="flat"
                      >
                        Próximamente
                      </Chip>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-default-400">
                  {integration.description}
                </p>
                <Button
                  className="mt-auto"
                  color="default"
                  size="sm"
                  variant="flat"
                  isDisabled
                >
                  Próximamente
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
                  <>
                    {saveFeedback && (
                      <div
                        className={`mx-4 mt-4 rounded-lg border px-3 py-2 text-sm ${
                          saveFeedback.type === "success"
                            ? "border-success-200 bg-success-50 text-success-700"
                            : "border-danger-200 bg-danger-50 text-danger-700"
                        }`}
                      >
                        {saveFeedback.message}
                      </div>
                    )}
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
                              <div className="p-2.5 space-y-2 min-h-[120px] bg-default-100">
                                <div className="flex justify-start">
                                  <div className="flex flex-col gap-0.5 max-w-[90%]">
                                    <div className="bg-content1 rounded-lg px-2.5 py-1.5 shadow-sm">
                                      <p className="text-[10px] text-foreground">
                                        {config.welcomeMessage ||
                                          "¡Hola! ¿En qué podemos ayudarte?"}
                                      </p>
                                    </div>
                                    <span className="text-[8px] text-default-500 px-1">10:30</span>
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
                                      <span className="text-[8px] text-default-500">10:31</span>
                                      <svg width="12" height="9" viewBox="0 0 16 11" fill="#53bdeb">
                                        <path d="M11.766.522A.75.75 0 0 0 10.732.5L6.232 5l-1.982-1.982a.75.75 0 0 0-1.06 1.06l2.5 2.5a.75.75 0 0 0 1.06 0l5-5a.75.75 0 0 0 .016-1.056zm3.5 0a.75.75 0 0 0-1.034-.022l-5 5a.75.75 0 0 0 1.06 1.06l5-5a.75.75 0 0 0-.026-1.038z"/>
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-start">
                                  <div className="flex flex-col gap-0.5 max-w-[90%]">
                                    <div className="bg-content1 rounded-lg px-2.5 py-1.5 shadow-sm">
                                      <p className="text-[10px] text-foreground">
                                        Claro, estamos aquí para ayudarte
                                      </p>
                                    </div>
                                    <span className="text-[8px] text-default-500 px-1">10:32</span>
                                  </div>
                                </div>
                              </div>
                              {config.showBranding && (
                                <div className="text-center py-1 bg-content1 border-t border-divider">
                                  <p className="text-[8px] text-default-400">
                                    Powered by <strong>AXENTYC</strong>
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
                                &quot;Powered by AXENTYC&quot;
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
                  </>
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

      {/* ====================== FACEBOOK GUIDE MODAL ====================== */}
      <Modal
        isOpen={fbGuide.isOpen}
        onOpenChange={fbGuide.onOpenChange}
        size="3xl"
        scrollBehavior="inside"
        classNames={{ body: "p-0" }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2 border-b border-divider pb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Facebook size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold">Guía de Configuración — Facebook Messenger</h2>
                  <p className="text-xs text-default-500 font-normal">Sigue estos pasos para conectar tu página de Facebook</p>
                </div>
              </ModalHeader>
              <ModalBody>
                <Accordion
                  selectionMode="multiple"
                  defaultExpandedKeys={["step1"]}
                  variant="splitted"
                  className="px-4 py-3 gap-2"
                >
                  {/* PASO 1 */}
                  <AccordionItem
                    key="step1"
                    aria-label="Paso 1"
                    startContent={
                      <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">1</div>
                    }
                    title={<span className="text-sm font-semibold">Crear una App en Meta for Developers</span>}
                    subtitle={<span className="text-xs text-default-400">Necesitas una app de Meta para conectar Messenger</span>}
                  >
                    <div className="space-y-3 text-sm text-default-600 pb-2">
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Ve a <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline font-medium">developers.facebook.com/apps</a> e inicia sesión con tu cuenta de Facebook.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Haz clic en <strong className="text-foreground">&quot;Mis aplicaciones&quot;</strong> (menú superior) y luego en <strong className="text-foreground">&quot;Crear app&quot;</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Selecciona los <strong className="text-foreground">casos de uso</strong> que necesitas. Para Messenger, asegúrate de marcar <strong className="text-foreground">&quot;Otros&quot;</strong> o la opción que incluya mensajería empresarial.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Completa el <strong className="text-foreground">nombre de la app</strong> (ej: &quot;Mi CRM&quot;) y tu <strong className="text-foreground">correo electrónico de contacto</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Si se te pide, asocia un <strong className="text-foreground">portafolio de negocio</strong> (Business Portfolio) o créalo nuevo.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Haz clic en <strong className="text-foreground">&quot;Crear app&quot;</strong> para finalizar.</span>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5 mt-2">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          <strong>Nota:</strong> Si ya tienes una app creada, puedes usar esa misma. Solo necesitas una app por empresa.
                        </p>
                      </div>
                    </div>
                  </AccordionItem>

                  {/* PASO 2 */}
                  <AccordionItem
                    key="step2"
                    aria-label="Paso 2"
                    startContent={
                      <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                    }
                    title={<span className="text-sm font-semibold">Obtener App ID y Clave Secreta</span>}
                    subtitle={<span className="text-xs text-default-400">Credenciales necesarias para la integración</span>}
                  >
                    <div className="space-y-3 text-sm text-default-600 pb-2">
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Dentro de tu app, en el menú lateral izquierdo busca <strong className="text-foreground">Configuración de la aplicación</strong> y haz clic en <strong className="text-foreground">&quot;Información básica&quot;</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Key size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>En la parte superior verás el <strong className="text-foreground">Identificador de la aplicación</strong> — es un número largo como <code className="bg-default-100 px-1.5 py-0.5 rounded text-xs">955611273659322</code>. Cópialo.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Key size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Junto a <strong className="text-foreground">&quot;Clave secreta de la aplicación&quot;</strong> haz clic en el botón <strong className="text-foreground">&quot;Mostrar&quot;</strong>. Ingresa tu contraseña de Facebook si se solicita y copia la clave secreta.</span>
                      </div>
                      <div className="bg-default-50 dark:bg-default-100/50 rounded-lg p-3 mt-2 space-y-1">
                        <p className="text-[10px] text-default-400 font-semibold uppercase">En esta misma página también encontrarás:</p>
                        <p className="text-xs">• <strong>Nombre para mostrar</strong> — el nombre de tu app</p>
                        <p className="text-xs">• <strong>Dominios de la aplicación</strong> — tu dominio (ej: <code className="bg-default-100 px-1 rounded text-[11px]">tudominio.com</code>)</p>
                        <p className="text-xs">• <strong>URL de la Política de privacidad</strong> — necesaria para publicar la app</p>
                      </div>
                      <div className="bg-warning-50 dark:bg-warning-950/30 border border-warning-200 dark:border-warning-800 rounded-lg p-2.5 mt-2">
                        <p className="text-xs text-warning-600 dark:text-warning-400">
                          <AlertTriangle size={12} className="inline mr-1" />
                          <strong>Importante:</strong> Nunca compartas tu Clave Secreta con nadie. Se almacena de forma segura en nuestro sistema.
                        </p>
                      </div>
                    </div>
                  </AccordionItem>

                  {/* PASO 3 */}
                  <AccordionItem
                    key="step3"
                    aria-label="Paso 3"
                    startContent={
                      <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">3</div>
                    }
                    title={<span className="text-sm font-semibold">Guardar credenciales en el CRM</span>}
                    subtitle={<span className="text-xs text-default-400">Ingresa tu App ID y Clave Secreta aquí</span>}
                  >
                    <div className="space-y-3 text-sm text-default-600 pb-2">
                      <div className="flex items-start gap-2">
                        <Settings size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>En la tarjeta de <strong className="text-foreground">Facebook Messenger</strong>, haz clic en el botón <strong className="text-foreground">&quot;Configurar App&quot;</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Se abrirá un panel lateral donde debes ingresar:</span>
                      </div>
                      <div className="ml-6 space-y-1.5">
                        <p className="text-xs"><strong className="text-foreground">App ID:</strong> El Identificador de la aplicación que copiaste en el paso 2.</p>
                        <p className="text-xs"><strong className="text-foreground">App Secret:</strong> La Clave secreta que copiaste en el paso 2.</p>
                        <p className="text-xs"><strong className="text-foreground">Verify Token:</strong> Inventa un texto seguro (ej: <code className="bg-default-100 px-1 rounded">mi_empresa_fb_2024</code>). Lo necesitarás en el paso 5.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Haz clic en <strong className="text-foreground">&quot;Guardar Configuración&quot;</strong>.</span>
                      </div>
                      <div className="bg-success-50 dark:bg-success-950/30 border border-success-200 dark:border-success-800 rounded-lg p-2.5 mt-2">
                        <p className="text-xs text-success-600 dark:text-success-400">
                          <CheckCircle2 size={12} className="inline mr-1" />
                          Después de guardar, verás un recuadro verde con la <strong>Webhook URL</strong>, el <strong>Verify Token</strong> y los <strong>Campos del webhook</strong> listos para copiar.
                        </p>
                      </div>
                    </div>
                  </AccordionItem>

                  {/* PASO 4 */}
                  <AccordionItem
                    key="step4"
                    aria-label="Paso 4"
                    startContent={
                      <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">4</div>
                    }
                    title={<span className="text-sm font-semibold">Activar el caso de uso de Messenger</span>}
                    subtitle={<span className="text-xs text-default-400">Habilitar Messenger en tu app de Meta</span>}
                  >
                    <div className="space-y-3 text-sm text-default-600 pb-2">
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>En tu app de Meta, haz clic en <strong className="text-foreground">&quot;Casos de uso&quot;</strong> en el menú lateral izquierdo.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Verás una lista de casos de uso disponibles. Busca el que dice:</span>
                      </div>
                      <div className="ml-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">&quot;Interactúa con los clientes en Messenger from Meta&quot;</p>
                        <p className="text-[11px] text-blue-600/70 dark:text-blue-400/70 mt-0.5">Responde a los mensajes que recibe la página de Facebook de tu empresa.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Haz clic en el botón <strong className="text-foreground">&quot;Personalizar&quot;</strong> que aparece al lado derecho del caso de uso de Messenger.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Si el caso de uso no aparece en la lista, haz clic en <strong className="text-foreground">&quot;Añadir casos de uso&quot;</strong> (esquina superior derecha) y agrégalo.</span>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5 mt-2">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          <strong>Nota:</strong> Dentro de Personalizar podrás configurar los webhooks y permisos necesarios para Messenger.
                        </p>
                      </div>
                    </div>
                  </AccordionItem>

                  {/* PASO 5 */}
                  <AccordionItem
                    key="step5"
                    aria-label="Paso 5"
                    startContent={
                      <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">5</div>
                    }
                    title={<span className="text-sm font-semibold">Configurar el Webhook</span>}
                    subtitle={<span className="text-xs text-default-400">Conectar Facebook con tu servidor</span>}
                  >
                    <div className="space-y-3 text-sm text-default-600 pb-2">
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Dentro de la personalización de Messenger, busca la sección de <strong className="text-foreground">&quot;Webhooks&quot;</strong> o <strong className="text-foreground">&quot;Configurar la URL de devolución de llamada&quot;</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Haz clic en <strong className="text-foreground">&quot;Configurar&quot;</strong> o <strong className="text-foreground">&quot;Editar&quot;</strong> para abrir el formulario del webhook.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Link2 size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Completa los dos campos del formulario:</span>
                      </div>
                      <div className="ml-6 bg-default-50 dark:bg-default-100/50 rounded-lg p-3 space-y-2">
                        <div>
                          <p className="text-[10px] text-default-400 font-semibold uppercase">URL de devolución de llamada (Callback URL):</p>
                          <p className="text-xs mt-0.5">Copia la <strong>Webhook URL</strong> desde el panel &quot;Configurar App&quot; del CRM (recuadro verde, paso 3).</p>
                        </div>
                        <Divider />
                        <div>
                          <p className="text-[10px] text-default-400 font-semibold uppercase">Token de verificación (Verify Token):</p>
                          <p className="text-xs mt-0.5">Copia el <strong>Verify Token</strong> desde el mismo panel del CRM. Debe ser <strong>exactamente igual</strong>, sin espacios extra.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Haz clic en <strong className="text-foreground">&quot;Verificar y guardar&quot;</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Una vez verificado, activa las <strong className="text-foreground">suscripciones</strong> (Webhook Fields) para tu página:</span>
                      </div>
                      <div className="ml-6 grid grid-cols-2 gap-1">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-success" />
                          <code className="text-xs bg-default-100 px-1.5 py-0.5 rounded">messages</code>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-success" />
                          <code className="text-xs bg-default-100 px-1.5 py-0.5 rounded">messaging_postbacks</code>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-success" />
                          <code className="text-xs bg-default-100 px-1.5 py-0.5 rounded">message_reads</code>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-success" />
                          <code className="text-xs bg-default-100 px-1.5 py-0.5 rounded">message_deliveries</code>
                        </div>
                      </div>
                      <div className="bg-success-50 dark:bg-success-950/30 border border-success-200 dark:border-success-800 rounded-lg p-2.5 mt-2">
                        <p className="text-xs text-success-600 dark:text-success-400">
                          <CheckCircle2 size={12} className="inline mr-1" />
                          Si todo está correcto, Facebook verificará automáticamente tu servidor y guardará la configuración.
                        </p>
                      </div>
                    </div>
                  </AccordionItem>

                  {/* PASO 6 - PERMISOS */}
                  <AccordionItem
                    key="step6"
                    aria-label="Paso 6"
                    startContent={
                      <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">6</div>
                    }
                    title={<span className="text-sm font-semibold">Configurar Permisos de la App</span>}
                    subtitle={<span className="text-xs text-default-400">Permisos necesarios para enviar y recibir mensajes</span>}
                  >
                    <div className="space-y-3 text-sm text-default-600 pb-2">
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Dentro de <strong className="text-foreground">Casos de uso → Messenger → Personalizar</strong>, busca la sección de <strong className="text-foreground">&quot;Permisos&quot;</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Debes agregar y activar los siguientes permisos:</span>
                      </div>
                      <div className="ml-6 bg-default-50 dark:bg-default-100/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-success shrink-0" />
                          <div>
                            <code className="text-xs bg-default-100 px-1.5 py-0.5 rounded font-semibold">pages_messaging</code>
                            <p className="text-[11px] text-default-400 mt-0.5">Permite enviar y recibir mensajes por Messenger. <strong className="text-foreground">Obligatorio.</strong></p>
                          </div>
                        </div>
                        <Divider />
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-success shrink-0" />
                          <div>
                            <code className="text-xs bg-default-100 px-1.5 py-0.5 rounded font-semibold">pages_read_engagement</code>
                            <p className="text-[11px] text-default-400 mt-0.5">Permite leer información de tu página de Facebook.</p>
                          </div>
                        </div>
                        <Divider />
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-success shrink-0" />
                          <div>
                            <code className="text-xs bg-default-100 px-1.5 py-0.5 rounded font-semibold">pages_manage_metadata</code>
                            <p className="text-[11px] text-default-400 mt-0.5">Permite suscribir la página al webhook para recibir eventos.</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Para cada permiso, haz clic en <strong className="text-foreground">&quot;Agregar&quot;</strong> o activa el toggle correspondiente.</span>
                      </div>

                      <div className="bg-warning-50 dark:bg-warning-950/30 border border-warning-200 dark:border-warning-800 rounded-lg p-2.5 mt-2 space-y-1.5">
                        <p className="text-xs text-warning-600 dark:text-warning-400">
                          <AlertTriangle size={12} className="inline mr-1" />
                          <strong>Modo desarrollo vs. Producción:</strong>
                        </p>
                        <p className="text-xs text-warning-600 dark:text-warning-400">
                          • En <strong>modo desarrollo</strong>, estos permisos funcionan sin revisión, pero <strong>solo para administradores y testers</strong> de la app.
                        </p>
                        <p className="text-xs text-warning-600 dark:text-warning-400">
                          • Para que <strong>cualquier cliente</strong> pueda escribirte por Messenger, debes enviar la app a <strong>Revisión de la aplicación</strong> (App Review) — ver paso 8.
                        </p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5 mt-1">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          <strong>Tip para probar:</strong> Mientras estés en modo desarrollo, agrega testers en <strong>Roles de la aplicación</strong> (menú lateral). Esas personas podrán enviarte mensajes por Messenger sin necesidad de App Review.
                        </p>
                      </div>
                    </div>
                  </AccordionItem>

                  {/* PASO 7 */}
                  <AccordionItem
                    key="step7"
                    aria-label="Paso 7"
                    startContent={
                      <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">7</div>
                    }
                    title={<span className="text-sm font-semibold">Conectar tu Página de Facebook</span>}
                    subtitle={<span className="text-xs text-default-400">Vincular tu página al CRM</span>}
                  >
                    <div className="space-y-3 text-sm text-default-600 pb-2">
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Vuelve al CRM y en la tarjeta de <strong className="text-foreground">Facebook Messenger</strong>, haz clic en <strong className="text-foreground">&quot;Conectar Página&quot;</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Globe size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Se abrirá una ventana de Facebook pidiendo autorización. <strong className="text-foreground">Inicia sesión</strong> y <strong className="text-foreground">autoriza los permisos</strong> solicitados.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Selecciona la <strong className="text-foreground">página de Facebook</strong> que deseas conectar al CRM.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Serás redirigido de vuelta al CRM donde verás tus páginas disponibles. Haz clic en <strong className="text-foreground">&quot;Conectar&quot;</strong> en la página que desees.</span>
                      </div>
                      <div className="bg-success-50 dark:bg-success-950/30 border border-success-200 dark:border-success-800 rounded-lg p-2.5 mt-2">
                        <p className="text-xs text-success-600 dark:text-success-400">
                          <CheckCircle2 size={12} className="inline mr-1" />
                          <strong>¡Listo!</strong> Los mensajes que recibas en Facebook Messenger aparecerán automáticamente en la bandeja de conversaciones del CRM.
                        </p>
                      </div>
                    </div>
                  </AccordionItem>

                  {/* PASO 8 - PUBLICAR Y APP REVIEW */}
                  <AccordionItem
                    key="step8"
                    aria-label="Paso 8"
                    startContent={
                      <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">8</div>
                    }
                    title={<span className="text-sm font-semibold">Publicar la App y Revisión de Permisos</span>}
                    subtitle={<span className="text-xs text-default-400">Necesario para que funcione con todos los usuarios</span>}
                  >
                    <div className="space-y-3 text-sm text-default-600 pb-2">
                      <p className="text-xs font-semibold text-foreground">A) Completar información requerida</p>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Revisa las <strong className="text-foreground">&quot;Acciones requeridas&quot;</strong> en el menú lateral. Meta puede pedir:</span>
                      </div>
                      <div className="ml-6 space-y-1">
                        <p className="text-xs">• <strong>URL de la Política de privacidad</strong> — usa <code className="bg-default-100 px-1 rounded text-[11px]">https://tudominio.com/privacy</code></p>
                        <p className="text-xs">• <strong>URL de las Condiciones del servicio</strong> — usa <code className="bg-default-100 px-1 rounded text-[11px]">https://tudominio.com/terms</code></p>
                        <p className="text-xs">• <strong>Eliminación de datos de usuario</strong> — URL o instrucciones de cómo eliminar datos</p>
                        <p className="text-xs">• <strong>Icono de la aplicación</strong> — imagen de 1024x1024 px</p>
                        <p className="text-xs">• <strong>Categoría</strong> — selecciona la más adecuada para tu negocio</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Completa estos campos en <strong className="text-foreground">Configuración de la aplicación → Información básica</strong>.</span>
                      </div>

                      <Divider className="my-1" />

                      <p className="text-xs font-semibold text-foreground">B) Revisión de la aplicación (App Review)</p>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Algunos permisos (como <code className="bg-default-100 px-1 rounded text-xs">pages_messaging</code>) requieren pasar por la <strong className="text-foreground">Revisión de la aplicación</strong> de Meta para funcionar con usuarios reales.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>Si ves el mensaje <em>&quot;Este permiso requiere la finalización del proceso de revisión&quot;</em>, debes enviar tu app a revisión.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                        <span>En el menú lateral, ve a <strong className="text-foreground">&quot;Publicar&quot;</strong> y sigue las instrucciones. Meta te pedirá:</span>
                      </div>
                      <div className="ml-6 space-y-1">
                        <p className="text-xs">• Una <strong>descripción detallada</strong> de cómo usas Messenger (ej: &quot;Usamos Messenger para responder consultas de clientes desde nuestro CRM&quot;).</p>
                        <p className="text-xs">• Un <strong>video o capturas de pantalla</strong> mostrando cómo funciona la integración.</p>
                        <p className="text-xs">• Completar la <strong>verificación del negocio</strong> si se requiere.</p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5 mt-2">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          <strong>Mientras esperas la revisión</strong>, puedes probar la integración completa en modo desarrollo. Agrega testers desde <strong>Roles de la aplicación</strong> en el menú lateral.
                        </p>
                      </div>

                      <div className="bg-warning-50 dark:bg-warning-950/30 border border-warning-200 dark:border-warning-800 rounded-lg p-2.5 mt-1">
                        <p className="text-xs text-warning-600 dark:text-warning-400">
                          <AlertTriangle size={12} className="inline mr-1" />
                          <strong>Sin App Review aprobado</strong>, solo los administradores y testers de la app podrán enviar/recibir mensajes. Los clientes reales no podrán interactuar hasta que Meta apruebe los permisos.
                        </p>
                      </div>
                    </div>
                  </AccordionItem>

                  {/* SOLUCIÓN DE PROBLEMAS */}
                  <AccordionItem
                    key="troubleshoot"
                    aria-label="Solución de Problemas"
                    startContent={
                      <div className="w-7 h-7 rounded-full bg-warning-500 text-white flex items-center justify-center">
                        <AlertTriangle size={14} />
                      </div>
                    }
                    title={<span className="text-sm font-semibold">Solución de Problemas</span>}
                    subtitle={<span className="text-xs text-default-400">¿Algo no funciona? Revisa aquí</span>}
                  >
                    <div className="space-y-3 text-sm text-default-600 pb-2">
                      <div className="bg-default-50 dark:bg-default-100/50 rounded-lg p-3 space-y-3">
                        <div>
                          <p className="text-xs font-bold text-foreground">&quot;Verificación fallida&quot; al configurar webhook</p>
                          <p className="text-xs text-default-500 mt-0.5">Verifica que el Verify Token en Facebook sea <strong>exactamente igual</strong> al que guardaste en el CRM. Cópialo usando el botón de copiar del panel &quot;Configurar App&quot;. También verifica que tu servidor esté en línea y accesible.</p>
                        </div>
                        <Divider />
                        <div>
                          <p className="text-xs font-bold text-foreground">&quot;Identificador de aplicación no válido&quot;</p>
                          <p className="text-xs text-default-500 mt-0.5">El App ID que ingresaste es incorrecto. Verifica que lo copiaste correctamente desde <strong>Configuración de la aplicación → Información básica</strong>.</p>
                        </div>
                        <Divider />
                        <div>
                          <p className="text-xs font-bold text-foreground">&quot;Este permiso requiere revisión de la aplicación&quot;</p>
                          <p className="text-xs text-default-500 mt-0.5">Los permisos como <code className="bg-default-100 px-1 rounded">pages_messaging</code> funcionan en modo desarrollo solo para admins/testers. Para usuarios reales, envía la app a revisión (paso 8). Mientras tanto, agrega testers en <strong>Roles de la aplicación</strong>.</p>
                        </div>
                        <Divider />
                        <div>
                          <p className="text-xs font-bold text-foreground">No llegan mensajes al CRM</p>
                          <p className="text-xs text-default-500 mt-0.5">1. Verifica los campos <code className="bg-default-100 px-1 rounded">messages</code> en las suscripciones del webhook. 2. Asegúrate de que tu página esté conectada. 3. Verifica que el permiso <code className="bg-default-100 px-1 rounded">pages_messaging</code> esté activo. 4. Si la app está en modo desarrollo, solo los testers pueden enviar mensajes.</p>
                        </div>
                        <Divider />
                        <div>
                          <p className="text-xs font-bold text-foreground">No puedo enviar mensajes desde el CRM</p>
                          <p className="text-xs text-default-500 mt-0.5">Facebook solo permite responder dentro de las primeras <strong>24 horas</strong> después de que el usuario escribió. Después de ese tiempo necesitas usar templates aprobados (Message Tags).</p>
                        </div>
                        <Divider />
                        <div>
                          <p className="text-xs font-bold text-foreground">La app dice &quot;Sin publicar&quot;</p>
                          <p className="text-xs text-default-500 mt-0.5">Tu app está en modo desarrollo. Solo los administradores y testers podrán enviar mensajes. Ve al paso 8 para publicar la app y solicitar la revisión de permisos.</p>
                        </div>
                      </div>
                    </div>
                  </AccordionItem>
                </Accordion>
              </ModalBody>
              <ModalFooter className="border-t border-divider">
                <Button color="primary" size="sm" onPress={onClose}>
                  Entendido
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ====================== FACEBOOK CONSENT MODAL ====================== */}
      <Modal isOpen={fbConsentModalOpen} onOpenChange={setFbConsentModalOpen} size="md">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-divider">
                <div className="flex items-center gap-2">
                  <Facebook size={20} className="text-blue-500" />
                  <span>Conectar con Facebook</span>
                </div>
              </ModalHeader>
              <ModalBody className="py-6">
                <div className="space-y-4">
                  <p className="text-sm text-default-700">
                    Al continuar, serás redirigido a Facebook para autorizar el acceso de <strong>AXENTYC</strong> a tu cuenta.
                  </p>
                  
                  <div className="bg-default-100 rounded-lg p-4 space-y-2">
                    <p className="text-xs font-semibold text-default-700">Permisos solicitados:</p>
                    <ul className="text-xs text-default-600 space-y-1.5 ml-4">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-success mt-0.5 flex-shrink-0" />
                        <span>Acceso a tus páginas de Facebook administradas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-success mt-0.5 flex-shrink-0" />
                        <span>Leer y responder mensajes de Messenger</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-success mt-0.5 flex-shrink-0" />
                        <span>Gestionar metadatos de las páginas</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <strong>Privacidad:</strong> AXENTYC solo accederá a los datos necesarios para gestionar conversaciones. 
                      No compartiremos tu información con terceros. Puedes revocar el acceso en cualquier momento desde tu configuración de Facebook.
                    </p>
                  </div>

                  <p className="text-xs text-default-500">
                    Al hacer clic en "Continuar", aceptas que AXENTYC acceda a tu cuenta de Facebook según los permisos descritos.
                  </p>
                </div>
              </ModalBody>
              <ModalFooter className="border-t border-divider">
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button 
                  color="primary" 
                  onPress={proceedWithFacebookOAuth}
                  startContent={<Facebook size={16} />}
                >
                  Continuar con Facebook
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ====================== FACEBOOK DELETE CONFIRMATION ====================== */}
      <Modal isOpen={!!fbDeleteConfirmId} onOpenChange={(open) => !open && setFbDeleteConfirmId(null)} size="sm">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-divider">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={20} className="text-warning" />
                  <span>Confirmar desconexión</span>
                </div>
              </ModalHeader>
              <ModalBody className="py-6">
                <p className="text-sm text-default-700">
                  ¿Estás seguro de que deseas desconectar esta página de Facebook?
                </p>
                <p className="text-xs text-default-500 mt-2">
                  Dejarás de recibir mensajes de esta página en AXENTYC. Las conversaciones existentes se mantendrán, pero no podrás responder desde aquí.
                </p>
              </ModalBody>
              <ModalFooter className="border-t border-divider">
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button 
                  color="danger" 
                  isLoading={fbDisconnecting}
                  onPress={confirmDisconnectFacebook}
                  startContent={<Trash2 size={16} />}
                >
                  Desconectar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

    </motion.div>
  );
}

function ChannelStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-content1/80 p-4 shadow-sm backdrop-blur">
      <p className="text-xs text-default-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
