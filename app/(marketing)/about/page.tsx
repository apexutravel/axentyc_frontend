"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import NextLink from "next/link";
import { motion } from "framer-motion";
import {
  Target,
  Eye,
  Heart,
  ArrowRight,
  Globe,
  ShieldCheck,
  Sparkles,
  Users,
  Rocket,
  Headphones,
  Zap,
  TrendingUp,
} from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
});

const values = [
  {
    icon: Sparkles,
    title: "Innovación Constante",
    desc: "Construimos con las últimas tecnologías para ofrecer una plataforma rápida, estable y moderna.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Users,
    title: "Enfoque en el Cliente",
    desc: "Cada feature nace de una necesidad real. Escuchamos, iteramos y entregamos valor.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: ShieldCheck,
    title: "Seguridad Primero",
    desc: "Arquitectura multi-tenant con aislamiento completo, cifrado y cumplimiento de estándares.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Rocket,
    title: "Escalar sin Fricción",
    desc: "Desde un solo agente hasta cientos. La plataforma crece contigo sin migraciones ni límites.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Globe,
    title: "Omnichannel Nativo",
    desc: "No integramos canales como parche. Cada canal es ciudadano de primera clase en la plataforma.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: Headphones,
    title: "Soporte Humano",
    desc: "Detrás de cada ticket hay una persona. Nuestro equipo resuelve, no redirige.",
    gradient: "from-yellow-500 to-orange-500",
  },
];

export default function AboutPage() {
  return (
    <div className="relative">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-secondary/6 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Hero */}
      <section className="py-24 md:py-36">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div className="text-center max-w-4xl mx-auto" {...fadeUp()}>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-8">
              Control Center
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                One Hub
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-default-400 leading-relaxed max-w-3xl mx-auto">
              Somos <strong className="text-foreground">CconeHub</strong> — la plataforma
              que centraliza todas las conversaciones de tu empresa en un solo lugar.
              Nacimos para resolver un problema real: equipos de ventas y soporte
              perdidos entre múltiples apps, sin visibilidad ni control.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 border-y border-divider bg-gradient-to-b from-content1 to-background">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <motion.div {...fadeUp(0)}>
              <Card className="border border-divider h-full group hover:border-primary/30 transition-colors">
                <CardBody className="p-10 md:p-12">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <Target className="text-white" size={32} />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black mb-6">
                    Nuestra Misión
                  </h2>
                  <p className="text-lg text-default-500 leading-relaxed">
                    Empoderar a las empresas para que conviertan cada conversación
                    en una oportunidad de negocio. Simplificamos la gestión omnichannel
                    con un CRM inteligente que conecta redes sociales, automatiza procesos
                    y entrega métricas accionables — todo desde una sola plataforma.
                  </p>
                </CardBody>
              </Card>
            </motion.div>

            <motion.div {...fadeUp(0.1)}>
              <Card className="border border-divider h-full group hover:border-secondary/30 transition-colors">
                <CardBody className="p-10 md:p-12">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-pink-500 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <Eye className="text-white" size={32} />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black mb-6">
                    Nuestra Visión
                  </h2>
                  <p className="text-lg text-default-500 leading-relaxed">
                    Ser la plataforma de referencia para la gestión de conversaciones
                    comerciales en Latinoamérica y el mundo. Donde cada empresa,
                    sin importar su tamaño, pueda ofrecer una experiencia de atención
                    excepcional a través de cualquier canal digital.
                  </p>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-32">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div className="text-center max-w-3xl mx-auto mb-20" {...fadeUp()}>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
              Lo que nos{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                define
              </span>
            </h2>
            <p className="text-xl text-default-400">
              Principios que guían cada línea de código, cada feature
              y cada interacción con nuestros clientes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, idx) => {
              const Icon = v.icon;
              return (
                <motion.div key={v.title} {...fadeUp(idx * 0.05)}>
                  <Card className="border border-divider h-full group hover:border-primary/30 transition-all">
                    <div className={`absolute inset-0 bg-gradient-to-br ${v.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-xl`} />
                    <CardBody className="p-8 relative">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${v.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                        <Icon className="text-white" size={26} />
                      </div>
                      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{v.title}</h3>
                      <p className="text-default-500 leading-relaxed">{v.desc}</p>
                    </CardBody>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Who we are */}
      <section className="py-24 border-y border-divider bg-gradient-to-b from-background to-content1">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...fadeUp()}>
            <Card className="border border-divider overflow-hidden">
              <CardBody className="p-0">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="p-12 md:p-16 flex flex-col justify-center">
                    <h3 className="text-2xl md:text-3xl font-black mb-6">
                      ¿Quiénes somos?
                    </h3>
                    <p className="text-lg text-default-500 leading-relaxed mb-6">
                      Somos un equipo de ingenieros, diseñadores y especialistas en producto
                      apasionados por la tecnología y la experiencia del cliente.
                    </p>
                    <p className="text-lg text-default-500 leading-relaxed">
                      Creamos <strong className="text-foreground">Control Center One Hub (CconeHub)</strong>{" "}
                      porque creíamos que las herramientas de gestión de conversaciones
                      podían ser más simples, más potentes y más accesibles.
                      Cada día trabajamos para que tu equipo venda más y atienda mejor.
                    </p>
                  </div>
                  <div className="relative bg-gradient-to-br from-danger/10 to-pink/10 p-12 md:p-16 flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-danger/20 blur-3xl rounded-full" />
                      <Heart className="relative text-danger" size={120} strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { value: "2024", label: "Fundación", icon: Rocket },
              { value: "500+", label: "Empresas activas", icon: Users },
              { value: "10K+", label: "Conversaciones/día", icon: Zap },
              { value: "99.9%", label: "Uptime SLA", icon: TrendingUp },
            ].map((stat, idx) => {
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

      {/* CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background -z-10" />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div {...fadeUp()}>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
              ¿Listo para{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                trabajar juntos
              </span>?
            </h2>
            <p className="text-xl text-default-400 mb-12 max-w-2xl mx-auto">
              Conoce nuestros planes o escríbenos directamente. Estamos aquí para ayudarte.
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
                as="a"
                href="mailto:contacto@cconehub.com"
                radius="full"
                size="lg"
                variant="bordered"
              >
                Contáctanos
              </Button>
            </div>
            <p className="text-sm text-default-400 mt-8">
              contacto@cconehub.com · cconehub.com
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
