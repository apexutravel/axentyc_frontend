"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import NextLink from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Users,
  Zap,
  BarChart3,
  ArrowRight,
  Shield,
  Bot,
  Send,
  Instagram,
  Facebook,
  Music2,
  Mail,
  Sparkles,
  TrendingUp,
  Lock,
  Rocket,
  Target,
  CheckCircle2,
} from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 60 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
});

const channels = [
  { name: "WhatsApp", icon: Send, gradient: "from-green-500 to-emerald-600" },
  { name: "Instagram", icon: Instagram, gradient: "from-purple-500 to-pink-600" },
  { name: "Facebook", icon: Facebook, gradient: "from-blue-500 to-indigo-600" },
  { name: "TikTok", icon: Music2, gradient: "from-pink-500 to-rose-600" },
  { name: "Email", icon: Mail, gradient: "from-orange-500 to-amber-600" },
];

const features = [
  {
    icon: MessageSquare,
    title: "Inbox Omnichannel Unificado",
    desc: "WhatsApp, Instagram, Facebook, TikTok y email en una sola bandeja. Responde desde un solo lugar sin cambiar de app. Asignación automática de conversaciones al equipo.",
    gradient: "from-blue-500 to-cyan-500",
    direction: "left",
  },
  {
    icon: Users,
    title: "CRM Completo con Pipeline Visual",
    desc: "Gestiona leads y deals con un pipeline Kanban visual. Arrastra tarjetas entre etapas, asigna responsables, establece fechas de cierre y convierte conversaciones en ventas.",
    gradient: "from-purple-500 to-pink-500",
    direction: "right",
  },
  {
    icon: Bot,
    title: "IA para Respuestas Automáticas",
    desc: "Inteligencia artificial que responde automáticamente a preguntas frecuentes, extrae información de chats y clasifica intenciones. Tu equipo trabaja menos, vende más.",
    gradient: "from-orange-500 to-red-500",
    direction: "left",
  },
  {
    icon: Zap,
    title: "Automatizaciones Sin Código",
    desc: "Crea flujos de trabajo sin programar: asignación inteligente, etiquetado automático, notificaciones, escalamiento y más. Arrastra, suelta y automatiza.",
    gradient: "from-yellow-500 to-orange-500",
    direction: "right",
  },
  {
    icon: BarChart3,
    title: "Analytics y Métricas en Tiempo Real",
    desc: "Dashboards interactivos con métricas por canal, agente y pipeline de ventas. Tiempo de respuesta, tasa de conversión, satisfacción del cliente y más.",
    gradient: "from-green-500 to-emerald-500",
    direction: "left",
  },
];

const stats = [
  { value: "10K+", label: "Conversaciones/día", icon: MessageSquare },
  { value: "500+", label: "Empresas activas", icon: Rocket },
  { value: "5", label: "Canales integrados", icon: Send },
  { value: "99.9%", label: "Uptime SLA", icon: TrendingUp },
];

export default function HomePage() {
  useEffect(() => {
    // Cargar widget si está habilitado para el landing
    const loadWidget = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat-widget`
        );
        const data = await response.json();
        const config = data?.data || data;

        if (!config?.widgetId || !config?.enabled || !config?.showOnLanding) return;

        // Inyectar el script del widget
        const script = document.createElement("script");
        script.innerHTML = `
          (function() {
            window.CconeHubWidget = {
              widgetId: '${config.widgetId}',
              apiUrl: '${process.env.NEXT_PUBLIC_API_URL}'
            };
            var widgetScript = document.createElement('script');
            widgetScript.src = '${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "")}/widget/widget.js';
            widgetScript.async = true;
            document.head.appendChild(widgetScript);
          })();
        `;
        document.head.appendChild(script);
      } catch (error) {
        console.error("Error loading widget:", error);
      }
    };

    loadWidget();
  }, []);

  return (
    <div className="relative">
      {/* ═══ HERO ═══ */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-secondary/20 via-primary/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,0),rgba(17,24,39,1))]" />
          
          {/* Floating icons */}
          <motion.div
            className="absolute top-1/4 left-[15%] opacity-10"
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <MessageSquare size={80} className="text-primary" strokeWidth={1} />
          </motion.div>
          <motion.div
            className="absolute top-1/3 right-[10%] opacity-10"
            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <Zap size={60} className="text-secondary" strokeWidth={1} />
          </motion.div>
          <motion.div
            className="absolute bottom-1/4 left-[10%] opacity-10"
            animate={{ y: [0, -15, 0], rotate: [0, 3, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          >
            <Users size={70} className="text-primary" strokeWidth={1} />
          </motion.div>
          <motion.div
            className="absolute bottom-1/3 right-[20%] opacity-10"
            animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <BarChart3 size={65} className="text-secondary" strokeWidth={1} />
          </motion.div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <motion.div
            className="text-center max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6">
              Todas tus conversaciones.
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Un solo inbox.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-default-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              WhatsApp, Instagram, Facebook, TikTok y email unificados.
              <br className="hidden md:block" />
              CRM + IA + Automatizaciones en una plataforma.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button
                as={NextLink}
                className="font-bold shadow-xl shadow-primary/20"
                color="primary"
                endContent={<ArrowRight size={18} />}
                href="/pricing"
                radius="full"
                size="lg"
              >
                Comenzar Gratis
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-default-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-success" size={18} />
                <span>14 días gratis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-success" size={18} />
                <span>Sin tarjeta</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-success" size={18} />
                <span>Cancela cuando quieras</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-default-300 flex items-start justify-center p-2">
            <div className="w-1.5 h-1.5 rounded-full bg-default-300" />
          </div>
        </motion.div>
      </section>

      {/* ═══ CHANNELS MARQUEE ═══ */}
      <section className="py-16 border-y border-divider bg-gradient-to-b from-content1 to-background">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div className="flex flex-wrap items-center justify-center gap-8" {...fadeUp()}>
            {channels.map((ch, i) => {
              const Icon = ch.icon;
              return (
                <motion.div
                  key={ch.name}
                  className="group relative"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${ch.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 rounded-2xl`} />
                  <div className="relative flex items-center gap-3 px-6 py-3 rounded-2xl bg-content1 border border-divider group-hover:border-primary/30 transition-colors">
                    <Icon className="text-default-600 group-hover:text-primary transition-colors" size={24} />
                    <span className="font-semibold text-default-700 group-hover:text-foreground transition-colors">{ch.name}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ═══ FEATURES WITH SCREENSHOTS ═══ */}
      <section className="py-32" id="features">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div className="text-center max-w-3xl mx-auto mb-20" {...fadeUp()}>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-5">
              Todo lo que necesitas
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                en un solo lugar
              </span>
            </h2>
            <p className="text-lg text-default-400">
              Herramientas diseñadas para equipos que quieren vender más y atender mejor.
            </p>
          </motion.div>

          <div className="space-y-32">
            {features.map((f, idx) => {
              const Icon = f.icon;
              const isLeft = f.direction === "left";
              return (
                <motion.div
                  key={f.title}
                  className="grid md:grid-cols-2 gap-12 items-center"
                  initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Content */}
                  <div className={`${isLeft ? "md:order-1" : "md:order-2"} space-y-6`}>
                    <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-gradient-to-br ${f.gradient} bg-opacity-10`}>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center`}>
                        <Icon className="text-white" size={20} />
                      </div>
                      <span className={`font-bold text-sm bg-gradient-to-br ${f.gradient} bg-clip-text text-transparent`}>
                        Feature {idx + 1}
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight">
                      {f.title}
                    </h3>
                    <p className="text-lg text-default-500 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>

                  {/* Screenshot Placeholder - Floating */}
                  <div className={`${isLeft ? "md:order-2" : "md:order-1"} relative group`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-20 blur-3xl group-hover:opacity-30 transition-opacity duration-500`} />
                    <div className="relative aspect-video bg-gradient-to-br ${f.gradient} opacity-10 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-3xl transition-shadow duration-500">
                      <div className="text-center space-y-4">
                        <Icon className="mx-auto text-default-300" size={64} strokeWidth={1} />
                        <p className="text-sm text-default-400 font-medium px-8">
                          Screenshot del sistema real
                          <br />
                          <span className="text-xs">(Próximamente)</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="py-24 border-y border-divider bg-gradient-to-b from-background to-content1">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  className="text-center group"
                  {...fadeUp(idx * 0.1)}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="text-primary" size={28} />
                  </div>
                  <div className="text-5xl md:text-6xl font-black bg-gradient-to-br from-foreground to-default-600 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-default-500 font-medium">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ SECURITY HIGHLIGHT ═══ */}
      <section className="py-32">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...fadeUp()}>
            <Card className="border border-divider overflow-hidden">
              <CardBody className="p-0">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="p-12 md:p-16 flex flex-col justify-center">
                    <h3 className="text-2xl md:text-3xl font-black mb-6">
                      Seguridad que
                      <br />
                      <span className="text-warning">no se negocia</span>
                    </h3>
                    <p className="text-lg text-default-500 leading-relaxed mb-8">
                      Arquitectura Multi-Tenant con aislamiento completo de datos.
                      Cifrado end-to-end, SSO/SAML, roles granulares y auditoría completa.
                      SLA de 99.99% uptime.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <div className="px-4 py-2 rounded-full bg-default-100 text-sm font-medium">ISO 27001</div>
                      <div className="px-4 py-2 rounded-full bg-default-100 text-sm font-medium">SOC 2</div>
                      <div className="px-4 py-2 rounded-full bg-default-100 text-sm font-medium">GDPR</div>
                    </div>
                  </div>
                  <div className="relative bg-gradient-to-br from-warning/10 to-danger/10 p-12 md:p-16 flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-warning/20 blur-3xl rounded-full" />
                      <Lock className="relative text-warning" size={120} strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background -z-10" />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div {...fadeUp()}>
            <Target className="mx-auto text-primary mb-8" size={64} strokeWidth={1.5} />
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
              Listo para centralizar
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                tus ventas?
              </span>
            </h2>
            <p className="text-xl text-default-400 mb-12 max-w-2xl mx-auto">
              Únete a cientos de empresas que ya confían en CconeHub.
              Empieza gratis hoy.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                as={NextLink}
                className="font-bold shadow-xl shadow-primary/20"
                color="primary"
                endContent={<ArrowRight size={18} />}
                href="/pricing"
                radius="full"
                size="lg"
              >
                Ver Planes
              </Button>
              <Button
                as={NextLink}
                href="/about"
                radius="full"
                size="lg"
                variant="flat"
              >
                Conocer Más
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
