"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckSquare, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { API_URL } from "@/config/api";
import { errorMessage, Task, unwrap } from "@/lib/crm";
import TaskForm from "@/components/crm/TaskForm";
import TaskRow from "@/components/crm/TaskRow";

type View = "mine" | "open" | "overdue" | "done";

const queryFor = (view: View) =>
  ({ mine: "status=open&mine=true", open: "status=open", overdue: "overdue=true", done: "status=done" })[view];

export default function TasksPage() {
  const [view, setView] = useState<View>("mine");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(unwrap<Task[]>(await api.get(`${API_URL}/tasks?${queryFor(view)}`)) || []);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudieron cargar las tareas"));
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (t: Task) => {
    const status = t.status === "done" ? "open" : "done";
    setTasks((prev) => prev.filter((x) => x._id !== t._id));
    try {
      await api.patch(`${API_URL}/tasks/${t._id}`, { status });
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo actualizar la tarea"));
      load();
    }
  };

  const remove = async (t: Task) => {
    if (!window.confirm(`¿Eliminar "${t.title}"?`)) return;
    try {
      await api.delete(`${API_URL}/tasks/${t._id}`);
      setTasks((prev) => prev.filter((x) => x._id !== t._id));
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo eliminar"));
    }
  };

  const counts = useMemo(() => ({ total: tasks.length }), [tasks]);

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-6" initial={{ opacity: 0, y: 20 }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tareas</h1>
          <p className="mt-1 text-sm text-default-500">Seguimientos, llamadas y pendientes de tus clientes. Te avisamos cuando una está por vencer.</p>
        </div>
        <Button color="primary" startContent={<Plus size={16} />} onPress={() => setCreating(true)}>Nueva tarea</Button>
      </div>

      <Tabs radius="full" selectedKey={view} variant="light" onSelectionChange={(k) => setView(k as View)}>
        <Tab key="mine" title="Mis tareas" />
        <Tab key="open" title="Todas abiertas" />
        <Tab key="overdue" title="Vencidas" />
        <Tab key="done" title="Completadas" />
      </Tabs>

      <Card className="border border-divider">
        <CardBody className="divide-y divide-divider p-0">
          {loading ? (
            <div className="flex h-32 items-center justify-center"><Spinner /></div>
          ) : counts.total === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center text-default-500">
              <CheckSquare size={28} className="opacity-50" />
              <p className="text-sm">{view === "overdue" ? "No tienes tareas vencidas. ¡Bien!" : view === "done" ? "Aún no has completado tareas." : "No hay tareas por ahora."}</p>
              <p className="text-xs">Tip: las automatizaciones pueden crearlas solas. <NextLink className="text-primary underline" href="/automations">Configurar</NextLink></p>
            </div>
          ) : (
            tasks.map((t) => <TaskRow key={t._id} task={t} onRemove={remove} onToggle={toggle} />)
          )}
        </CardBody>
      </Card>

      <TaskForm isOpen={creating} onClose={() => setCreating(false)} onSaved={load} />
    </motion.div>
  );
}
