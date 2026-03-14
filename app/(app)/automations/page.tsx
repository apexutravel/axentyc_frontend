"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Switch } from "@heroui/switch";
import { motion } from "framer-motion";
import { Plus, Zap, MessageSquare, UserPlus, Handshake, Bell } from "lucide-react";

const automations = [
  {
    id: "1",
    name: "Auto-respuesta WhatsApp",
    description: "Envía respuesta automática cuando se recibe un mensaje nuevo por WhatsApp",
    trigger: "message.received",
    actions: ["auto_reply"],
    isActive: true,
    executions: 342,
    lastExecuted: "Hace 5 min",
  },
  {
    id: "2",
    name: "Crear Lead desde conversación",
    description: "Crea un lead automáticamente cuando se inicia una nueva conversación",
    trigger: "conversation.created",
    actions: ["create_lead", "assign_agent"],
    isActive: true,
    executions: 128,
    lastExecuted: "Hace 30 min",
  },
  {
    id: "3",
    name: "Notificar cambio de etapa",
    description: "Envía notificación cuando un deal cambia de etapa en el pipeline",
    trigger: "deal.stage_changed",
    actions: ["send_notification"],
    isActive: false,
    executions: 56,
    lastExecuted: "Hace 2 días",
  },
  {
    id: "4",
    name: "Asignar agente por canal",
    description: "Asigna automáticamente un agente según el canal de comunicación",
    trigger: "message.received",
    actions: ["assign_agent"],
    isActive: true,
    executions: 89,
    lastExecuted: "Hace 1 hr",
  },
];

const triggerIcons: Record<string, React.ComponentType<any>> = {
  "message.received": MessageSquare,
  "conversation.created": MessageSquare,
  "lead.created": UserPlus,
  "deal.stage_changed": Handshake,
  "deal.updated": Handshake,
  "contact.created": UserPlus,
};

const triggerLabels: Record<string, string> = {
  "message.received": "Mensaje recibido",
  "conversation.created": "Conversación creada",
  "lead.created": "Lead creado",
  "deal.stage_changed": "Deal cambió etapa",
  "deal.updated": "Deal actualizado",
  "contact.created": "Contacto creado",
};

export default function AutomationsPage() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automatizaciones</h1>
          <p className="text-default-500 text-sm mt-1">
            Configura flujos automáticos para optimizar tu operación.
          </p>
        </div>
        <Button color="primary" startContent={<Plus size={16} />}>
          Nueva Automatización
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {automations.map((automation) => {
          const TriggerIcon = triggerIcons[automation.trigger] || Zap;

          return (
            <motion.div
              key={automation.id}
              whileHover={{ scale: 1.01 }}
            >
              <Card className="border border-divider">
                <CardHeader className="flex items-start justify-between pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${automation.isActive ? "bg-primary/10" : "bg-default-100"}`}>
                      <TriggerIcon
                        className={automation.isActive ? "text-primary" : "text-default-400"}
                        size={20}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{automation.name}</p>
                      <p className="text-xs text-default-400 mt-0.5">
                        {automation.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    defaultSelected={automation.isActive}
                    size="sm"
                  />
                </CardHeader>
                <CardBody className="pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Chip size="sm" variant="flat">
                        <span className="flex items-center gap-1">
                          <Zap size={10} />
                          {triggerLabels[automation.trigger]}
                        </span>
                      </Chip>
                      <Chip color="secondary" size="sm" variant="flat">
                        {automation.actions.length} acción{automation.actions.length > 1 ? "es" : ""}
                      </Chip>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-default-400">
                      <span>{automation.executions} ejecuciones</span>
                      <span>{automation.lastExecuted}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
