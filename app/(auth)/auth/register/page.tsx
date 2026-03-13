"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import NextLink from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Building2, Check, AlertCircle } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const planInfo: Record<string, { name: string; color: "default" | "primary" | "secondary"; description: string }> = {
  starter: {
    name: "Starter",
    color: "default",
    description: "Prueba gratuita de 14 d\u00edas",
  },
  pro: {
    name: "Pro",
    color: "primary",
    description: "$49/mes por usuario",
  },
  enterprise: {
    name: "Enterprise",
    color: "secondary",
    description: "Plan personalizado",
  },
};

function RegisterForm() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get("plan") || "starter";
  const plan = planInfo[selectedPlan] || planInfo.starter;

  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
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
      await AuthService.register(formData);
      await refreshUser();
      toast.success("¡Cuenta creada exitosamente! Bienvenido a CconeHub");
      router.push("/dashboard");
    } catch (err: any) {
      const errorMessage = err.message || "Error al registrarse";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 10 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Crear Cuenta</h1>
        <p className="text-sm text-default-500 mt-2">
          Reg&iacute;strate para comenzar a usar CconeHub
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 flex items-start gap-2">
          <AlertCircle className="text-danger mt-0.5" size={16} />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Plan selected */}
      <div className="mb-6 p-4 rounded-xl border border-divider bg-content2/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="text-success" size={16} />
            <span className="text-sm font-medium">Plan seleccionado:</span>
            <Chip color={plan.color} size="sm" variant="flat">
              {plan.name}
            </Chip>
          </div>
          <NextLink
            className="text-xs text-primary hover:underline"
            href="/pricing"
          >
            Cambiar
          </NextLink>
        </div>
        <p className="text-xs text-default-400 mt-1 ml-6">
          {plan.description}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <Input
            autoComplete="given-name"
            label="Nombre"
            placeholder="Juan"
            required
            startContent={<User className="text-default-400" size={16} />}
            value={formData.firstName}
            variant="bordered"
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
          <Input
            autoComplete="family-name"
            label="Apellido"
            placeholder="P&eacute;rez"
            required
            value={formData.lastName}
            variant="bordered"
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>

        <Input
          autoComplete="organization"
          label="Nombre de la empresa"
          placeholder="Mi Empresa S.A."
          required
          startContent={<Building2 className="text-default-400" size={16} />}
          value={formData.companyName}
          variant="bordered"
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
        />

        <Input
          autoComplete="email"
          label="Email corporativo"
          placeholder="tu@empresa.com"
          required
          startContent={<Mail className="text-default-400" size={16} />}
          type="email"
          value={formData.email}
          variant="bordered"
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />

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
          label="Contrase&ntilde;a"
          minLength={6}
          placeholder="M&iacute;nimo 6 caracteres"
          required
          startContent={<Lock className="text-default-400" size={16} />}
          type={isVisible ? "text" : "password"}
          value={formData.password}
          variant="bordered"
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />

        <p className="text-xs text-default-400">
          Al registrarte, aceptas nuestros{" "}
          <NextLink className="text-primary hover:underline" href="#">
            T&eacute;rminos de Servicio
          </NextLink>{" "}
          y{" "}
          <NextLink className="text-primary hover:underline" href="#">
            Pol&iacute;tica de Privacidad
          </NextLink>
          .
        </p>

        <input name="plan" type="hidden" value={selectedPlan} />

        <Button
          className="w-full"
          color="primary"
          isLoading={isLoading}
          size="lg"
          type="submit"
        >
          Crear Cuenta
        </Button>
      </form>

      <Divider className="my-6" />

      <p className="text-center text-sm text-default-500">
        &iquest;Ya tienes cuenta?{" "}
        <NextLink
          className="text-primary font-medium hover:underline"
          href="/auth/login"
        >
          Iniciar Sesi&oacute;n
        </NextLink>
      </p>
    </motion.div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
