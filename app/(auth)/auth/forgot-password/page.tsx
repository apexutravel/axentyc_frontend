"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import NextLink from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1500);
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
          startContent={<Mail className="text-default-400" size={16} />}
          type="email"
          variant="bordered"
        />

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
