"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import NextLink from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ArrowRight,
  Sparkles,
  Rocket,
  Building2,
  Zap,
} from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
});

const plans = [
  {
    key: "free",
    name: "Free",
    icon: Sparkles,
    tagline: "Explora",
    description: "Para conocer AXENTYC con límites básicos y sin tarjeta.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    priceLabel: "Gratis",
    period: "siempre",
    cta: "Crear Cuenta",
    popular: false,
    gradient: "from-blue-500 to-cyan-500",
    features: [
      "1 workspace",
      "1 usuario",
      "1 canal conectado",
      "50 conversaciones/mes",
      "Inbox básico",
      "Branding AXENTYC",
    ],
  },
  {
    key: "starter",
    name: "Starter",
    icon: Zap,
    tagline: "Para empezar",
    description: "Para negocios pequeños que centralizan sus conversaciones.",
    monthlyPrice: 29,
    yearlyPrice: 23,
    priceLabel: null,
    period: "/mes",
    cta: "Probar Starter",
    popular: false,
    gradient: "from-cyan-500 to-blue-500",
    features: [
      "14 días de prueba",
      "1 workspace",
      "3 usuarios",
      "3 canales conectados",
      "500 conversaciones/mes",
      "Meta básico: Messenger, Facebook e Instagram",
      "Email, widget o WhatsApp según cupo",
      "5 automatizaciones activas",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    icon: Rocket,
    tagline: "Más vendido",
    description: "Para equipos que necesitan escalar rápido y cerrar más deals.",
    monthlyPrice: 79,
    yearlyPrice: 63,
    priceLabel: null,
    period: "/mes",
    cta: "Probar Pro",
    popular: true,
    gradient: "from-purple-500 to-pink-500",
    features: [
      "14 días de prueba",
      "5 workspaces",
      "Hasta 10 usuarios",
      "15 canales conectados",
      "5,000 conversaciones/mes",
      "CRM completo (Leads + Deals)",
      "Automatizaciones",
      "Reportes por workspace",
      "Ideal para equipos en crecimiento",
    ],
  },
  {
    key: "business",
    name: "Business",
    icon: Building2,
    tagline: "Multi-marca",
    description: "Para agencias, franquicias y operaciones con múltiples marcas.",
    monthlyPrice: 199,
    yearlyPrice: 159,
    priceLabel: null,
    period: "/mes",
    cta: "Probar Business",
    popular: false,
    gradient: "from-orange-500 to-red-500",
    features: [
      "14 días de prueba",
      "25 workspaces",
      "30 usuarios",
      "75 canales conectados",
      "White-label",
      "25,000 conversaciones/mes",
      "Permisos avanzados por workspace",
      "Soporte prioritario",
    ],
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-gradient-to-tl from-secondary/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        {/* Header */}
        <motion.div className="text-center max-w-3xl mx-auto mb-20" {...fadeUp()}>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
            Invierte en crecer,
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              no en herramientas
            </span>
          </h1>

          <p className="text-xl text-default-400 mb-12">
            Sin contratos largos. Sin costos ocultos. Cancela cuando quieras.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-content1 border border-divider">
            <button
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                billing === "monthly"
                  ? "bg-primary text-white shadow-lg"
                  : "text-default-600 hover:text-foreground"
              }`}
              onClick={() => setBilling("monthly")}
            >
              Mensual
            </button>
            <button
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                billing === "yearly"
                  ? "bg-primary text-white shadow-lg"
                  : "text-default-600 hover:text-foreground"
              }`}
              onClick={() => setBilling("yearly")}
            >
              Anual
              <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-bold">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
          {plans.map((plan, idx) => {
            const Icon = plan.icon;
            const price =
              plan.priceLabel ??
              `$${billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}`;
            const yearSavings =
              billing === "yearly" && plan.monthlyPrice > 0
                ? (plan.monthlyPrice - plan.yearlyPrice) * 12
                : 0;

            return (
              <motion.div key={plan.name} {...fadeUp(idx * 0.1)}>
                <Card
                  className={`relative overflow-visible h-full group ${
                        plan.popular
                          ? "border-2 border-primary shadow-2xl shadow-primary/20 xl:scale-105"
                      : "border border-divider hover:border-primary/30"
                  } transition-all duration-300`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold shadow-lg">
                        {plan.tagline}
                      </div>
                    </div>
                  )}

                  <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-xl`} />

                  <CardBody className="p-8 relative">
                    {/* Icon + Name */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                        <Icon className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black">{plan.name}</h3>
                        {!plan.popular && (
                          <p className="text-xs text-default-400 font-medium">{plan.tagline}</p>
                        )}
                      </div>
                    </div>

                    <p className="text-default-500 mb-8 leading-relaxed">
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="mb-8">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${plan.name}-${billing}`}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          initial={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-5xl font-black tracking-tight">
                              {price}
                            </span>
                            {!plan.priceLabel && plan.monthlyPrice > 0 && (
                              <span className="text-default-400 text-sm">
                                {plan.period}
                              </span>
                            )}
                          </div>
                          {plan.priceLabel && (
                            <p className="text-sm text-default-400">{plan.period}</p>
                          )}
                          {plan.monthlyPrice === 0 && !plan.priceLabel && (
                            <p className="text-sm text-default-400">{plan.period}</p>
                          )}
                          {yearSavings > 0 && (
                            <p className="text-sm text-success font-semibold">
                              Ahorras ${yearSavings}/año
                            </p>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* CTA */}
                    <NextLink
                      href={
                        `/auth/register?plan=${plan.key}&billing=${billing}`
                      }
                    >
                      <Button
                        className={`w-full mb-8 font-bold ${plan.popular ? "shadow-xl shadow-primary/30" : ""}`}
                        color={plan.popular ? "primary" : "default"}
                        endContent={<ArrowRight size={18} />}
                        radius="lg"
                        size="lg"
                        variant={plan.popular ? "solid" : "bordered"}
                      >
                        {plan.cta}
                      </Button>
                    </NextLink>

                    {/* Features */}
                    <div className="space-y-3">
                      {plan.features.map((f) => (
                        <div key={f} className="flex items-start gap-3">
                          <div className="mt-0.5 w-5 h-5 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
                            <Check className="text-success" size={14} strokeWidth={3} />
                          </div>
                          <span className="text-sm text-default-600">{f}</span>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <motion.div className="text-center max-w-2xl mx-auto" {...fadeUp(0.3)}>
          <p className="text-default-400 leading-relaxed">
            Un canal conectado puede ser una página de Facebook, cuenta de Instagram,
            WhatsApp, email o widget. Messenger y comentarios se incluyen dentro del canal Meta.
            <br />
            ¿Tienes dudas?{" "}
            <NextLink className="text-primary hover:underline font-semibold" href="/about">
              Habla con nosotros
            </NextLink>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
