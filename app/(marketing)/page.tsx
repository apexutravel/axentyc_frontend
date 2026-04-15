"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Accordion, AccordionItem } from "@heroui/accordion";
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
  CheckCircle2,
  Globe,
  Layers,
  GitBranch,
  Clock,
  HeadphonesIcon,
  ShieldCheck,
  Database,
  Server,
  Eye,
  Play,
  Star,
  ChevronRight,
  MousePointer2,
  Workflow,
  PieChart,
} from "lucide-react";

/* ─── animation helpers ─── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
});

const stagger = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

/* ─── data ─── */
const integrations = [
  { name: "Facebook Messenger", icon: Facebook, color: "text-blue-500", bg: "bg-blue-500/10" },
  { name: "Instagram DM", icon: Instagram, color: "text-pink-500", bg: "bg-pink-500/10" },
  { name: "WhatsApp Business", icon: Send, color: "text-green-500", bg: "bg-green-500/10" },
  { name: "TikTok", icon: Music2, color: "text-rose-500", bg: "bg-rose-500/10" },
  { name: "Email SMTP/IMAP", icon: Mail, color: "text-orange-500", bg: "bg-orange-500/10" },
  { name: "Live Chat Widget", icon: MessageSquare, color: "text-cyan-500", bg: "bg-cyan-500/10" },
];

const features = [
  {
    icon: MessageSquare,
    title: "Inbox Omnichannel",
    desc: "Una bandeja unificada para todos los canales. Asignación automática, etiquetado inteligente y vista de equipo en tiempo real.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Users,
    title: "CRM & Pipeline Visual",
    desc: "Pipeline Kanban drag & drop. Gestiona contactos, leads y deals con campos personalizados y seguimiento completo.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Bot,
    title: "Inteligencia Artificial",
    desc: "Respuestas automáticas, clasificación de intenciones, resúmenes de conversación y sugerencias de respuesta con IA.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Zap,
    title: "Automatizaciones",
    desc: "Flujos sin código: asignación inteligente, notificaciones, escalamiento automático y acciones por eventos.",
    gradient: "from-yellow-500 to-amber-500",
  },
  {
    icon: BarChart3,
    title: "Analytics Avanzados",
    desc: "Dashboards en tiempo real con métricas por agente, canal, tiempo de respuesta y conversión de ventas.",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    icon: Shield,
    title: "Multi-Tenant Seguro",
    desc: "Aislamiento total de datos por empresa. Roles granulares, auditoría y cifrado end-to-end para cada tenant.",
    gradient: "from-slate-500 to-zinc-500",
  },
];

const stats = [
  { value: "99.9%", label: "Uptime garantizado", suffix: "" },
  { value: "< 1s", label: "Tiempo de respuesta", suffix: "" },
  { value: "5+", label: "Canales integrados", suffix: "" },
  { value: "24/7", label: "Soporte técnico", suffix: "" },
];

const steps = [
  {
    num: "01",
    title: "Conecta tus canales",
    desc: "Vincula Facebook Messenger, Instagram, WhatsApp, email y más en minutos. Sin código, sin complicaciones.",
    icon: GitBranch,
  },
  {
    num: "02",
    title: "Centraliza las conversaciones",
    desc: "Todos los mensajes llegan a un inbox unificado. Tu equipo responde desde un solo lugar con contexto completo.",
    icon: Layers,
  },
  {
    num: "03",
    title: "Convierte y escala",
    desc: "Automatiza, mide y optimiza. Convierte conversaciones en ventas con IA, CRM visual y analytics en tiempo real.",
    icon: TrendingUp,
  },
];

const testimonials = [
  {
    name: "María González",
    role: "Directora Comercial",
    company: "TechRetail MX",
    text: "Pasamos de responder en 4 horas a menos de 5 minutos. AXENTYC transformó nuestra operación de atención al cliente y triplicó nuestras conversiones.",
    stars: 5,
  },
  {
    name: "Carlos Mendoza",
    role: "CEO & Fundador",
    company: "ServiPlus CO",
    text: "Tener WhatsApp, Instagram y Facebook en una sola bandeja fue un game-changer. Nuestro equipo es 3x más productivo desde que implementamos AXENTYC.",
    stars: 5,
  },
  {
    name: "Ana Rodríguez",
    role: "Head of Operations",
    company: "E-Commerce Pro",
    text: "La automatización y la IA nos permiten atender 10x más clientes sin ampliar el equipo. El ROI fue inmediato.",
    stars: 5,
  },
];

const faqs = [
  {
    q: "¿Cuánto tiempo toma configurar AXENTYC?",
    a: "La configuración básica toma menos de 10 minutos. Conectar canales como Facebook Messenger o email es un proceso guiado paso a paso. Tu equipo puede estar operando el mismo día.",
  },
  {
    q: "¿Qué canales de comunicación soportan?",
    a: "Actualmente soportamos Facebook Messenger, Instagram DM, WhatsApp Business, TikTok, email (SMTP/IMAP) y un widget de live chat embebible en tu sitio web. Continuamente añadimos más integraciones.",
  },
  {
    q: "¿Es seguro para manejar datos de clientes?",
    a: "Absolutamente. Utilizamos arquitectura Multi-Tenant con aislamiento completo de datos, cifrado en tránsito y en reposo, roles granulares de acceso y auditoría completa. Cumplimos con GDPR y mejores prácticas de seguridad.",
  },
  {
    q: "¿Puedo probarlo antes de pagar?",
    a: "Sí. Ofrecemos un período de prueba gratuito sin necesidad de tarjeta de crédito. Puedes explorar todas las funcionalidades y decidir si es la herramienta adecuada para tu negocio.",
  },
  {
    q: "¿Funciona para equipos grandes?",
    a: "Sí. AXENTYC está diseñado para escalar desde freelancers hasta empresas con cientos de agentes. Incluye asignación automática de conversaciones, roles de equipo, y métricas por agente.",
  },
  {
    q: "¿Ofrecen soporte técnico?",
    a: "Sí, ofrecemos soporte técnico por email y chat. Los planes empresariales incluyen un Customer Success Manager dedicado y SLA de respuesta garantizado.",
  },
];

const securityFeatures = [
  { icon: Lock, label: "Cifrado TLS/SSL" },
  { icon: Database, label: "Aislamiento de datos" },
  { icon: ShieldCheck, label: "GDPR Compliant" },
  { icon: Eye, label: "Auditoría completa" },
  { icon: Server, label: "99.9% Uptime SLA" },
  { icon: Globe, label: "CDN Global" },
];

export default function HomePage() {
  return (
    <div className="relative overflow-x-clip">

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-secondary/8 rounded-full blur-[120px]" />
          <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-24 md:py-32 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <Chip
                variant="flat"
                color="primary"
                size="sm"
                className="mb-6"
                startContent={<Sparkles size={14} />}
              >
                Plataforma Omnichannel + CRM + IA
              </Chip>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-6">
                Centraliza.
                <br />
                Automatiza.
                <br />
                <span className="bg-gradient-to-r from-primary via-blue-400 to-secondary bg-clip-text text-transparent">
                  Convierte.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-default-400 max-w-xl mb-8 leading-relaxed">
                Unifica Facebook Messenger, Instagram, WhatsApp, email y más
                en un solo inbox. Gestiona tu pipeline de ventas y automatiza
                respuestas con inteligencia artificial.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button
                  as={NextLink}
                  color="primary"
                  size="lg"
                  radius="lg"
                  href="/auth/register"
                  endContent={<ArrowRight size={18} />}
                  className="font-bold shadow-lg shadow-primary/25 px-8"
                >
                  Comenzar Gratis
                </Button>
                <Button
                  as={NextLink}
                  href="/#producto"
                  size="lg"
                  radius="lg"
                  variant="bordered"
                  startContent={<Play size={16} />}
                  className="font-semibold"
                >
                  Ver cómo funciona
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-default-400">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-success" /> Sin tarjeta de crédito</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-success" /> Setup en minutos</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-success" /> Cancela cuando quieras</span>
              </div>
            </motion.div>

            {/* Right: Product mockup */}
            <motion.div
              className="relative hidden lg:block"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative">
                {/* Glow */}
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 rounded-3xl blur-2xl" />

                {/* Main card - Inbox mockup */}
                <div className="relative bg-content1 border border-divider rounded-2xl shadow-2xl overflow-hidden">
                  {/* Titlebar */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-divider bg-content2/50">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-danger/60" />
                      <div className="w-3 h-3 rounded-full bg-warning/60" />
                      <div className="w-3 h-3 rounded-full bg-success/60" />
                    </div>
                    <span className="text-xs text-default-400 font-medium ml-2">AXENTYC — Inbox</span>
                  </div>

                  {/* Content */}
                  <div className="grid grid-cols-3 min-h-[320px]">
                    {/* Sidebar */}
                    <div className="col-span-1 border-r border-divider p-3 space-y-2">
                      {[
                        { name: "María López", ch: "Messenger", color: "bg-blue-500", unread: true },
                        { name: "Carlos R.", ch: "WhatsApp", color: "bg-green-500", unread: true },
                        { name: "Ana Torres", ch: "Instagram", color: "bg-pink-500", unread: false },
                        { name: "Pedro Díaz", ch: "Email", color: "bg-orange-500", unread: false },
                        { name: "Laura M.", ch: "Live Chat", color: "bg-cyan-500", unread: false },
                      ].map((c, i) => (
                        <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${i === 0 ? "bg-primary/10" : "hover:bg-default-100"} transition-colors cursor-default`}>
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-default-200 flex items-center justify-center text-xs font-bold text-default-600">{c.name[0]}</div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${c.color} border-2 border-content1`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs truncate ${c.unread ? "font-bold text-foreground" : "text-default-500"}`}>{c.name}</p>
                            <p className="text-[10px] text-default-400 truncate">{c.ch}</p>
                          </div>
                          {c.unread && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        </div>
                      ))}
                    </div>

                    {/* Chat area */}
                    <div className="col-span-2 flex flex-col">
                      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-divider">
                        <div className="w-7 h-7 rounded-full bg-default-200 flex items-center justify-center text-xs font-bold">M</div>
                        <div>
                          <p className="text-xs font-semibold">María López</p>
                          <p className="text-[10px] text-default-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> Messenger
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 p-4 space-y-3">
                        <div className="flex justify-start">
                          <div className="bg-default-100 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%]">
                            <p className="text-xs">Hola, estoy interesada en el plan empresarial. ¿Pueden darme más info?</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%]">
                            <p className="text-xs">¡Hola María! Claro que sí, con gusto te ayudo. 🎉</p>
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="bg-default-100 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%]">
                            <p className="text-xs">Perfecto, ¿incluye automatizaciones?</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-default-400">
                          <Bot size={12} className="text-primary" />
                          <span>IA sugiriendo respuesta...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating notification cards */}
                <motion.div
                  className="absolute -top-4 -right-6 bg-content1 border border-divider rounded-xl shadow-xl p-3 flex items-center gap-2.5"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Send size={14} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold">Nuevo mensaje</p>
                    <p className="text-[10px] text-default-400">WhatsApp • Ahora</p>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-3 -left-6 bg-content1 border border-divider rounded-xl shadow-xl p-3 flex items-center gap-2.5"
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold">+24% conversión</p>
                    <p className="text-[10px] text-default-400">vs. mes anterior</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ TRUST BAR ═══════════ */}
      <section className="py-10 border-y border-divider bg-content1/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fadeUp()} className="text-center">
            <p className="text-xs font-semibold text-default-400 uppercase tracking-widest mb-6">
              Integraciones oficiales con las plataformas líderes
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {integrations.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.name} className="flex items-center gap-2 text-default-400 hover:text-foreground transition-colors group">
                    <Icon size={22} className={`${item.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                    <span className="text-sm font-medium hidden sm:inline">{item.name}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ PRODUCT FEATURES ═══════════ */}
      <section className="py-24 md:py-36" id="producto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div className="text-center max-w-3xl mx-auto mb-16" {...fadeUp()}>
            <Chip variant="flat" size="sm" className="mb-4" startContent={<Layers size={14} />}>Producto</Chip>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-5">
              Todo lo que tu equipo necesita,{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                en un solo lugar
              </span>
            </h2>
            <p className="text-lg text-default-400 leading-relaxed">
              Herramientas potentes diseñadas para equipos de ventas y soporte que quieren escalar sin complicaciones.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  {...stagger}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                >
                  <Card
                    className="border border-divider hover:border-primary/30 transition-all duration-300 h-full group hover:shadow-lg hover:shadow-primary/5"
                    isPressable={false}
                  >
                    <CardBody className="p-6 space-y-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="text-white" size={22} />
                      </div>
                      <h3 className="text-lg font-bold">{f.title}</h3>
                      <p className="text-sm text-default-400 leading-relaxed">{f.desc}</p>
                    </CardBody>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ SHOWCASE 1 — CRM KANBAN ═══════════ */}
      <section className="py-24 md:py-36 bg-content1/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Copy */}
            <motion.div {...fadeUp()} className="order-2 lg:order-1">
              <Chip variant="flat" color="secondary" size="sm" className="mb-4" startContent={<Users size={14} />}>
                CRM & Pipeline
              </Chip>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-5">
                Pipeline visual que{" "}
                <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
                  convierte leads en clientes
                </span>
              </h2>
              <p className="text-lg text-default-400 leading-relaxed mb-6">
                Arrastra y suelta deals entre etapas. Ve el valor de cada negociación,
                asigna responsables y nunca pierdas el seguimiento de una oportunidad.
              </p>
              <div className="space-y-3">
                {[
                  "Pipeline Kanban drag & drop",
                  "Valor total por etapa en tiempo real",
                  "Asignación automática de responsables",
                  "Historial completo de cada deal",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-success shrink-0" />
                    <span className="text-sm text-default-500">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Kanban Mockup */}
            <motion.div
              className="order-1 lg:order-2 relative"
              {...fadeUp(0.15)}
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-violet-500/15 via-transparent to-purple-500/15 rounded-3xl blur-2xl" />
              <div className="relative bg-content1 border border-divider rounded-2xl shadow-2xl overflow-hidden">
                {/* Titlebar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-divider bg-content2/50">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-danger/60" />
                      <div className="w-3 h-3 rounded-full bg-warning/60" />
                      <div className="w-3 h-3 rounded-full bg-success/60" />
                    </div>
                    <span className="text-xs text-default-400 font-medium ml-2">AXENTYC — Deals Pipeline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] text-default-400 bg-default-100 px-2 py-0.5 rounded-md">Q1 2025</div>
                  </div>
                </div>

                {/* Kanban board */}
                <div className="flex gap-3 p-4 overflow-x-auto min-h-[320px]">
                  {[
                    {
                      title: "Nuevo", color: "bg-blue-500", count: 3, total: "$12,400",
                      cards: [
                        { name: "TechRetail MX", value: "$4,800", tag: "Messenger", tagColor: "text-blue-500", days: "2d" },
                        { name: "Farmacia Plus", value: "$3,200", tag: "WhatsApp", tagColor: "text-green-500", days: "1d" },
                        { name: "ModaLatam", value: "$4,400", tag: "Instagram", tagColor: "text-pink-500", days: "3d" },
                      ],
                    },
                    {
                      title: "Contactado", color: "bg-yellow-500", count: 2, total: "$8,600",
                      cards: [
                        { name: "ServiPlus CO", value: "$5,200", tag: "Email", tagColor: "text-orange-500", days: "5d" },
                        { name: "AutoPartes CR", value: "$3,400", tag: "WhatsApp", tagColor: "text-green-500", days: "4d" },
                      ],
                    },
                    {
                      title: "Propuesta", color: "bg-purple-500", count: 2, total: "$15,800",
                      cards: [
                        { name: "E-Commerce Pro", value: "$9,200", tag: "Messenger", tagColor: "text-blue-500", days: "7d" },
                        { name: "LogiFreight", value: "$6,600", tag: "Email", tagColor: "text-orange-500", days: "6d" },
                      ],
                    },
                    {
                      title: "Cerrado ✓", color: "bg-success", count: 1, total: "$7,500",
                      cards: [
                        { name: "GreenEnergy", value: "$7,500", tag: "WhatsApp", tagColor: "text-green-500", days: "12d" },
                      ],
                    },
                  ].map((col) => (
                    <div key={col.title} className="flex-shrink-0 w-[160px] space-y-2">
                      {/* Column header */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${col.color}`} />
                          <span className="text-[11px] font-bold text-foreground">{col.title}</span>
                          <span className="text-[10px] text-default-400 bg-default-100 px-1.5 rounded-full">{col.count}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-default-400 font-medium mb-2">{col.total}</div>

                      {/* Cards */}
                      <div className="space-y-2">
                        {col.cards.map((card) => (
                          <div key={card.name} className="bg-content2 border border-divider rounded-lg p-2.5 hover:border-primary/20 transition-colors cursor-default group">
                            <p className="text-[11px] font-semibold text-foreground truncate">{card.name}</p>
                            <p className="text-sm font-black text-foreground mt-1">{card.value}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-[9px] font-semibold ${card.tagColor}`}>{card.tag}</span>
                              <span className="text-[9px] text-default-400">{card.days}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating stat */}
              <motion.div
                className="absolute -bottom-4 -left-4 bg-content1 border border-divider rounded-xl shadow-xl p-3 flex items-center gap-2.5"
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <PieChart size={14} className="text-success" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold">$44,300</p>
                  <p className="text-[10px] text-default-400">Pipeline total</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ SHOWCASE 2 — OMNICHANNEL FEED ═══════════ */}
      <section className="py-24 md:py-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Multi-channel mockup */}
            <motion.div className="relative" {...fadeUp()}>
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/15 via-transparent to-green-500/15 rounded-3xl blur-2xl" />
              <div className="relative bg-content1 border border-divider rounded-2xl shadow-2xl overflow-hidden">
                {/* Titlebar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-divider bg-content2/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-danger/60" />
                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                  </div>
                  <span className="text-xs text-default-400 font-medium ml-2">AXENTYC — Contact Center</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] text-success font-medium">En vivo</span>
                  </div>
                </div>

                {/* Conversation feed */}
                <div className="p-4 space-y-3 min-h-[360px]">
                  {[
                    {
                      name: "Laura Méndez",
                      avatar: "L",
                      platform: "WhatsApp",
                      platformIcon: Send,
                      platformColor: "text-green-500",
                      dotColor: "bg-green-500",
                      msg: "Hola! Vi el anuncio de la promo 2x1, ¿sigue vigente? 🛍️",
                      time: "Ahora",
                      unread: true,
                      agent: null,
                    },
                    {
                      name: "Roberto Fernández",
                      avatar: "R",
                      platform: "Messenger",
                      platformIcon: Facebook,
                      platformColor: "text-blue-500",
                      dotColor: "bg-blue-500",
                      msg: "Necesito cambiar mi pedido #4521, me equivoqué de talla",
                      time: "2 min",
                      unread: true,
                      agent: null,
                    },
                    {
                      name: "Camila Torres",
                      avatar: "C",
                      platform: "Instagram",
                      platformIcon: Instagram,
                      platformColor: "text-pink-500",
                      dotColor: "bg-pink-500",
                      msg: "Me encantó el producto de la story! ¿Hacen envíos a Medellín?",
                      time: "5 min",
                      unread: false,
                      agent: "Ana G.",
                    },
                    {
                      name: "Diego Ruiz",
                      avatar: "D",
                      platform: "Email",
                      platformIcon: Mail,
                      platformColor: "text-orange-500",
                      dotColor: "bg-orange-500",
                      msg: "Re: Cotización Plan Enterprise — Adjunto el contrato firmado",
                      time: "12 min",
                      unread: false,
                      agent: "Carlos M.",
                    },
                    {
                      name: "Sofía Navarro",
                      avatar: "S",
                      platform: "Live Chat",
                      platformIcon: MessageSquare,
                      platformColor: "text-cyan-500",
                      dotColor: "bg-cyan-500",
                      msg: "¿Tienen API disponible para integrar con nuestro ERP?",
                      time: "18 min",
                      unread: false,
                      agent: "Bot IA",
                    },
                  ].map((conv, i) => {
                    const PlatformIcon = conv.platformIcon;
                    return (
                      <motion.div
                        key={i}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-default ${conv.unread ? "bg-primary/5 border-primary/20" : "bg-content2/50 border-divider hover:border-default-300"}`}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.08 }}
                      >
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full bg-default-200 flex items-center justify-center text-sm font-bold text-default-600">{conv.avatar}</div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${conv.dotColor} border-2 border-content1 flex items-center justify-center`}>
                            <PlatformIcon size={8} className="text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-xs font-bold ${conv.unread ? "text-foreground" : "text-default-600"} truncate`}>{conv.name}</span>
                              <span className={`text-[10px] font-semibold ${conv.platformColor}`}>{conv.platform}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-default-400">{conv.time}</span>
                              {conv.unread && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                          </div>
                          <p className={`text-xs mt-0.5 truncate ${conv.unread ? "text-default-600 font-medium" : "text-default-400"}`}>{conv.msg}</p>
                          {conv.agent && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-primary">{conv.agent[0]}</span>
                              </div>
                              <span className="text-[10px] text-default-400">{conv.agent}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Floating card */}
              <motion.div
                className="absolute -top-3 -right-4 bg-content1 border border-divider rounded-xl shadow-xl p-3 flex items-center gap-2.5"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold">5 canales activos</p>
                  <p className="text-[10px] text-default-400">12 conversaciones nuevas</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Copy */}
            <motion.div {...fadeUp(0.15)}>
              <Chip variant="flat" color="primary" size="sm" className="mb-4" startContent={<MessageSquare size={14} />}>
                Contact Center
              </Chip>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-5">
                Cada mensaje de cada canal,{" "}
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  en una sola bandeja
                </span>
              </h2>
              <p className="text-lg text-default-400 leading-relaxed mb-6">
                WhatsApp, Messenger, Instagram, email y live chat — todo llega al mismo lugar.
                Tu equipo ve quién escribió, desde dónde, y responde en segundos.
              </p>
              <div className="space-y-3">
                {[
                  "Indicador de canal en cada conversación",
                  "Asignación automática a agentes disponibles",
                  "IA que sugiere respuestas y clasifica intenciones",
                  "Historial unificado por contacto, sin importar el canal",
                  "Respuesta en tiempo real con indicadores de escritura",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-success shrink-0" />
                    <span className="text-sm text-default-500">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ SHOWCASE 3 — AUTOMATIONS ═══════════ */}
      <section className="py-24 md:py-36 bg-content1/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Copy */}
            <motion.div {...fadeUp()} className="order-2 lg:order-1">
              <Chip variant="flat" color="warning" size="sm" className="mb-4" startContent={<Zap size={14} />}>
                Automatizaciones
              </Chip>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-5">
                Automatiza lo repetitivo,{" "}
                <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  enfócate en vender
                </span>
              </h2>
              <p className="text-lg text-default-400 leading-relaxed mb-6">
                Crea flujos de trabajo visuales sin escribir código. Asignación inteligente,
                respuestas automáticas, etiquetado, escalamiento y más — todo con drag & drop.
              </p>
              <div className="space-y-3">
                {[
                  "Flujos visuales sin código",
                  "Triggers por canal, palabra clave o etiqueta",
                  "Respuestas automáticas con IA integrada",
                  "Escalamiento por tiempo sin respuesta",
                  "Notificaciones a Slack, email o dentro del CRM",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-success shrink-0" />
                    <span className="text-sm text-default-500">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Automation Workflow Mockup */}
            <motion.div className="order-1 lg:order-2 relative" {...fadeUp(0.15)}>
              <div className="absolute -inset-4 bg-gradient-to-br from-yellow-500/15 via-transparent to-orange-500/15 rounded-3xl blur-2xl" />
              <div className="relative bg-content1 border border-divider rounded-2xl shadow-2xl overflow-hidden">
                {/* Titlebar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-divider bg-content2/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-danger/60" />
                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                  </div>
                  <span className="text-xs text-default-400 font-medium ml-2">AXENTYC — Automatización</span>
                  <div className="ml-auto">
                    <div className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-md">Activo</div>
                  </div>
                </div>

                {/* Workflow */}
                <div className="p-6 flex flex-col items-center gap-3 min-h-[360px]">
                  {/* Trigger */}
                  <div className="w-full max-w-[280px] bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <MessageSquare size={14} className="text-blue-500" />
                      <span className="text-[11px] font-black text-blue-500 uppercase tracking-wider">Trigger</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground">Nuevo mensaje recibido</p>
                    <p className="text-[10px] text-default-400 mt-0.5">Cualquier canal • Contacto nuevo</p>
                  </div>

                  <div className="w-px h-5 bg-default-300 relative">
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-default-300" />
                  </div>

                  {/* Condition */}
                  <div className="w-full max-w-[280px] bg-warning/10 border-2 border-warning/30 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <GitBranch size={14} className="text-warning" />
                      <span className="text-[11px] font-black text-warning uppercase tracking-wider">Condición</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground">¿Mensaje contiene &quot;precio&quot;?</p>
                    <p className="text-[10px] text-default-400 mt-0.5">Analizar texto con IA</p>
                  </div>

                  {/* Branch */}
                  <div className="flex items-start gap-6 w-full max-w-[320px]">
                    {/* Yes branch */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">Sí</div>
                      <div className="w-px h-3 bg-success/40" />
                      <div className="w-full bg-success/10 border border-success/30 rounded-xl p-2.5 text-center">
                        <Bot size={12} className="text-success mx-auto mb-1" />
                        <p className="text-[10px] font-semibold text-foreground">Responder con IA</p>
                        <p className="text-[9px] text-default-400">Enviar lista de precios</p>
                      </div>
                      <div className="w-px h-3 bg-success/40" />
                      <div className="w-full bg-violet-500/10 border border-violet-500/30 rounded-xl p-2.5 text-center">
                        <Users size={12} className="text-violet-500 mx-auto mb-1" />
                        <p className="text-[10px] font-semibold text-foreground">Crear Lead</p>
                        <p className="text-[9px] text-default-400">Pipeline: Ventas</p>
                      </div>
                    </div>

                    {/* No branch */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-[10px] font-bold text-danger bg-danger/10 px-2 py-0.5 rounded-full">No</div>
                      <div className="w-px h-3 bg-danger/40" />
                      <div className="w-full bg-primary/10 border border-primary/30 rounded-xl p-2.5 text-center">
                        <Send size={12} className="text-primary mx-auto mb-1" />
                        <p className="text-[10px] font-semibold text-foreground">Asignar agente</p>
                        <p className="text-[9px] text-default-400">Round-robin equipo</p>
                      </div>
                      <div className="w-px h-3 bg-primary/40" />
                      <div className="w-full bg-orange-500/10 border border-orange-500/30 rounded-xl p-2.5 text-center">
                        <Clock size={12} className="text-orange-500 mx-auto mb-1" />
                        <p className="text-[10px] font-semibold text-foreground">Notificar</p>
                        <p className="text-[9px] text-default-400">Si no responde en 5 min</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating stat */}
              <motion.div
                className="absolute -top-3 -left-4 bg-content1 border border-divider rounded-xl shadow-xl p-3 flex items-center gap-2.5"
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Zap size={14} className="text-warning" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold">1,240 ejecuciones</p>
                  <p className="text-[10px] text-default-400">Últimos 7 días</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="py-24 md:py-36" id="como-funciona">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div className="text-center max-w-3xl mx-auto mb-16" {...fadeUp()}>
            <Chip variant="flat" size="sm" className="mb-4" startContent={<Workflow size={14} />}>Cómo funciona</Chip>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-5">
              Activo en{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                tres pasos
              </span>
            </h2>
            <p className="text-lg text-default-400">
              Implementación sencilla. Sin código. Sin consultores externos.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  className="relative"
                  {...stagger}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                >
                  {idx < steps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-[calc(50%+60px)] w-[calc(100%-120px)] h-px border-t-2 border-dashed border-divider z-0" />
                  )}
                  <div className="relative z-10 text-center space-y-5">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary/5 border-2 border-primary/10 mx-auto">
                      <Icon size={36} className="text-primary" strokeWidth={1.5} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-primary tracking-widest">{step.num}</span>
                      <h3 className="text-xl font-bold mt-1">{step.title}</h3>
                    </div>
                    <p className="text-sm text-default-400 leading-relaxed max-w-xs mx-auto">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ INTEGRATIONS GRID ═══════════ */}
      <section className="py-24 md:py-36" id="integraciones">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeUp()}>
              <Chip variant="flat" size="sm" className="mb-4" startContent={<Globe size={14} />}>Integraciones</Chip>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-5">
                Conecta todos los canales{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  donde están tus clientes
                </span>
              </h2>
              <p className="text-lg text-default-400 leading-relaxed mb-8">
                Integración nativa con las plataformas más usadas del mundo.
                Configura cada canal en minutos y empieza a recibir mensajes al instante.
              </p>
              <div className="space-y-3">
                {[
                  "Configuración guiada paso a paso",
                  "Webhooks en tiempo real",
                  "Soporte multi-tenant por empresa",
                  "Cumplimiento con políticas de cada plataforma",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-success shrink-0" />
                    <span className="text-sm text-default-500">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 gap-4"
              {...fadeUp(0.15)}
            >
              {integrations.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.name}
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Card className="border border-divider hover:border-primary/20 transition-all h-full">
                      <CardBody className="p-5 flex flex-col items-center text-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                          <Icon size={22} className={item.color} />
                        </div>
                        <span className="text-xs font-semibold text-default-600 leading-tight">{item.name}</span>
                      </CardBody>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section className="py-20 md:py-28 border-y border-divider bg-gradient-to-b from-content1/50 to-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                className="text-center"
                {...fadeUp(idx * 0.1)}
              >
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-default-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SECURITY ═══════════ */}
      <section className="py-24 md:py-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fadeUp()}>
            <Card className="border border-divider overflow-hidden bg-gradient-to-br from-content1 to-content2/50">
              <CardBody className="p-0">
                <div className="grid lg:grid-cols-2 gap-0">
                  <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
                    <Chip variant="flat" color="warning" size="sm" className="mb-5 w-fit" startContent={<ShieldCheck size={14} />}>
                      Seguridad Enterprise
                    </Chip>
                    <h2 className="text-2xl md:text-4xl font-black mb-5">
                      Seguridad y cumplimiento{" "}
                      <span className="text-warning">de nivel empresarial</span>
                    </h2>
                    <p className="text-base text-default-400 leading-relaxed mb-8">
                      Arquitectura Multi-Tenant con aislamiento completo de datos por empresa.
                      Cada organización opera en un entorno seguro con cifrado, auditoría
                      y controles de acceso granulares.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {securityFeatures.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-default-100/50 border border-divider">
                            <Icon size={16} className="text-warning shrink-0" />
                            <span className="text-xs font-medium text-default-600">{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="relative bg-gradient-to-br from-warning/5 via-warning/10 to-danger/5 p-8 sm:p-12 lg:p-16 flex items-center justify-center min-h-[300px]">
                    <div className="relative">
                      <div className="absolute inset-0 bg-warning/10 blur-[60px] rounded-full" />
                      <div className="relative flex flex-col items-center gap-4">
                        <Shield className="text-warning" size={80} strokeWidth={1} />
                        <div className="flex gap-2">
                          <Chip size="sm" variant="bordered" className="border-warning/30 text-warning">GDPR</Chip>
                          <Chip size="sm" variant="bordered" className="border-warning/30 text-warning">SOC 2</Chip>
                          <Chip size="sm" variant="bordered" className="border-warning/30 text-warning">ISO 27001</Chip>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="py-24 md:py-36 bg-content1/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div className="text-center max-w-3xl mx-auto mb-16" {...fadeUp()}>
            <Chip variant="flat" size="sm" className="mb-4" startContent={<Star size={14} />}>Testimonios</Chip>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-5">
              Empresas que ya{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                confían en nosotros
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <motion.div
                key={t.name}
                {...stagger}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="border border-divider h-full hover:border-primary/20 transition-colors">
                  <CardBody className="p-6 space-y-4">
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.stars }).map((_, i) => (
                        <Star key={i} size={14} className="text-warning fill-warning" />
                      ))}
                    </div>
                    <p className="text-sm text-default-500 leading-relaxed italic">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 pt-2 border-t border-divider">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-default-400">{t.role} · {t.company}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="py-24 md:py-36" id="faq">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <motion.div className="text-center mb-14" {...fadeUp()}>
            <Chip variant="flat" size="sm" className="mb-4" startContent={<HeadphonesIcon size={14} />}>FAQ</Chip>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              Preguntas frecuentes
            </h2>
            <p className="text-default-400">
              ¿Tienes dudas? Aquí encontrarás las respuestas más comunes.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.1)}>
            <Accordion variant="splitted" className="gap-3">
              {faqs.map((faq, idx) => (
                <AccordionItem
                  key={idx}
                  aria-label={faq.q}
                  title={<span className="text-sm font-semibold">{faq.q}</span>}
                  classNames={{
                    base: "border border-divider",
                    content: "text-sm text-default-400 leading-relaxed pb-4",
                  }}
                >
                  {faq.a}
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA + CONTACT FORM ═══════════ */}
      <section className="py-24 md:py-36 relative overflow-hidden" id="contacto">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-secondary/8 rounded-full blur-[100px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Contact Form */}
            <motion.div {...fadeUp()}>
              <Card className="border border-divider shadow-xl">
                <CardBody className="p-6 sm:p-8">
                  <h3 className="text-xl font-bold mb-1">Contáctanos</h3>
                  <p className="text-sm text-default-400 mb-6">Escríbenos y te respondemos en menos de 24h.</p>
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const data = new FormData(form);
                      const name = data.get("name");
                      const email = data.get("email");
                      const company = data.get("company");
                      const message = data.get("message");
                      window.location.href = `mailto:contacto@apexucode.com?subject=Contacto desde landing — ${company || name}&body=${encodeURIComponent(`Nombre: ${name}\nEmpresa: ${company}\nEmail: ${email}\n\n${message}`)}`;
                    }}
                  >
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-default-600 mb-1.5 block">Nombre</label>
                        <input
                          name="name"
                          required
                          placeholder="Tu nombre"
                          className="w-full px-3 py-2.5 rounded-xl bg-default-100 border border-divider text-sm placeholder:text-default-300 focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-default-600 mb-1.5 block">Email</label>
                        <input
                          name="email"
                          type="email"
                          required
                          placeholder="tu@empresa.com"
                          className="w-full px-3 py-2.5 rounded-xl bg-default-100 border border-divider text-sm placeholder:text-default-300 focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-default-600 mb-1.5 block">Empresa</label>
                      <input
                        name="company"
                        placeholder="Nombre de tu empresa"
                        className="w-full px-3 py-2.5 rounded-xl bg-default-100 border border-divider text-sm placeholder:text-default-300 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-default-600 mb-1.5 block">Mensaje</label>
                      <textarea
                        name="message"
                        required
                        rows={4}
                        placeholder="¿En qué podemos ayudarte?"
                        className="w-full px-3 py-2.5 rounded-xl bg-default-100 border border-divider text-sm placeholder:text-default-300 focus:outline-none focus:border-primary transition-colors resize-none"
                      />
                    </div>
                    <Button
                      type="submit"
                      color="primary"
                      radius="lg"
                      fullWidth
                      className="font-bold"
                      endContent={<Send size={16} />}
                    >
                      Enviar Mensaje
                    </Button>
                  </form>
                </CardBody>
              </Card>
            </motion.div>

            {/* Right — CTA Copy */}
            <motion.div {...fadeUp(0.15)}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-6">
                Empieza a convertir{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  conversaciones en ventas
                </span>
              </h2>
              <p className="text-lg text-default-400 mb-8 leading-relaxed">
                Únete a las empresas que ya centralizan sus comunicaciones,
                automatizan su operación y cierran más deals con AXENTYC.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button
                  as={NextLink}
                  color="primary"
                  size="lg"
                  radius="lg"
                  href="/auth/register"
                  endContent={<ArrowRight size={18} />}
                  className="font-bold shadow-lg shadow-primary/25 px-8"
                >
                  Comenzar Gratis
                </Button>
                <Button
                  as={NextLink}
                  href="/pricing"
                  size="lg"
                  radius="lg"
                  variant="bordered"
                  className="font-semibold"
                >
                  Ver Planes
                </Button>
              </div>
              <div className="space-y-3 text-sm text-default-400">
                <div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-success" /> Sin tarjeta de crédito</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-success" /> Setup en minutos</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-success" /> Cancela cuando quieras</div>
                <div className="flex items-center gap-2"><Mail size={15} className="text-primary" /> contacto@apexucode.com</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
