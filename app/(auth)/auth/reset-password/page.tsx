"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import NextLink from "next/link";
import { motion } from "framer-motion";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { API_ENDPOINTS } from "@/config/api";

async function postJson(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "include" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
    throw new Error(res.status === 429 ? "Demasiados intentos. Espera un minuto e inténtalo de nuevo." : msg || "No se pudo completar la solicitud");
  }
}


function ResetPasswordForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isVisible2, setIsVisible2] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres");
    if (password !== confirm) return setError("Las contraseñas no coinciden");
    setIsLoading(true);
    try {
      await postJson(API_ENDPOINTS.auth.resetPassword, { token, password });
      setIsReset(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <AlertCircle className="mx-auto mb-4 text-danger" size={32} />
        <h1 className="text-2xl font-bold">Enlace no válido</h1>
        <p className="mt-2 text-sm text-default-500">Falta el código de recuperación. Solicita un nuevo enlace.</p>
        <Button as={NextLink} className="mt-8 w-full" color="primary" href="/auth/forgot-password" size="lg">Solicitar enlace</Button>
      </div>
    );
  }

  if (isReset) {
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
      >
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-success" size={32} />
        </div>
        <h1 className="text-2xl font-bold">Contrase&ntilde;a actualizada</h1>
        <p className="text-sm text-default-500 mt-2">
          Tu contrase&ntilde;a ha sido cambiada exitosamente. Ya puedes iniciar
          sesi&oacute;n con tu nueva contrase&ntilde;a.
        </p>
        <Button
          as={NextLink}
          className="w-full mt-8"
          color="primary"
          href="/auth/login"
          size="lg"
        >
          Iniciar Sesi&oacute;n
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 10 }}
    >
      <NextLink
        className="inline-flex items-center gap-1 text-sm text-default-500 hover:text-foreground mb-6"
        href="/auth/login"
      >
        <ArrowLeft size={14} />
        Volver al login
      </NextLink>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Nueva Contrase&ntilde;a
        </h1>
        <p className="text-sm text-default-500 mt-2">
          Ingresa tu nueva contrase&ntilde;a.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          autoComplete="new-password"
          endContent={
            <button
              className="focus:outline-none"
              type="button"
              onClick={() => setIsVisible(!isVisible)}
            >
              {isVisible ? (
                <EyeOff className="text-default-400" size={16} />
              ) : (
                <Eye className="text-default-400" size={16} />
              )}
            </button>
          }
          label="Nueva contrase&ntilde;a"
          placeholder="M&iacute;nimo 6 caracteres"
          startContent={<Lock className="text-default-400" size={16} />}
          type={isVisible ? "text" : "password"}
          value={password}
          variant="bordered"
          onValueChange={setPassword}
        />

        <Input
          autoComplete="new-password"
          endContent={
            <button
              className="focus:outline-none"
              type="button"
              onClick={() => setIsVisible2(!isVisible2)}
            >
              {isVisible2 ? (
                <EyeOff className="text-default-400" size={16} />
              ) : (
                <Eye className="text-default-400" size={16} />
              )}
            </button>
          }
          label="Confirmar contrase&ntilde;a"
          placeholder="Repite tu contrase&ntilde;a"
          startContent={<Lock className="text-default-400" size={16} />}
          type={isVisible2 ? "text" : "password"}
          value={confirm}
          variant="bordered"
          onValueChange={setConfirm}
        />

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/10 p-3">
            <AlertCircle className="mt-0.5 text-danger" size={16} />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <Button
          className="w-full"
          color="primary"
          isLoading={isLoading}
          size="lg"
          type="submit"
        >
          Restablecer Contrase&ntilde;a
        </Button>
      </form>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
