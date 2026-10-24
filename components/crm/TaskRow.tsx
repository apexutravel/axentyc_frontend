"use client";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Checkbox } from "@heroui/checkbox";
import { CalendarClock, Trash2, Zap } from "lucide-react";
import { fmtDate, Task } from "@/lib/crm";

const PRIORITY: Record<string, { label: string; color: "default" | "warning" | "danger" }> = {
  low: { label: "Baja", color: "default" },
  medium: { label: "Media", color: "warning" },
  high: { label: "Alta", color: "danger" },
};


export default function TaskRow({ task, onToggle, onRemove }: { task: Task; onToggle: (t: Task) => void; onRemove: (t: Task) => void }) {
  const done = task.status === "done";
  const overdue = !done && task.dueAt && new Date(task.dueAt).getTime() < Date.now();
  const contact = typeof task.contactId === "object" ? task.contactId : null;
  const assignee = typeof task.assignedTo === "object" ? task.assignedTo : null;
  return (
    <div className="flex items-start gap-3 p-3">
      <Checkbox aria-label="Completar" className="mt-0.5" isSelected={done} onValueChange={() => onToggle(task)} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${done ? "text-default-400 line-through" : ""}`}>{task.title}</p>
        {task.description && <p className="mt-0.5 line-clamp-2 text-xs text-default-500">{task.description}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
          {task.dueAt && (
            <span className={`inline-flex items-center gap-1 ${overdue ? "font-semibold text-danger" : "text-default-500"}`}>
              <CalendarClock size={12} /> {fmtDate(task.dueAt, true)}
            </span>
          )}
          <Chip color={PRIORITY[task.priority]?.color} size="sm" variant="flat">{PRIORITY[task.priority]?.label}</Chip>
          {contact && <Chip size="sm" variant="bordered">{contact.name}</Chip>}
          {assignee && <span className="text-default-400">{`${assignee.firstName || ""} ${assignee.lastName || ""}`.trim()}</span>}
          {task.source === "automation" && <Chip color="secondary" size="sm" startContent={<Zap size={10} />} variant="flat">Automática</Chip>}
        </div>
      </div>
      <Button isIconOnly color="danger" size="sm" variant="light" onPress={() => onRemove(task)}><Trash2 size={14} /></Button>
    </div>
  );
}

