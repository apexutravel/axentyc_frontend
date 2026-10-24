"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { toast } from "sonner";
import { Briefcase, CheckSquare, CreditCard, FileText, MessageSquare, Pin, Plus, Receipt, StickyNote, Target, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { API_URL } from "@/config/api";
import { errorMessage, fmtDate, Note, Task, TimelineItem, unwrap } from "@/lib/crm";
import TaskForm from "./TaskForm";
import TaskRow from "./TaskRow";

const ICONS: Record<TimelineItem["type"], any> = {
  note: StickyNote,
  task: CheckSquare,
  conversation: MessageSquare,
  lead: Target,
  deal: Briefcase,
  quote: FileText,
  invoice: Receipt,
  payment: CreditCard,
};

/** Notes, tasks and the unified history of one contact. Reused in the contact view and in the chat sidebar. */
export default function ActivityPanel({ contactId, compact = false }: { contactId: string; compact?: boolean }) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tl, n, t] = await Promise.all([
        api.get(`${API_URL}/activities/timeline?contactId=${contactId}`),
        api.get(`${API_URL}/notes?contactId=${contactId}`),
        api.get(`${API_URL}/tasks?contactId=${contactId}&status=open`),
      ]);
      setTimeline(unwrap(tl) || []);
      setNotes(unwrap(n) || []);
      setTasks(unwrap(t) || []);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo cargar la actividad"));
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    load();
  }, [load]);

  const addNote = async () => {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await api.post(`${API_URL}/notes`, { body: body.trim(), contactId });
      setBody("");
      await load();
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo guardar la nota"));
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async (n: Note) => {
    try {
      await api.patch(`${API_URL}/notes/${n._id}`, { pinned: !n.pinned });
      await load();
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo fijar la nota"));
    }
  };

  const removeNote = async (n: Note) => {
    if (!window.confirm("¿Eliminar esta nota?")) return;
    try {
      await api.delete(`${API_URL}/notes/${n._id}`);
      await load();
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo eliminar"));
    }
  };

  const completeTask = async (t: Task) => {
    try {
      await api.patch(`${API_URL}/tasks/${t._id}`, { status: "done" });
      await load();
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo completar"));
    }
  };

  const removeTask = async (t: Task) => {
    try {
      await api.delete(`${API_URL}/tasks/${t._id}`);
      await load();
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo eliminar"));
    }
  };

  if (loading) return <div className="flex h-24 items-center justify-center"><Spinner size="sm" /></div>;

  return (
    <div className={compact ? "text-sm" : ""}>
      <Tabs fullWidth size="sm" variant="underlined">
        <Tab key="timeline" title="Historial">
          {timeline.length === 0 ? (
            <p className="py-6 text-center text-xs text-default-500">Todavía no hay actividad con este contacto.</p>
          ) : (
            <ol className="mt-2 space-y-3 border-l border-divider pl-4">
              {timeline.map((item, i) => {
                const Icon = ICONS[item.type] || StickyNote;
                return (
                  <li key={`${item.type}-${item.refId}-${i}`} className="relative">
                    <span className="absolute -left-[25px] flex h-5 w-5 items-center justify-center rounded-full bg-content2 text-default-500"><Icon size={11} /></span>
                    <p className="text-xs font-semibold">{item.title}</p>
                    {item.detail && <p className="line-clamp-2 text-xs text-default-500">{item.detail}</p>}
                    <p className="text-[11px] text-default-400">{fmtDate(item.at, true)}</p>
                  </li>
                );
              })}
            </ol>
          )}
        </Tab>

        <Tab key="notes" title={`Notas (${notes.length})`}>
          <div className="mt-2 space-y-2">
            <Textarea minRows={2} placeholder="Escribe una nota interna sobre este cliente…" value={body} variant="bordered" onValueChange={setBody} />
            <Button color="primary" isDisabled={!body.trim()} isLoading={saving} size="sm" startContent={<Plus size={14} />} onPress={addNote}>Agregar nota</Button>
            <ul className="space-y-2 pt-2">
              {notes.map((n) => (
                <li key={n._id} className="rounded-xl border border-divider bg-content2/40 p-3">
                  <p className="whitespace-pre-wrap text-xs">{n.body}</p>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-default-400">
                    <span>{`${n.authorId?.firstName || ""} ${n.authorId?.lastName || ""}`.trim() || "Equipo"} · {fmtDate(n.createdAt, true)}</span>
                    <span className="flex gap-1">
                      <Button isIconOnly size="sm" variant="light" onPress={() => togglePin(n)}><Pin className={n.pinned ? "fill-warning text-warning" : ""} size={13} /></Button>
                      <Button isIconOnly color="danger" size="sm" variant="light" onPress={() => removeNote(n)}><Trash2 size={13} /></Button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Tab>

        <Tab key="tasks" title={`Tareas (${tasks.length})`}>
          <div className="mt-2 space-y-2">
            <Button size="sm" startContent={<Plus size={14} />} variant="flat" onPress={() => setTaskOpen(true)}>Nueva tarea</Button>
            {tasks.length === 0 ? (
              <p className="py-4 text-center text-xs text-default-500">Sin tareas pendientes.</p>
            ) : (
              <div className="divide-y divide-divider rounded-xl border border-divider">
                {tasks.map((t) => <TaskRow key={t._id} task={t} onRemove={removeTask} onToggle={completeTask} />)}
              </div>
            )}
          </div>
        </Tab>
      </Tabs>
      <TaskForm isOpen={taskOpen} link={{ contactId }} onClose={() => setTaskOpen(false)} onSaved={load} />
    </div>
  );
}
