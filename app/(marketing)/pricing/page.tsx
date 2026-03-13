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
    name: "Starter",
    icon: Sparkles,
    tagline: "Para empezar",
    description: "Perfecto para validar tu flujo de ventas y conocer la plataforma.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    priceLabel: "Gratis",
    period: "14 días",
    cta: "Comenzar Gratis",
    popular: false,
    gradient: "from-blue-500 to-cyan-500",
    features: [
      "1 usuario incluido",
      "2 canales sociales",
      "100 conversaciones/mes",
      "50 contactos en CRM",
      "Inbox omnichannel",
      "Soporte por email",
    ],
  },
  {
    name: "Pro",
    icon: Rocket,
    tagline: "Más vendido",
    description: "Para equipos que necesitan escalar rápido y cerrar más deals.",
    monthlyPrice: 49,
    yearlyPrice: 39,
    priceLabel: null,
    period: "/mes por usuario",
    cta: "Empezar Ahora",
    popular: true,
    gradient: "from-purple-500 to-pink-500",
    features: [
      "Hasta 10 usuarios",
      "4 canales sociales",
      "Conversaciones ilimitadas",
      "Contactos ilimitados",
      "CRM completo (Leads + Deals)",
      "Automatizaciones sin límite",
      "Analytics y reportes",
      "Pipeline de ventas visual",
      "Asignación inteligente",
      "IA para respuestas automáticas",
      "Soporte prioritario 24/7",
    ],
  },
  {
    name: "Enterprise",
    icon: Building2,
    tagline: "A tu medida",
    description: "Solución completa para grandes organizaciones con necesidades avanzadas.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    priceLabel: "Custom",
    period: "Contactar ventas",
    cta: "Hablar con Ventas",
    popular: false,
    gradient: "from-orange-500 to-red-500",
    features: [
      "Usuarios ilimitados",
      "Todos los canales",
      "Todo lo de Pro incluido",
      "API completa + Webhooks",
      "White-label personalizado",
      "SSO / SAML",
      "SLA garantizado 99.99%",
      "Onboarding dedicado",
      "Account manager personal",
      "Integraciones custom",
      "Soporte enterprise 24/7",
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
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
                      ? "border-2 border-primary shadow-2xl shadow-primary/20 scale-105"
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
                    <Button
                      as={NextLink}
                      className={`w-full mb-8 font-bold ${plan.popular ? "shadow-xl shadow-primary/30" : ""}`}
                      color={plan.popular ? "primary" : "default"}
                      endContent={<ArrowRight size={18} />}
                      href={
                        plan.name === "Enterprise"
                          ? "/about"
                          : `/auth/register?plan=${plan.name.toLowerCase()}&billing=${billing}`
                      }
                      radius="lg"
                      size="lg"
                      variant={plan.popular ? "solid" : "bordered"}
                    >
                      {plan.cta}
                    </Button>

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
            Todos los planes incluyen SSL, backups diarios y soporte técnico.
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
