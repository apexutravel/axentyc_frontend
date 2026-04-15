"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import NextLink from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    // Session is now managed by HttpOnly cookies on the backend
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await AuthService.login(formData);
      await refreshUser();
      toast.success("¡Bienvenido de nuevo!");
      router.push("/dashboard");
    } catch (err: any) {
      const errorMessage = err.message || "Error al iniciar sesión";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 10 }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Iniciar Sesi&oacute;n</h1>
        <p className="text-sm text-default-500 mt-2">
          Ingresa a tu cuenta de AXENTYC
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 flex items-start gap-2">
          <AlertCircle className="text-danger mt-0.5" size={16} />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          autoComplete="email"
          label="Email"
          placeholder="tu@email.com"
          required
          startContent={<Mail className="text-default-400" size={16} />}
          type="email"
          value={formData.email}
          variant="bordered"
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />

        <Input
          autoComplete="current-password"
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
          label="Contrase&ntilde;a"
          placeholder="Tu contrase&ntilde;a"
          required
          startContent={<Lock className="text-default-400" size={16} />}
          type={isVisible ? "text" : "password"}
          value={formData.password}
          variant="bordered"
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />

        <div className="flex items-center justify-end">
          <NextLink
            className="text-sm text-primary hover:underline"
            href="/auth/forgot-password"
          >
            &iquest;Olvidaste tu contrase&ntilde;a?
          </NextLink>
        </div>

        <Button
          className="w-full"
          color="primary"
          isLoading={isLoading}
          size="lg"
          type="submit"
        >
          Iniciar Sesi&oacute;n
        </Button>
      </form>

      <Divider className="my-6" />

      <p className="text-center text-sm text-default-500">
        &iquest;No tienes cuenta?{" "}
        <NextLink
          className="text-primary font-medium hover:underline"
          href="/pricing"
        >
          Ver planes y registrarse
        </NextLink>
      </p>
    </motion.div>
  );
}
