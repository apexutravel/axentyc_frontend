"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Tabs, Tab } from "@heroui/tabs";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { motion } from "framer-motion";
import { Search, Plus, MoreVertical, Filter } from "lucide-react";

const leads = [
  { id: "1", title: "Plan Premium - Maria Garcia", contact: "Maria Garcia", status: "new", priority: "high", value: "$5,000", source: "WhatsApp", date: "Hoy" },
  { id: "2", title: "Enterprise License - Carlos Lopez", contact: "Carlos Lopez", status: "contacted", priority: "urgent", value: "$12,000", source: "Instagram", date: "Hoy" },
  { id: "3", title: "Starter Plan - Ana Martinez", contact: "Ana Martinez", status: "qualified", priority: "medium", value: "$800", source: "Facebook", date: "Ayer" },
  { id: "4", title: "Demo Request - Pedro Sanchez", contact: "Pedro Sanchez", status: "new", priority: "high", value: "$3,200", source: "WhatsApp", date: "Ayer" },
  { id: "5", title: "Bulk Pricing - Laura Torres", contact: "Laura Torres", status: "contacted", priority: "low", value: "$1,500", source: "TikTok", date: "Hace 2 dias" },
  { id: "6", title: "Agency Plan - Diego Rivera", contact: "Diego Rivera", status: "qualified", priority: "medium", value: "$8,000", source: "WhatsApp", date: "Hace 3 dias" },
];

const statusConfig: Record<string, { label: string; color: "primary" | "warning" | "success" | "danger" | "default" }> = {
  new: { label: "Nuevo", color: "primary" },
  contacted: { label: "Contactado", color: "warning" },
  qualified: { label: "Calificado", color: "success" },
  unqualified: { label: "No Calificado", color: "default" },
  converted: { label: "Convertido", color: "success" },
  lost: { label: "Perdido", color: "danger" },
};

const priorityConfig: Record<string, { label: string; color: "danger" | "warning" | "primary" | "default" }> = {
  urgent: { label: "Urgente", color: "danger" },
  high: { label: "Alta", color: "warning" },
  medium: { label: "Media", color: "primary" },
  low: { label: "Baja", color: "default" },
};

export default function LeadsPage() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-default-500 text-sm mt-1">
            Gestiona y convierte tus leads en oportunidades de negocio.
          </p>
        </div>
        <Button color="primary" startContent={<Plus size={16} />}>
          Nuevo Lead
        </Button>
      </div>

      <Card className="border border-divider">
        <CardHeader className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Input
              className="max-w-sm"
              placeholder="Buscar leads..."
              size="sm"
              startContent={<Search className="text-default-400" size={14} />}
            />
            <Button size="sm" startContent={<Filter size={14} />} variant="flat">
              Filtros
            </Button>
          </div>
          <Tabs size="sm" variant="light">
            <Tab key="all" title="Todos" />
            <Tab key="new" title="Nuevos" />
            <Tab key="contacted" title="Contactados" />
            <Tab key="qualified" title="Calificados" />
          </Tabs>
        </CardHeader>
        <CardBody className="p-0">
          <Table
            aria-label="Leads table"
            removeWrapper
            selectionMode="multiple"
          >
            <TableHeader>
              <TableColumn>LEAD</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn>PRIORIDAD</TableColumn>
              <TableColumn>VALOR</TableColumn>
              <TableColumn>FECHA</TableColumn>
              <TableColumn width={50}>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{lead.title}</p>
                      <p className="text-xs text-default-400">{lead.contact}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={statusConfig[lead.status]?.color}
                      size="sm"
                      variant="flat"
                    >
                      {statusConfig[lead.status]?.label}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={priorityConfig[lead.priority]?.color}
                      size="sm"
                      variant="dot"
                    >
                      {priorityConfig[lead.priority]?.label}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold">{lead.value}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-default-500">{lead.date}</span>
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          <MoreVertical size={14} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Lead actions">
                        <DropdownItem key="view">Ver detalle</DropdownItem>
                        <DropdownItem key="edit">Editar</DropdownItem>
                        <DropdownItem key="convert">Convertir a Deal</DropdownItem>
                        <DropdownItem key="delete" className="text-danger" color="danger">
                          Eliminar
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </motion.div>
  );
}
