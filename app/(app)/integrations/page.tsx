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
  const fbGuide = useDisclosure();
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
  const [fbWebhookUrl, setFbWebhookUrl] = useState('');

  const loadFacebookConfig = useCallback(async () => {
    try {
      const res = await api.get<any>(API_ENDPOINTS.integrations.facebook.config);
      const data = (res as any)?.data ?? res;
      if (data.exists) {
        setFbConfigExists(true);
        setFbConfigForm({ appId: data.appId, appSecret: '••••••••', verifyToken: data.verifyToken });
        setFbWebhookUrl(data.webhookUrl || '');
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

                  <Divider />

                  <div className={`rounded-lg p-3 space-y-2.5 border ${fbConfigExists && fbWebhookUrl ? 'bg-success-50 dark:bg-success-950/30 border-success-200 dark:border-success-800' : 'bg-warning-50 dark:bg-warning-950/30 border-warning-200 dark:border-warning-800'}`}>
                    <p className={`text-xs font-bold ${fbConfigExists && fbWebhookUrl ? 'text-success-700 dark:text-success-300' : 'text-warning-700 dark:text-warning-300'}`}>
                      {fbConfigExists && fbWebhookUrl ? '✅' : '⚠️'} Datos para configurar el Webhook en Facebook Developers
                    </p>

                    {fbConfigExists && fbWebhookUrl ? (
                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] text-success-600 dark:text-success-400 font-semibold mb-0.5">Webhook URL (Callback URL):</p>
                          <div className="flex items-center gap-1">
                            <code className="text-[11px] bg-success-100 dark:bg-success-900 px-2 py-1 rounded flex-1 break-all">
                              {fbWebhookUrl}
                            </code>
                            <Button
                              size="sm"
                              isIconOnly
                              variant="flat"
                              className="min-w-6 w-6 h-6"
                              onPress={() => {
                                navigator.clipboard.writeText(fbWebhookUrl);
                                toast.success('URL copiada');
                              }}
                            >
                              <Copy size={12} />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-success-600 dark:text-success-400 font-semibold mb-0.5">Verify Token:</p>
                          <div className="flex items-center gap-1">
                            <code className="text-[11px] bg-success-100 dark:bg-success-900 px-2 py-1 rounded flex-1">
                              {fbConfigForm.verifyToken}
                            </code>
                            <Button
                              size="sm"
                              isIconOnly
                              variant="flat"
                              className="min-w-6 w-6 h-6"
                              onPress={() => {
                                navigator.clipboard.writeText(fbConfigForm.verifyToken);
                                toast.success('Token copiado');
                              }}
                            >
                              <Copy size={12} />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-success-600 dark:text-success-400 font-semibold mb-0.5">Campos (Webhook Fields):</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {['messages', 'messaging_postbacks', 'message_reads', 'message_deliveries'].map((f) => (
                              <Chip key={f} size="sm" variant="flat" color="success" className="text-[10px] h-5">
                                {f}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-warning-600 dark:text-warning-400">
                        Guarda la configuración primero. Después aparecerán aquí la <strong>URL</strong> y el <strong>Verify Token</strong> listos para copiar y pegar en Facebook Developers.
                      </p>
                    )}
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
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => {
                    onClose();
                    setFbConfigDrawerOpen(true);
                  }}
                  startContent={<Settings size={14} />}
                >
                  Ir a Configurar App
                </Button>
                <Button color="primary" size="sm" onPress={onClose}>
                  Entendido
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </motion.div>
  );
}
