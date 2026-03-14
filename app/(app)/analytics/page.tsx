"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Tabs, Tab } from "@heroui/tabs";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  DollarSign,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const metrics = [
  { label: "Ingresos", value: "$48,500", change: "+12%", trend: "up", icon: DollarSign },
  { label: "Conversaciones", value: "1,284", change: "+18%", trend: "up", icon: MessageSquare },
  { label: "Leads Convertidos", value: "64", change: "+23%", trend: "up", icon: TrendingUp },
  { label: "Contactos Nuevos", value: "312", change: "-5%", trend: "down", icon: Users },
];

const channelData = [
  { channel: "WhatsApp", conversations: 520, leads: 45, deals: 12, revenue: "$18,200", percentage: 40 },
  { channel: "Instagram", conversations: 340, leads: 28, deals: 8, revenue: "$12,400", percentage: 26 },
  { channel: "Facebook", conversations: 280, leads: 18, deals: 5, revenue: "$8,500", percentage: 22 },
  { channel: "TikTok", conversations: 144, leads: 8, deals: 2, revenue: "$3,400", percentage: 12 },
];

const channelColors: Record<string, string> = {
  WhatsApp: "bg-green-500",
  Instagram: "bg-purple-500",
  Facebook: "bg-blue-500",
  TikTok: "bg-red-500",
};

export default function AnalyticsPage() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-default-500 text-sm mt-1">
            Métricas y análisis de rendimiento de tu CRM.
          </p>
        </div>
        <Tabs size="sm" variant="bordered">
          <Tab key="7d" title="7 días" />
          <Tab key="30d" title="30 días" />
          <Tab key="90d" title="90 días" />
        </Tabs>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="border border-divider">
              <CardBody>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="text-primary" size={18} />
                  </div>
                  <Chip
                    color={metric.trend === "up" ? "success" : "danger"}
                    size="sm"
                    startContent={metric.trend === "up" ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                    variant="flat"
                  >
                    {metric.change}
                  </Chip>
                </div>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-xs text-default-500 mt-1">{metric.label}</p>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-divider">
          <CardHeader>
            <h3 className="text-lg font-semibold">Rendimiento por Canal</h3>
          </CardHeader>
          <CardBody className="gap-4 pt-0">
            {channelData.map((ch) => (
              <div key={ch.channel} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${channelColors[ch.channel]}`} />
                    <span className="text-sm font-medium">{ch.channel}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-default-500">
                    <span>{ch.conversations} conv.</span>
                    <span>{ch.leads} leads</span>
                    <span className="font-semibold text-foreground">{ch.revenue}</span>
                  </div>
                </div>
                <div className="w-full bg-default-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${channelColors[ch.channel]}`}
                    style={{ width: `${ch.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="border border-divider">
          <CardHeader>
            <h3 className="text-lg font-semibold">Embudo de Conversión</h3>
          </CardHeader>
          <CardBody className="gap-4 pt-0">
            {[
              { stage: "Visitantes", count: 5240, percentage: 100 },
              { stage: "Conversaciones", count: 1284, percentage: 24 },
              { stage: "Contactos", count: 847, percentage: 16 },
              { stage: "Leads", count: 312, percentage: 6 },
              { stage: "Deals Creados", count: 64, percentage: 1.2 },
              { stage: "Cerrados", count: 18, percentage: 0.3 },
            ].map((stage, idx) => (
              <div key={stage.stage} className="flex items-center gap-4">
                <div className="w-32 text-sm text-right">
                  <p className="font-medium">{stage.stage}</p>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-default-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-6 rounded-full bg-primary/80 flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${Math.max(stage.percentage, 8)}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        {stage.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-default-400 w-12 text-right">
                  {stage.percentage}%
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </motion.div>
  );
}
