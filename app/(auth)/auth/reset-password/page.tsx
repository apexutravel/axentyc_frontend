"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import NextLink from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, CheckCircle, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [isVisible2, setIsVisible2] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsReset(true);
    }, 1500);
  };

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
          variant="bordered"
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
          variant="bordered"
        />

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
