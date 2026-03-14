"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import {
  Users,
  UserPlus,
  Handshake,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  {
    title: "Conversaciones Activas",
    value: "128",
    change: "+12%",
    trend: "up" as const,
    icon: MessageSquare,
    color: "primary",
  },
  {
    title: "Contactos Totales",
    value: "2,847",
    change: "+8%",
    trend: "up" as const,
    icon: Users,
    color: "secondary",
  },
  {
    title: "Leads Nuevos",
    value: "64",
    change: "+23%",
    trend: "up" as const,
    icon: UserPlus,
    color: "success",
  },
  {
    title: "Deals en Pipeline",
    value: "$48,500",
    change: "-3%",
    trend: "down" as const,
    icon: Handshake,
    color: "warning",
  },
];

const recentConversations = [
  { name: "Maria Garcia", channel: "WhatsApp", message: "Hola, me interesa el plan premium", time: "2 min", unread: true },
  { name: "Carlos Lopez", channel: "Instagram", message: "Necesito info sobre precios", time: "15 min", unread: true },
  { name: "Ana Martinez", channel: "Facebook", message: "Gracias por la info!", time: "1 hr", unread: false },
  { name: "Pedro Sanchez", channel: "WhatsApp", message: "Cuando puedo agendar una demo?", time: "2 hr", unread: false },
  { name: "Laura Torres", channel: "TikTok", message: "Vi su video y quiero saber mas", time: "3 hr", unread: false },
];

const channelColors: Record<string, "primary" | "secondary" | "success" | "warning" | "danger"> = {
  WhatsApp: "success",
  Instagram: "secondary",
  Facebook: "primary",
  TikTok: "danger",
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  return (
    <motion.div
      animate="show"
      className="space-y-6"
      initial="hidden"
      variants={container}
    >
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-default-500 text-sm mt-1">
          Bienvenido de vuelta. Aqu&iacute; tienes un resumen de tu actividad.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={item}
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border border-divider">
              <CardBody className="gap-2">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-${stat.color}/10`}>
                    <Icon className={`text-${stat.color}`} size={20} />
                  </div>
                  <Chip
                    color={stat.trend === "up" ? "success" : "danger"}
                    size="sm"
                    startContent={
                      stat.trend === "up" ? (
                        <TrendingUp size={12} />
                      ) : (
                        <TrendingDown size={12} />
                      )
                    }
                    variant="flat"
                  >
                    {stat.change}
                  </Chip>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-default-500">{stat.title}</p>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <Card className="border border-divider">
            <CardHeader className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Conversaciones Recientes</h3>
              <Chip
                as="a"
                color="primary"
                endContent={<ArrowUpRight size={12} />}
                href="/dashboard/inbox"
                size="sm"
                variant="flat"
              >
                Ver todas
              </Chip>
            </CardHeader>
            <CardBody className="gap-0 pt-0">
              {recentConversations.map((conv, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 py-3 ${idx !== recentConversations.length - 1 ? "border-b border-divider" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-default-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium">
                      {conv.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${conv.unread ? "text-foreground" : "text-default-600"}`}>
                        {conv.name}
                      </p>
                      <Chip
                        color={channelColors[conv.channel] || "default"}
                        size="sm"
                        variant="dot"
                      >
                        {conv.channel}
                      </Chip>
                    </div>
                    <p className="text-xs text-default-400 truncate">
                      {conv.message}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-default-400">{conv.time}</span>
                    {conv.unread && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border border-divider">
            <CardHeader className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pipeline de Ventas</h3>
              <Chip
                as="a"
                color="primary"
                endContent={<ArrowUpRight size={12} />}
                href="/dashboard/deals"
                size="sm"
                variant="flat"
              >
                Ver pipeline
              </Chip>
            </CardHeader>
            <CardBody className="gap-4 pt-0">
              {[
                { stage: "Nuevo Lead", count: 12, value: "$18,200", color: "bg-blue-500" },
                { stage: "Contactado", count: 8, value: "$12,400", color: "bg-yellow-500" },
                { stage: "Propuesta", count: 5, value: "$24,500", color: "bg-purple-500" },
                { stage: "Negociaci\u00f3n", count: 3, value: "$15,800", color: "bg-orange-500" },
                { stage: "Cerrado", count: 7, value: "$32,100", color: "bg-green-500" },
              ].map((pipeline) => (
                <div key={pipeline.stage} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${pipeline.color}`} />
                      <span className="text-sm font-medium">{pipeline.stage}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-default-400">
                        {pipeline.count} deals
                      </span>
                      <span className="text-sm font-semibold">
                        {pipeline.value}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-default-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${pipeline.color}`}
                      style={{
                        width: `${(pipeline.count / 12) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
