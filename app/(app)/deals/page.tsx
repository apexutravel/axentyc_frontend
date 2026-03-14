"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { motion } from "framer-motion";
import { Plus, DollarSign, MoreHorizontal } from "lucide-react";

interface Deal {
  id: string;
  title: string;
  contact: string;
  value: string;
  probability: number;
}

const pipeline: { stage: string; color: string; deals: Deal[] }[] = [
  {
    stage: "Nuevo Lead",
    color: "bg-blue-500",
    deals: [
      { id: "1", title: "Plan Premium", contact: "Maria Garcia", value: "$5,000", probability: 20 },
      { id: "2", title: "Demo Request", contact: "Pedro Sanchez", value: "$3,200", probability: 10 },
      { id: "3", title: "Consulta Enterprise", contact: "Roberto Diaz", value: "$15,000", probability: 15 },
    ],
  },
  {
    stage: "Contactado",
    color: "bg-yellow-500",
    deals: [
      { id: "4", title: "Enterprise License", contact: "Carlos Lopez", value: "$12,000", probability: 40 },
      { id: "5", title: "Bulk Pricing", contact: "Laura Torres", value: "$1,500", probability: 35 },
    ],
  },
  {
    stage: "Propuesta",
    color: "bg-purple-500",
    deals: [
      { id: "6", title: "Agency Plan", contact: "Diego Rivera", value: "$8,000", probability: 60 },
      { id: "7", title: "White Label", contact: "Sofia Morales", value: "$20,000", probability: 55 },
    ],
  },
  {
    stage: "Negociaci\u00f3n",
    color: "bg-orange-500",
    deals: [
      { id: "8", title: "Multi-Sede", contact: "Fernando Ruiz", value: "$25,000", probability: 75 },
    ],
  },
  {
    stage: "Cerrado Ganado",
    color: "bg-green-500",
    deals: [
      { id: "9", title: "Starter Annual", contact: "Ana Martinez", value: "$800", probability: 100 },
      { id: "10", title: "Pro Monthly", contact: "Lucia Vega", value: "$2,400", probability: 100 },
    ],
  },
];

export default function DealsPage() {
  const totalValue = pipeline.reduce(
    (sum, col) => sum + col.deals.reduce((s, d) => s + parseFloat(d.value.replace(/[$,]/g, "")), 0),
    0,
  );

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline de Ventas</h1>
          <p className="text-default-500 text-sm mt-1">
            Gestiona tus deals con un pipeline visual tipo Kanban.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Chip
            color="success"
            size="lg"
            startContent={<DollarSign size={14} />}
            variant="flat"
          >
            Total: ${totalValue.toLocaleString()}
          </Chip>
          <Button color="primary" startContent={<Plus size={16} />}>
            Nuevo Deal
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
        {pipeline.map((column) => {
          const colTotal = column.deals.reduce(
            (sum, d) => sum + parseFloat(d.value.replace(/[$,]/g, "")),
            0,
          );

          return (
            <div
              key={column.stage}
              className="flex-shrink-0 w-72"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                <h3 className="text-sm font-semibold">{column.stage}</h3>
                <Chip size="sm" variant="flat">
                  {column.deals.length}
                </Chip>
                <span className="text-xs text-default-400 ml-auto">
                  ${colTotal.toLocaleString()}
                </span>
              </div>

              <div className="space-y-2">
                {column.deals.map((deal) => (
                  <motion.div
                    key={deal.id}
                    layout
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card className="border border-divider cursor-pointer hover:border-primary/50 transition-colors">
                      <CardBody className="gap-3 p-3">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium">{deal.title}</p>
                          <Button isIconOnly size="sm" variant="light">
                            <MoreHorizontal size={14} />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={deal.contact.split(" ").map((n) => n[0]).join("")}
                            size="sm"
                          />
                          <span className="text-xs text-default-500">
                            {deal.contact}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-success">
                            {deal.value}
                          </span>
                          <Chip size="sm" variant="flat">
                            {deal.probability}%
                          </Chip>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                ))}

                <Button
                  className="w-full border-dashed"
                  size="sm"
                  startContent={<Plus size={14} />}
                  variant="bordered"
                >
                  Agregar deal
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
