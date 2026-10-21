"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from "@heroui/drawer";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { toast } from "sonner";
import {
  Mail, Plus, Star, MoreVertical, Pencil, Trash2, Unplug, Plug, Zap, Eye, EyeOff,
  Save, CheckCircle2, XCircle, AlertTriangle, ServerCog, Inbox,
} from "lucide-react";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";
import {
  EmailAccount,
  PROVIDER_PRESETS,
  ProviderPreset,
  accountColor,
  detectPreset,
  unwrap,
} from "@/lib/email-accounts";

type TestResult = { smtp?: { ok: boolean; error?: string }; imap?: { ok: boolean; error?: string } };

interface FormState {
  label: string;
  fromName: string;
  email: string;
  provider: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  imapUser: string;
  imapPass: string;
  sameUser: boolean;
  samePass: boolean;
}

const EMPTY_FORM: FormState = {
  label: "",
  fromName: "",
  email: "",
  provider: "",
  smtpHost: "",
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: "",
  smtpPass: "",
  imapHost: "",
  imapPort: 993,
  imapSecure: true,
  imapUser: "",
  imapPass: "",
  sameUser: true,
  samePass: true,
};

function timeAgo(iso?: string): string {
  if (!iso) return "nunca";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

function errMessage(e: any, fallback: string): string {
  return e?.response?.data?.message || e?.message || fallback;
}

interface Props {
  /** Called whenever the list is (re)loaded or changed, so the parent can refresh plan usage. */
  onChange?: (accounts: EmailAccount[]) => void;
}

export default function EmailAccountsSection({ onChange }: Props) {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [manageOpen, setManageOpen] = useState(false);

  // drawer (create / edit)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<EmailAccount | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showServers, setShowServers] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<TestResult | null>(null);

  // per-account actions
  const [testResults, setTestResults] = useState<Record<string, TestResult | "loading">>({});
  const [confirm, setConfirm] = useState<{ type: "disconnect" | "delete"; account: EmailAccount } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(API_ENDPOINTS.integrations.email.accounts);
      const list = unwrap<EmailAccount[]>(res);
      const safe = Array.isArray(list) ? list : [];
      setAccounts(safe);
      onChange?.(safe);
    } catch {
      setAccounts([]);
      onChange?.([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const connectedCount = useMemo(() => accounts.filter((a) => a.status === "connected").length, [accounts]);

  /* ───────── form helpers ───────── */

  const patch = (changes: Partial<FormState>) => setForm((prev) => ({ ...prev, ...changes }));

  const applyPreset = (preset: ProviderPreset) => {
    patch({
      provider: preset.key,
      smtpHost: preset.smtpHost,
      smtpPort: preset.smtpPort,
      smtpSecure: preset.smtpSecure,
      imapHost: preset.imapHost,
      imapPort: preset.imapPort,
      imapSecure: preset.imapSecure,
    });
    setShowServers(preset.key === "custom");
  };

  const onEmailChange = (value: string) => {
    const changes: Partial<FormState> = { email: value };
    if (form.sameUser) {
      changes.smtpUser = value;
      changes.imapUser = value;
    }
    setForm((prev) => ({ ...prev, ...changes }));

    // Suggest the provider while creating, unless the user already picked one
    if (!editing && (!form.provider || form.provider === "custom") && value.includes("@")) {
      const detected = detectPreset(value);
      if (detected) {
        setForm((prev) => ({
          ...prev,
          ...changes,
          provider: detected.key,
          smtpHost: detected.smtpHost,
          smtpPort: detected.smtpPort,
          smtpSecure: detected.smtpSecure,
          imapHost: detected.imapHost,
          imapPort: detected.imapPort,
          imapSecure: detected.imapSecure,
        }));
        setShowServers(false);
      }
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFeedback(null);
    setShowServers(false);
    setShowPass(false);
    setDrawerOpen(true);
  };

  const openEdit = (account: EmailAccount) => {
    const email = account.emailAddress || account.smtp.fromAddress || account.smtp.user || "";
    setEditing(account);
    setForm({
      label: account.label || "",
      fromName: account.smtp.fromName || "",
      email,
      provider: detectPreset(email)?.key || "custom",
      smtpHost: account.smtp.host || "",
      smtpPort: account.smtp.port ?? 587,
      smtpSecure: !!account.smtp.secure,
      smtpUser: account.smtp.user || email,
      smtpPass: "",
      imapHost: account.imap.host || "",
      imapPort: account.imap.port ?? 993,
      imapSecure: account.imap.secure ?? true,
      imapUser: account.imap.user || email,
      imapPass: "",
      sameUser: (account.smtp.user || email) === email && (account.imap.user || email) === email,
      samePass: true,
    });
    setFeedback(null);
    setShowServers(true);
    setShowPass(false);
    setDrawerOpen(true);
  };

  const currentPreset = PROVIDER_PRESETS.find((p) => p.key === form.provider);

  const buildPayload = () => {
    const payload: Record<string, any> = {
      label: form.label.trim() || undefined,
      fromName: form.fromName.trim() || undefined,
      fromAddress: form.email.trim(),
      smtpHost: form.smtpHost.trim(),
      smtpPort: Number(form.smtpPort),
      smtpSecure: form.smtpSecure,
      smtpUser: (form.sameUser ? form.email : form.smtpUser).trim(),
      imapHost: form.imapHost.trim(),
      imapPort: Number(form.imapPort),
      imapSecure: form.imapSecure,
      imapUser: (form.sameUser ? form.email : form.imapUser).trim(),
    };
    const smtpPass = form.smtpPass;
    const imapPass = form.samePass ? form.smtpPass : form.imapPass;
    if (smtpPass) payload.smtpPass = smtpPass;
    if (imapPass) payload.imapPass = imapPass;
    if (editing) payload.integrationId = editing._id;
    return payload;
  };

  const validate = (): string | null => {
    if (!form.email.includes("@")) return "Ingresa un correo válido";
    if (!form.smtpHost || !form.imapHost) return "Completa los servidores SMTP e IMAP";
    if (!editing || editing.status === "disconnected") {
      // a stored password exists when editing, so passwords are only mandatory for new accounts
      if (!editing && !form.smtpPass) return "Ingresa la contraseña de la cuenta";
      if (!editing && !form.samePass && !form.imapPass) return "Ingresa la contraseña IMAP";
    }
    return null;
  };

  /* ───────── actions ───────── */

  const testForm = async () => {
    const problem = validate();
    if (problem) return toast.error(problem);
    setTesting(true);
    setFeedback(null);
    try {
      const res = await api.post(API_ENDPOINTS.integrations.email.test, buildPayload());
      const data = unwrap<TestResult>(res);
      setFeedback(data);
      if (data?.smtp?.ok && data?.imap?.ok) toast.success("Conexión SMTP e IMAP verificada");
    } catch (e: any) {
      toast.error(errMessage(e, "Error al probar la conexión"));
    } finally {
      setTesting(false);
    }
  };

  const save = async () => {
    const problem = validate();
    if (problem) return toast.error(problem);
    setSaving(true);
    setFeedback(null);
    try {
      if (editing) {
        await api.put(API_ENDPOINTS.integrations.email.account(editing._id), buildPayload());
        toast.success(editing.status === "disconnected" ? "Cuenta reconectada" : "Cuenta actualizada");
      } else {
        await api.post(API_ENDPOINTS.integrations.email.accounts, buildPayload());
        toast.success("Cuenta vinculada. Sincronizando correos…");
      }
      setDrawerOpen(false);
      await load();
    } catch (e: any) {
      toast.error(errMessage(e, "No se pudo guardar la cuenta"));
      const details = e?.response?.data?.details;
      if (details) setFeedback(details);
    } finally {
      setSaving(false);
    }
  };

  const testAccount = async (account: EmailAccount) => {
    setTestResults((prev) => ({ ...prev, [account._id]: "loading" }));
    try {
      const res = await api.post(API_ENDPOINTS.integrations.email.accountTest(account._id));
      const data = unwrap<TestResult>(res);
      setTestResults((prev) => ({ ...prev, [account._id]: data }));
      if (data?.smtp?.ok && data?.imap?.ok) toast.success(`${account.label}: conexión correcta`);
      else toast.error(`${account.label}: la conexión falló`);
      load();
    } catch (e: any) {
      setTestResults((prev) => {
        const next = { ...prev };
        delete next[account._id];
        return next;
      });
      toast.error(errMessage(e, "Error al probar la cuenta"));
    }
  };

  const makeDefault = async (account: EmailAccount) => {
    try {
      await api.post(API_ENDPOINTS.integrations.email.accountDefault(account._id));
      toast.success(`${account.label} es ahora la cuenta predeterminada`);
      await load();
    } catch (e: any) {
      toast.error(errMessage(e, "No se pudo cambiar la cuenta predeterminada"));
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setConfirming(true);
    try {
      if (confirm.type === "disconnect") {
        await api.post(API_ENDPOINTS.integrations.email.accountDisconnect(confirm.account._id));
        toast.success("Cuenta desconectada");
      } else {
        await api.delete(API_ENDPOINTS.integrations.email.account(confirm.account._id));
        toast.success("Cuenta eliminada");
      }
      setConfirm(null);
      await load();
    } catch (e: any) {
      toast.error(errMessage(e, "No se pudo completar la acción"));
    } finally {
      setConfirming(false);
    }
  };

  /* ───────── render ───────── */

  return (
    <>
      {/* Compact card: same footprint as the other channel cards */}
      <Card className="border border-divider h-full">
        <CardBody className="gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold">Email (SMTP/IMAP)</p>
                <Chip
                  color={connectedCount > 0 ? "success" : "default"}
                  size="sm"
                  startContent={connectedCount > 0 ? <CheckCircle2 size={10} /> : <Plug size={10} />}
                  variant="flat"
                >
                  {loading
                    ? "Cargando…"
                    : connectedCount > 0
                      ? `${connectedCount} ${connectedCount === 1 ? "cuenta conectada" : "cuentas conectadas"}`
                      : "Desconectado"}
                </Chip>
              </div>
            </div>
          </div>

          {accounts.length > 0 ? (
            <ul className="space-y-1.5">
              {accounts.slice(0, 3).map((a) => (
                <li key={a._id} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: a.lastError ? "#ef4444" : a.status === "disconnected" ? "#94a3b8" : "#22c55e" }}
                  />
                  <span className={`truncate ${a.status === "disconnected" ? "text-default-400" : "text-default-600"}`}>
                    {a.emailAddress}
                  </span>
                  {a.isDefault && <Star size={11} className="shrink-0 fill-warning text-warning" />}
                </li>
              ))}
              {accounts.length > 3 && (
                <li className="text-[11px] text-default-400">+{accounts.length - 3} más</li>
              )}
            </ul>
          ) : (
            <p className="text-xs text-default-400">
              Conecta uno o varios correos de la agencia para enviar y recibir desde el Inbox.
            </p>
          )}

          <div className="mt-auto flex gap-2">
            <Button color="primary" size="sm" onPress={() => setManageOpen(true)}>
              {accounts.length > 0 ? "Administrar" : "Conectar"}
            </Button>
            {accounts.length > 0 && (
              <Button size="sm" variant="flat" startContent={<Plus size={14} />} onPress={openCreate}>
                Agregar
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Accounts manager */}
      <Modal isOpen={manageOpen} onOpenChange={setManageOpen} size="5xl" scrollBehavior="inside">
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex items-center justify-between gap-3 border-b border-divider pr-12">
                <div>
                  <p className="text-base font-bold">Cuentas de email</p>
                  <p className="text-xs font-normal text-default-500">
                    Cada cuenta se sincroniza por separado y puedes elegir desde cuál enviar.
                  </p>
                </div>
                <Button color="primary" size="sm" startContent={<Plus size={14} />} onPress={openCreate}>
                  Agregar cuenta
                </Button>
              </ModalHeader>
              <ModalBody className="py-5">
          {loading ? (
            <div className="flex h-24 items-center justify-center"><Spinner /></div>
          ) : accounts.length === 0 ? (
            <button
              type="button"
              onClick={openCreate}
              className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-divider px-6 py-10 text-default-500 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
            >
              <Inbox size={28} className="opacity-60" />
              <span className="text-sm font-semibold">Aún no hay cuentas de email</span>
              <span className="text-xs">Conecta la primera para usar la bandeja de entrada</span>
            </button>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => {
                const result = testResults[account._id];
                const disconnected = account.status === "disconnected";
                return (
                  <div
                    key={account._id}
                    className={`flex flex-col gap-3 rounded-2xl border p-4 transition-colors ${
                      disconnected ? "border-divider bg-default-50 opacity-80" : "border-divider bg-content1"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                        style={{ backgroundColor: accountColor(account._id) }}
                      >
                        {(account.label || account.emailAddress || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-bold">{account.label}</p>
                          {account.isDefault && (
                            <Chip size="sm" color="warning" variant="flat" startContent={<Star size={10} className="fill-current" />}>
                              Predeterminada
                            </Chip>
                          )}
                        </div>
                        <p className="truncate text-xs text-default-500">{account.emailAddress}</p>
                      </div>
                      <Dropdown placement="bottom-end">
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light" aria-label="Más acciones">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          aria-label="Acciones de la cuenta"
                          disabledKeys={[
                            ...(account.isDefault || disconnected ? ["default"] : []),
                            ...(disconnected ? ["disconnect"] : []),
                          ]}
                        >
                          <DropdownItem key="edit" startContent={<Pencil size={14} />} onPress={() => openEdit(account)}>
                            {disconnected ? "Reconectar" : "Editar"}
                          </DropdownItem>
                          <DropdownItem key="default" startContent={<Star size={14} />} onPress={() => makeDefault(account)}>
                            Hacer predeterminada
                          </DropdownItem>
                          <DropdownItem
                            key="disconnect"
                            startContent={<Unplug size={14} />}
                            onPress={() => setConfirm({ type: "disconnect", account })}
                          >
                            Desconectar
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            color="danger"
                            className="text-danger"
                            startContent={<Trash2 size={14} />}
                            onPress={() => setConfirm({ type: "delete", account })}
                          >
                            Eliminar
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Chip
                        size="sm"
                        variant="flat"
                        color={account.lastError ? "danger" : disconnected ? "default" : "success"}
                        startContent={account.lastError ? <AlertTriangle size={10} /> : disconnected ? <Plug size={10} /> : <CheckCircle2 size={10} />}
                      >
                        {account.lastError ? "Con problemas" : disconnected ? "Desconectada" : "Conectada"}
                      </Chip>
                      {!disconnected && (account.unreadCount || 0) > 0 && (
                        <Chip size="sm" variant="flat" color="primary">{account.unreadCount} sin leer</Chip>
                      )}
                      <span className="text-[11px] text-default-400">
                        {disconnected ? "Sin sincronizar" : `Sincronizada ${timeAgo(account.lastSyncAt)}`}
                      </span>
                    </div>

                    {account.lastError && (
                      <p className="rounded-lg bg-danger-50 px-2.5 py-1.5 text-[11px] text-danger-700">
                        {account.lastError}
                      </p>
                    )}

                    {result && result !== "loading" && (
                      <div className="space-y-1 rounded-lg bg-default-100 px-2.5 py-2 text-[11px]">
                        {(["smtp", "imap"] as const).map((k) => {
                          const r = result[k];
                          if (!r) return null;
                          return (
                            <p key={k} className={`flex items-start gap-1.5 ${r.ok ? "text-success-700" : "text-danger-700"}`}>
                              {r.ok ? <CheckCircle2 size={12} className="mt-0.5 shrink-0" /> : <XCircle size={12} className="mt-0.5 shrink-0" />}
                              <span><b>{k.toUpperCase()}</b>: {r.ok ? "correcto" : r.error || "falló"}</span>
                            </p>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-auto flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        startContent={result === "loading" ? undefined : <Zap size={14} />}
                        isLoading={result === "loading"}
                        isDisabled={disconnected}
                        onPress={() => testAccount(account)}
                      >
                        Probar
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        color={disconnected ? "primary" : "default"}
                        startContent={<Pencil size={14} />}
                        onPress={() => openEdit(account)}
                      >
                        {disconnected ? "Reconectar" : "Editar"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ───────── Create / edit drawer ───────── */}
      <Drawer isOpen={drawerOpen} placement="right" size="lg" onOpenChange={setDrawerOpen} scrollBehavior="inside">
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex flex-col gap-0.5 border-b border-divider">
                <h2 className="text-lg font-bold">
                  {editing ? (editing.status === "disconnected" ? "Reconectar cuenta" : "Editar cuenta") : "Agregar cuenta de email"}
                </h2>
                <p className="text-xs font-normal text-default-500">
                  Las credenciales se guardan cifradas y solo se usan para esta cuenta.
                </p>
              </DrawerHeader>

              <DrawerBody className="gap-5">
                {feedback && (
                  <div
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      feedback.smtp?.ok && feedback.imap?.ok
                        ? "border-success-200 bg-success-50 text-success-700"
                        : "border-danger-200 bg-danger-50 text-danger-700"
                    }`}
                  >
                    {feedback.smtp?.ok && feedback.imap?.ok ? (
                      "✓ Conexión SMTP e IMAP verificada correctamente."
                    ) : (
                      <div className="space-y-1">
                        <p className="font-semibold">No se pudo conectar:</p>
                        {feedback.smtp && !feedback.smtp.ok && <p className="text-xs">• SMTP: {feedback.smtp.error || "Falló la conexión"}</p>}
                        {feedback.imap && !feedback.imap.ok && <p className="text-xs">• IMAP: {feedback.imap.error || "Falló la conexión"}</p>}
                      </div>
                    )}
                  </div>
                )}

                {/* General */}
                <section className="space-y-3">
                  <p className="text-sm font-semibold">Cuenta</p>
                  <Input
                    label="Correo electrónico"
                    placeholder="ventas@tuagencia.com"
                    size="sm"
                    variant="bordered"
                    value={form.email}
                    onValueChange={onEmailChange}
                    isDisabled={!!editing}
                    description={editing ? "El correo no se puede cambiar. Para otro correo, agrega una cuenta nueva." : undefined}
                  />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Input
                      label="Nombre de la cuenta"
                      placeholder="Ventas"
                      size="sm"
                      variant="bordered"
                      value={form.label}
                      onValueChange={(v) => patch({ label: v })}
                      description="Cómo la verás en la bandeja"
                    />
                    <Input
                      label="Nombre del remitente"
                      placeholder="Equipo de Ventas"
                      size="sm"
                      variant="bordered"
                      value={form.fromName}
                      onValueChange={(v) => patch({ fromName: v })}
                      description="Lo que ve quien recibe"
                    />
                  </div>
                  <Select
                    label="Proveedor"
                    size="sm"
                    variant="bordered"
                    selectedKeys={form.provider ? [form.provider] : []}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys as Set<string>)[0];
                      const preset = PROVIDER_PRESETS.find((p) => p.key === key);
                      if (preset) applyPreset(preset);
                    }}
                    description="Completa los servidores automáticamente"
                  >
                    {PROVIDER_PRESETS.map((p) => (
                      <SelectItem key={p.key}>{p.name}</SelectItem>
                    ))}
                  </Select>
                  {currentPreset?.hint && (
                    <p className="flex items-start gap-1.5 rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-700">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                      {currentPreset.hint}
                    </p>
                  )}
                </section>

                {/* Credentials */}
                <section className="space-y-3">
                  <p className="text-sm font-semibold">Acceso</p>
                  <Input
                    label={editing ? "Contraseña (déjala vacía para conservar la actual)" : "Contraseña"}
                    type={showPass ? "text" : "password"}
                    size="sm"
                    variant="bordered"
                    value={form.smtpPass}
                    onValueChange={(v) => patch({ smtpPass: v })}
                    endContent={
                      <button type="button" onClick={() => setShowPass(!showPass)} className="focus:outline-none" aria-label="Mostrar contraseña">
                        {showPass ? <EyeOff size={16} className="text-default-400" /> : <Eye size={16} className="text-default-400" />}
                      </button>
                    }
                  />
                  <Switch size="sm" isSelected={form.samePass} onValueChange={(v) => patch({ samePass: v })}>
                    Usar la misma contraseña para recibir (IMAP)
                  </Switch>
                  {!form.samePass && (
                    <Input
                      label={editing ? "Contraseña IMAP (vacía = conservar)" : "Contraseña IMAP"}
                      type={showPass ? "text" : "password"}
                      size="sm"
                      variant="bordered"
                      value={form.imapPass}
                      onValueChange={(v) => patch({ imapPass: v })}
                    />
                  )}
                  <Switch
                    size="sm"
                    isSelected={form.sameUser}
                    onValueChange={(v) =>
                      patch({ sameUser: v, ...(v ? { smtpUser: form.email, imapUser: form.email } : {}) })
                    }
                  >
                    El usuario de acceso es el mismo correo
                  </Switch>
                  {!form.sameUser && (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Input label="Usuario SMTP" size="sm" variant="bordered" value={form.smtpUser} onValueChange={(v) => patch({ smtpUser: v })} />
                      <Input label="Usuario IMAP" size="sm" variant="bordered" value={form.imapUser} onValueChange={(v) => patch({ imapUser: v })} />
                    </div>
                  )}
                </section>

                {/* Servers */}
                <section className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowServers(!showServers)}
                    className="flex items-center gap-2 text-sm font-semibold text-default-700 hover:text-primary"
                  >
                    <ServerCog size={16} />
                    Servidores {showServers ? "(ocultar)" : "(ver / editar)"}
                  </button>
                  {!showServers && form.smtpHost && (
                    <p className="text-xs text-default-500">
                      SMTP {form.smtpHost}:{form.smtpPort} · IMAP {form.imapHost}:{form.imapPort}
                    </p>
                  )}
                  {showServers && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-default-500">SMTP (salida)</p>
                        <Input label="Servidor" size="sm" variant="bordered" value={form.smtpHost} onValueChange={(v) => patch({ smtpHost: v })} />
                        <div className="grid grid-cols-2 gap-3">
                          <Input type="number" label="Puerto" size="sm" variant="bordered" value={String(form.smtpPort)} onValueChange={(v) => patch({ smtpPort: Number(v || 0) })} />
                          <div className="flex items-end">
                            <Switch size="sm" isSelected={form.smtpSecure} onValueChange={(v) => patch({ smtpSecure: v })}>SSL/TLS</Switch>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-default-500">IMAP (entrada)</p>
                        <Input label="Servidor" size="sm" variant="bordered" value={form.imapHost} onValueChange={(v) => patch({ imapHost: v })} />
                        <div className="grid grid-cols-2 gap-3">
                          <Input type="number" label="Puerto" size="sm" variant="bordered" value={String(form.imapPort)} onValueChange={(v) => patch({ imapPort: Number(v || 0) })} />
                          <div className="flex items-end">
                            <Switch size="sm" isSelected={form.imapSecure} onValueChange={(v) => patch({ imapSecure: v })}>SSL/TLS</Switch>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </DrawerBody>

              <DrawerFooter className="border-t border-divider">
                <Button variant="light" onPress={onClose}>Cancelar</Button>
                <Button variant="flat" color="secondary" isLoading={testing} startContent={!testing ? <Zap size={14} /> : undefined} onPress={testForm}>
                  Probar conexión
                </Button>
                <Button color="primary" isLoading={saving} startContent={!saving ? <Save size={14} /> : undefined} onPress={save}>
                  {editing ? (editing.status === "disconnected" ? "Guardar y reconectar" : "Guardar cambios") : "Vincular cuenta"}
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* ───────── Disconnect / delete confirmation ───────── */}
      <Modal isOpen={!!confirm} onOpenChange={(open) => { if (!open) setConfirm(null); }} size="sm">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-divider">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={20} className="text-warning" />
                  <span>{confirm?.type === "delete" ? "Eliminar cuenta" : "Desconectar cuenta"}</span>
                </div>
              </ModalHeader>
              <ModalBody className="py-5">
                <p className="text-sm">
                  <b>{confirm?.account.label}</b> ({confirm?.account.emailAddress})
                </p>
                {confirm?.type === "delete" ? (
                  <p className="mt-2 text-xs text-default-500">
                    Se eliminará la cuenta y los correos descargados en AXENTYC. Tus correos en el servidor de email no se tocan. Esta acción no se puede deshacer.
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-default-500">
                    Dejará de sincronizar y de poder enviar. Conservamos su configuración y los correos descargados; podrás reconectarla cuando quieras. Libera un cupo del plan.
                  </p>
                )}
              </ModalBody>
              <ModalFooter className="border-t border-divider">
                <Button variant="light" onPress={onClose}>Cancelar</Button>
                <Button
                  color="danger"
                  isLoading={confirming}
                  startContent={confirming ? undefined : confirm?.type === "delete" ? <Trash2 size={16} /> : <Unplug size={16} />}
                  onPress={runConfirm}
                >
                  {confirm?.type === "delete" ? "Eliminar" : "Desconectar"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
