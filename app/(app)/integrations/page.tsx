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
    status: "coming_soon" as const,
  },
  {
    name: "Instagram",
    description: "Gestiona mensajes directos y comentarios de Instagram.",
    icon: "📸",
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
  const [domainsInput, setDomainsInput] = useState("");

  // --- Email Integration State ---
  type EmailStatus = {
    status: "connected" | "disconnected" | "error";
    smtp?: { host?: string; port?: number; secure?: boolean; user?: string; fromName?: string; fromAddress?: string };
    imap?: { host?: string; port?: number; secure?: boolean; user?: string };
    lastError?: string | null;
  };

  type EmailForm = {
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    smtpPass: string;
    fromName?: string;
    fromAddress?: string;
    imapHost: string;
    imapPort: number;
    imapSecure: boolean;
    imapUser: string;
    imapPass: string;
  };

  const [emailDrawerOpen, setEmailDrawerOpen] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>({ status: "disconnected" });
  const [emailForm, setEmailForm] = useState<EmailForm>({
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "",
    smtpPass: "",
    fromName: "",
    fromAddress: "",
    imapHost: "",
    imapPort: 993,
    imapSecure: true,
    imapUser: "",
    imapPass: "",
  });
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailConnecting, setEmailConnecting] = useState(false);
  const [emailDisconnecting, setEmailDisconnecting] = useState(false);
  const [emailTestFeedback, setEmailTestFeedback] = useState<null | { smtpOk: boolean; imapOk: boolean; details?: any }>(null);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [showImapPass, setShowImapPass] = useState(false);

  // --- Facebook Integration State ---
  type FbAccount = {
    _id: string;
    accountName: string;
    pageId?: string;
    status: string;
    metadata?: { picture?: string; category?: string };
  };
  type FbStatus = { connected: boolean; accounts: FbAccount[] };

  const [fbStatus, setFbStatus] = useState<FbStatus>({ connected: false, accounts: [] });
  const [fbConnecting, setFbConnecting] = useState(false);
  const [fbDisconnecting, setFbDisconnecting] = useState(false);
  const [fbConfigDrawerOpen, setFbConfigDrawerOpen] = useState(false);
  const [fbConfigExists, setFbConfigExists] = useState(false);
  const [fbConfigForm, setFbConfigForm] = useState({ appId: '', appSecret: '', verifyToken: '' });
  const [fbConfigSaving, setFbConfigSaving] = useState(false);

  const loadFacebookConfig = useCallback(async () => {
    try {
      const res = await api.get<any>(API_ENDPOINTS.integrations.facebook.config);
      const data = (res as any)?.data ?? res;
      if (data.exists) {
        setFbConfigExists(true);
        setFbConfigForm({ appId: data.appId, appSecret: '••••••••', verifyToken: data.verifyToken });
      } else {
        setFbConfigExists(false);
        setFbConfigForm({ appId: '', appSecret: '', verifyToken: 'cconehub_fb_verify' });
      }
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

  const saveFacebookConfig = async () => {
    setFbConfigSaving(true);
    try {
      await api.post(API_ENDPOINTS.integrations.facebook.config, fbConfigForm);
      toast.success('Configuración de Facebook guardada');
      await loadFacebookConfig();
      setFbConfigDrawerOpen(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al guardar configuración');
    } finally {
      setFbConfigSaving(false);
    }
  };

  const connectFacebook = async () => {
    if (!fbConfigExists) {
      toast.error('Primero debes configurar tu App de Facebook');
      setFbConfigDrawerOpen(true);
      return;
    }
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
    setFbDisconnecting(true);
    try {
      await api.post(API_ENDPOINTS.integrations.facebook.disconnect(accountId), {});
      toast.success("Facebook Messenger desconectado");
      await loadFacebookStatus();
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

  // --- Load Email status ---
  const loadEmailStatus = useCallback(async () => {
    try {
      const res = await api.get<EmailStatus>(API_ENDPOINTS.integrations.email.status);
      const data = (res as any)?.data ?? res;
      setEmailStatus(data as EmailStatus);
      if (data && data.smtp && data.imap) {
        setEmailForm((prev) => ({
          ...prev,
          smtpHost: data.smtp?.host || prev.smtpHost,
          smtpPort: (data.smtp?.port as any) ?? prev.smtpPort,
          smtpSecure: Boolean(data.smtp?.secure),
          smtpUser: data.smtp?.user || prev.smtpUser,
          smtpPass: data.status === 'connected' ? '••••••••' : prev.smtpPass,
          fromName: data.smtp?.fromName || prev.fromName,
          fromAddress: data.smtp?.fromAddress || prev.fromAddress,
          imapHost: data.imap?.host || prev.imapHost,
          imapPort: (data.imap?.port as any) ?? prev.imapPort,
          imapSecure: Boolean(data.imap?.secure),
          imapUser: data.imap?.user || prev.imapUser,
          imapPass: data.status === 'connected' ? '••••••••' : prev.imapPass,
        }));
      }
    } catch {
      setEmailStatus({ status: "disconnected" });
    }
  }, []);

  useEffect(() => {
    loadEmailStatus();
    loadFacebookConfig();
    loadFacebookStatus();
  }, [loadEmailStatus, loadFacebookConfig, loadFacebookStatus]);

  const updateEmailForm = (key: keyof EmailForm, value: any) => {
    setEmailForm((prev) => ({ ...prev, [key]: value }));
  };

  const openEmailDrawer = () => {
    setEmailTestFeedback(null);
    setEmailDrawerOpen(true);
  };

  const testSmtp = async () => {
    setEmailTesting(true);
    try {
      // Build payload - don't send password if it's a placeholder (backend will use saved one)
      const payload: any = {
        smtpHost: emailForm.smtpHost,
        smtpPort: emailForm.smtpPort,
        smtpSecure: emailForm.smtpSecure,
        smtpUser: emailForm.smtpUser,
        fromName: emailForm.fromName,
        fromAddress: emailForm.fromAddress,
        imapHost: emailForm.imapHost,
        imapPort: emailForm.imapPort,
        imapSecure: emailForm.imapSecure,
        imapUser: emailForm.imapUser,
      };
      
      // Only include passwords if they were changed
      if (emailForm.smtpPass && emailForm.smtpPass !== '••••••••') {
        payload.smtpPass = emailForm.smtpPass;
      }
      if (emailForm.imapPass && emailForm.imapPass !== '••••••••') {
        payload.imapPass = emailForm.imapPass;
      }
      
      const res = await api.post(API_ENDPOINTS.integrations.email.testSmtp, payload);
      const data = (res as any)?.data ?? res;
      if (data?.smtp?.ok) {
        toast.success("✓ SMTP funciona correctamente");
      } else {
        toast.error(`✗ SMTP falló: ${data?.smtp?.error || 'Error desconocido'}`);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Error al probar SMTP");
    } finally {
      setEmailTesting(false);
    }
  };

  const testImap = async () => {
    setEmailTesting(true);
    try {
      // Build payload - don't send password if it's a placeholder (backend will use saved one)
      const payload: any = {
        smtpHost: emailForm.smtpHost,
        smtpPort: emailForm.smtpPort,
        smtpSecure: emailForm.smtpSecure,
        smtpUser: emailForm.smtpUser,
        fromName: emailForm.fromName,
        fromAddress: emailForm.fromAddress,
        imapHost: emailForm.imapHost,
        imapPort: emailForm.imapPort,
        imapSecure: emailForm.imapSecure,
        imapUser: emailForm.imapUser,
      };
      
      // Only include passwords if they were changed
      if (emailForm.smtpPass && emailForm.smtpPass !== '••••••••') {
        payload.smtpPass = emailForm.smtpPass;
      }
      if (emailForm.imapPass && emailForm.imapPass !== '••••••••') {
        payload.imapPass = emailForm.imapPass;
      }
      
      const res = await api.post(API_ENDPOINTS.integrations.email.testImap, payload);
      const data = (res as any)?.data ?? res;
      if (data?.imap?.ok) {
        toast.success("✓ IMAP funciona correctamente");
      } else {
        toast.error(`✗ IMAP falló: ${data?.imap?.error || 'Error desconocido'}`);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Error al probar IMAP");
    } finally {
      setEmailTesting(false);
    }
  };

  const testEmail = async () => {
    // Can't test with placeholder passwords
    if (emailForm.smtpPass === '••••••••' || emailForm.imapPass === '••••••••') {
      toast.error("Debes ingresar las contraseñas para probar la conexión");
      return;
    }
    setEmailTesting(true);
    setEmailTestFeedback(null);
    try {
      const res = await api.post(API_ENDPOINTS.integrations.email.test, emailForm);
      const data = (res as any)?.data ?? res;
      setEmailTestFeedback({ smtpOk: Boolean(data?.smtp?.ok), imapOk: Boolean(data?.imap?.ok), details: data });
      if (data?.smtp?.ok && data?.imap?.ok) toast.success("Conexión SMTP/IMAP verificada");
      else toast.warning("La prueba detectó problemas. Revisa los campos.");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Error al probar conexión");
    } finally {
      setEmailTesting(false);
    }
  };

  const connectEmail = async () => {
    // Check if this is first time setup (no saved passwords) and passwords are missing
    const hasSmtpPass = emailForm.smtpPass && emailForm.smtpPass !== '••••••••';
    const hasImapPass = emailForm.imapPass && emailForm.imapPass !== '••••••••';
    const isFirstSetup = emailStatus?.status !== 'connected';
    
    if (isFirstSetup && (!hasSmtpPass || !hasImapPass)) {
      toast.error("Debes ingresar las contraseñas SMTP e IMAP para la primera configuración");
      return;
    }
    
    setEmailConnecting(true);
    try {
      // Build payload - don't include passwords if they are placeholders
      const payload: any = {
        smtpHost: emailForm.smtpHost,
        smtpPort: emailForm.smtpPort,
        smtpSecure: emailForm.smtpSecure,
        smtpUser: emailForm.smtpUser,
        fromName: emailForm.fromName,
        fromAddress: emailForm.fromAddress,
        imapHost: emailForm.imapHost,
        imapPort: emailForm.imapPort,
        imapSecure: emailForm.imapSecure,
        imapUser: emailForm.imapUser,
      };
      
      // Only include passwords if they were changed (not the placeholder)
      if (hasSmtpPass) {
        payload.smtpPass = emailForm.smtpPass;
      }
      if (hasImapPass) {
        payload.imapPass = emailForm.imapPass;
      }
      
      await api.post(API_ENDPOINTS.integrations.email.connect, payload);
      toast.success("Integración de email conectada y guardada");
      await loadEmailStatus();
      setEmailDrawerOpen(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Error al conectar";
      toast.error(msg);
      setEmailTestFeedback(e?.response?.data?.details || null);
    } finally {
      setEmailConnecting(false);
    }
  };

  const disconnectEmail = async () => {
    setEmailDisconnecting(true);
    try {
      await api.post(API_ENDPOINTS.integrations.email.disconnect, {});
      toast.success("Integración de email desconectada");
      await loadEmailStatus();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Error al desconectar");
    } finally {
      setEmailDisconnecting(false);
    }
  };

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
        {/* Email Integration Card */}
        <motion.div variants={item}>
          <Card className="border border-divider h-full">
            <CardBody className="gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl"><Mail /></div>
                  <div>
                    <p className="text-sm font-semibold">Email (SMTP/IMAP)</p>
                    <Chip
                      color={emailStatus.status === 'connected' ? 'success' : emailStatus.status === 'error' ? 'danger' : 'default'}
                      size="sm"
                      startContent={emailStatus.status === 'connected' ? <Check size={10} /> : <Plug size={10} />}
                      variant="flat"
                    >
                      {emailStatus.status === 'connected' ? 'Conectado' : emailStatus.status === 'error' ? 'Error' : 'Desconectado'}
                    </Chip>
                  </div>
                </div>
                {emailStatus.status === 'connected' && (
                  <Button color="danger" size="sm" variant="flat" isLoading={emailDisconnecting} onPress={disconnectEmail}>
                    Desconectar
                  </Button>
                )}
              </div>
              <p className="text-xs text-default-400">
                Conecta tu cuenta SMTP/IMAP para enviar y recibir correos desde el Inbox.
              </p>
              <div className="mt-auto">
                <Button color="primary" size="sm" onPress={openEmailDrawer}>
                  {emailStatus.status === 'connected' ? 'Configurar' : 'Conectar'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Facebook Messenger Card */}
        <motion.div variants={item}>
          <Card className={`border h-full ${fbStatus.connected ? 'border-blue-500/30' : 'border-divider'}`}>
            <CardBody className="gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Facebook size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Facebook Messenger</p>
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
              </div>

              {/* Connected pages list */}
              {fbStatus.accounts.filter(a => a.status === 'connected').length > 0 && (
                <div className="space-y-2">
                  {fbStatus.accounts.filter(a => a.status === 'connected').map((acc) => (
                    <div key={acc._id} className="flex items-center justify-between bg-default-50 dark:bg-default-100/50 rounded-lg px-2.5 py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {acc.metadata?.picture ? (
                          <img src={acc.metadata.picture} alt="" className="w-5 h-5 rounded-full" />
                        ) : null}
                        <span className="text-xs font-medium truncate">{acc.accountName}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        isIconOnly
                        className="min-w-6 w-6 h-6"
                        isLoading={fbDisconnecting}
                        onPress={() => disconnectFacebook(acc._id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-default-400">
                Recibe y responde mensajes de Facebook Messenger directamente desde tu CRM.
              </p>
              
              {!fbConfigExists && (
                <div className="bg-warning/10 border border-warning/30 rounded-lg px-3 py-2">
                  <p className="text-xs text-warning">⚠️ Configura tu App de Facebook primero</p>
                </div>
              )}

              <div className="mt-auto flex gap-2">
                <Button
                  color="default"
                  size="sm"
                  variant="flat"
                  onPress={() => setFbConfigDrawerOpen(true)}
                >
                  {fbConfigExists ? 'Configuración' : 'Configurar App'}
                </Button>
                <Button
                  color="primary"
                  size="sm"
                  isLoading={fbConnecting}
                  isDisabled={!fbConfigExists}
                  onPress={connectFacebook}
                >
                  {fbStatus.connected ? 'Agregar Página' : 'Conectar Página'}
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

      {/* ====================== EMAIL DRAWER ====================== */}
      <Drawer isOpen={emailDrawerOpen} placement="right" size="lg" onOpenChange={setEmailDrawerOpen}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex items-center justify-between border-b border-divider">
                <div>
                  <h2 className="text-lg font-bold">Configurar Email (SMTP/IMAP)</h2>
                  <p className="text-xs text-default-500 font-normal">Credenciales por tenant. No afecta el SMTP del sistema.</p>
                </div>
              </DrawerHeader>
              <DrawerBody>
                {emailTestFeedback && (
                  <div className={`mb-3 rounded-lg border px-3 py-2 text-sm ${emailTestFeedback.smtpOk && emailTestFeedback.imapOk ? 'border-success-200 bg-success-50 text-success-700' : 'border-danger-200 bg-danger-50 text-danger-700'}`}>
                    {emailTestFeedback.smtpOk && emailTestFeedback.imapOk ? (
                      '✓ Conexión verificada correctamente.'
                    ) : (
                      <div className="space-y-1">
                        <p className="font-semibold">Errores de conexión:</p>
                        {!emailTestFeedback.smtpOk && (
                          <p className="text-xs">• SMTP: {emailTestFeedback.details?.smtp?.error || 'Falló la conexión'}</p>
                        )}
                        {!emailTestFeedback.imapOk && (
                          <p className="text-xs">• IMAP: {emailTestFeedback.details?.imap?.error || 'Falló la conexión'}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SMTP */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">SMTP (salida)</p>
                    <Input label="Host" size="sm" variant="bordered" value={emailForm.smtpHost} onValueChange={(v) => updateEmailForm('smtpHost', v)} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input type="number" label="Puerto" size="sm" variant="bordered" value={String(emailForm.smtpPort)} onValueChange={(v) => updateEmailForm('smtpPort', Number(v || 0))} />
                      <div className="flex items-end">
                        <Switch isSelected={emailForm.smtpSecure} size="sm" onValueChange={(v) => updateEmailForm('smtpSecure', v)}>TLS/SSL</Switch>
                      </div>
                    </div>
                    <Input label="Usuario" size="sm" variant="bordered" value={emailForm.smtpUser} onValueChange={(v) => updateEmailForm('smtpUser', v)} />
                    <Input
                      label="Contraseña"
                      type={showSmtpPass ? 'text' : 'password'}
                      size="sm"
                      variant="bordered"
                      value={emailForm.smtpPass}
                      onValueChange={(v) => updateEmailForm('smtpPass', v)}
                      endContent={
                        <button
                          type="button"
                          onClick={() => setShowSmtpPass(!showSmtpPass)}
                          className="focus:outline-none"
                        >
                          {showSmtpPass ? <EyeOff size={16} className="text-default-400" /> : <Eye size={16} className="text-default-400" />}
                        </button>
                      }
                    />
                    <Input label="Nombre remitente (opcional)" size="sm" variant="bordered" value={emailForm.fromName || ''} onValueChange={(v) => updateEmailForm('fromName', v)} />
                    <Input label="Email remitente (opcional)" size="sm" variant="bordered" value={emailForm.fromAddress || ''} onValueChange={(v) => updateEmailForm('fromAddress', v)} />
                  </div>
                  {/* IMAP */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">IMAP (entrada)</p>
                    <Input label="Host" size="sm" variant="bordered" value={emailForm.imapHost} onValueChange={(v) => updateEmailForm('imapHost', v)} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input type="number" label="Puerto" size="sm" variant="bordered" value={String(emailForm.imapPort)} onValueChange={(v) => updateEmailForm('imapPort', Number(v || 0))} />
                      <div className="flex items-end">
                        <Switch isSelected={emailForm.imapSecure} size="sm" onValueChange={(v) => updateEmailForm('imapSecure', v)}>TLS/SSL</Switch>
                      </div>
                    </div>
                    <Input label="Usuario" size="sm" variant="bordered" value={emailForm.imapUser} onValueChange={(v) => updateEmailForm('imapUser', v)} />
                    <Input
                      label="Contraseña"
                      type={showImapPass ? 'text' : 'password'}
                      size="sm"
                      variant="bordered"
                      value={emailForm.imapPass}
                      onValueChange={(v) => updateEmailForm('imapPass', v)}
                      endContent={
                        <button
                          type="button"
                          onClick={() => setShowImapPass(!showImapPass)}
                          className="focus:outline-none"
                        >
                          {showImapPass ? <EyeOff size={16} className="text-default-400" /> : <Eye size={16} className="text-default-400" />}
                        </button>
                      }
                    />
                  </div>
                </div>
              </DrawerBody>
              <DrawerFooter className="border-t border-divider">
                <Button variant="light" onPress={onClose}>Cerrar</Button>
                <div className="flex gap-2">
                  <Button size="sm" variant="flat" color="secondary" isLoading={emailTesting} onPress={testSmtp}>
                    Probar SMTP
                  </Button>
                  <Button size="sm" variant="flat" color="secondary" isLoading={emailTesting} onPress={testImap}>
                    Probar IMAP
                  </Button>
                </div>
                <Button color="primary" isLoading={emailConnecting} startContent={<Save size={14} />} onPress={connectEmail}>
                  Guardar y Conectar
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* ====================== FACEBOOK CONFIG DRAWER ====================== */}
      <Drawer isOpen={fbConfigDrawerOpen} placement="right" size="lg" onOpenChange={setFbConfigDrawerOpen}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="border-b border-divider">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Facebook size={20} className="text-blue-500" />
                    Configurar Facebook App
                  </h2>
                  <p className="text-xs text-default-500 font-normal mt-1">
                    Ingresa las credenciales de tu aplicación de Facebook
                  </p>
                </div>
              </DrawerHeader>
              <DrawerBody className="py-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      💡 <strong>¿Cómo obtener estas credenciales?</strong><br/>
                      1. Ve a <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="underline">Facebook Developers</a><br/>
                      2. Crea una nueva app o selecciona una existente<br/>
                      3. Ve a <strong>Configuración → Básica</strong><br/>
                      4. Copia el <strong>App ID</strong> y <strong>App Secret</strong>
                    </p>
                  </div>

                  <Input
                    label="App ID"
                    placeholder="123456789012345"
                    value={fbConfigForm.appId}
                    onValueChange={(v) => setFbConfigForm({ ...fbConfigForm, appId: v })}
                    variant="bordered"
                    size="sm"
                    isRequired
                  />

                  <Input
                    label="App Secret"
                    placeholder="abc123def456..."
                    type="password"
                    value={fbConfigForm.appSecret}
                    onValueChange={(v) => setFbConfigForm({ ...fbConfigForm, appSecret: v })}
                    variant="bordered"
                    size="sm"
                    isRequired
                  />

                  <Input
                    label="Verify Token (Webhook)"
                    placeholder="cconehub_fb_verify"
                    value={fbConfigForm.verifyToken}
                    onValueChange={(v) => setFbConfigForm({ ...fbConfigForm, verifyToken: v })}
                    variant="bordered"
                    size="sm"
                    description="Token para verificar el webhook. Usa cualquier string seguro."
                  />

                  <div className="bg-warning-50 dark:bg-warning-950/30 border border-warning-200 dark:border-warning-800 rounded-lg p-3">
                    <p className="text-xs text-warning-700 dark:text-warning-300">
                      ⚠️ <strong>Importante:</strong> Después de guardar, deberás configurar el webhook en Facebook:<br/>
                      • URL: <code className="bg-warning-100 dark:bg-warning-900 px-1 rounded">https://tu-dominio.com/webhook/facebook</code><br/>
                      • Verify Token: El que configuraste arriba<br/>
                      • Campos: messages, messaging_postbacks, message_reads, message_deliveries
                    </p>
                  </div>
                </div>
              </DrawerBody>
              <DrawerFooter className="border-t border-divider">
                <Button variant="light" onPress={onClose}>Cancelar</Button>
                <Button 
                  color="primary" 
                  isLoading={fbConfigSaving}
                  isDisabled={!fbConfigForm.appId || !fbConfigForm.appSecret}
                  startContent={<Save size={14} />} 
                  onPress={saveFacebookConfig}
                >
                  Guardar Configuración
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </motion.div>
  );
}
