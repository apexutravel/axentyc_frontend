"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import NextLink from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { API_ENDPOINTS } from "@/config/api";

async function postJson(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "include" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
    throw new Error(res.status === 429 ? "Demasiados intentos. Espera un minuto e inténtalo de nuevo." : msg || "No se pudo completar la solicitud");
  }
}


export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await postJson(API_ENDPOINTS.auth.forgotPassword, { email: email.trim() });
      setIsSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
      >
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-success" size={32} />
        </div>
        <h1 className="text-2xl font-bold">Revisa tu email</h1>
        <p className="text-sm text-default-500 mt-2 max-w-sm mx-auto">
          Si existe una cuenta con ese email, recibir&aacute;s un enlace para
          restablecer tu contrase&ntilde;a en los pr&oacute;ximos minutos.
        </p>
        <div className="mt-8 space-y-3">
          <Button
            as={NextLink}
            className="w-full"
            color="primary"
            href="/auth/login"
            variant="flat"
          >
            Volver a Iniciar Sesi&oacute;n
          </Button>
          <button
            className="text-sm text-primary hover:underline"
            onClick={() => setIsSent(false)}
          >
            &iquest;No recibiste el email? Reenviar
          </button>
        </div>
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
        <h1 className="text-2xl font-bold">Recuperar Contrase&ntilde;a</h1>
        <p className="text-sm text-default-500 mt-2">
          Ingresa tu email y te enviaremos un enlace para restablecer tu
          contrase&ntilde;a.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          autoComplete="email"
          label="Email"
          placeholder="tu@email.com"
          isRequired
          startContent={<Mail className="text-default-400" size={16} />}
          type="email"
          value={email}
          variant="bordered"
          onValueChange={setEmail}
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
          Enviar Enlace
        </Button>
      </form>
    </motion.div>
  );
}
