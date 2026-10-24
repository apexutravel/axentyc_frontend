"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Pencil, Plus, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { API_URL } from "@/config/api";
import { errorMessage, unwrap } from "@/lib/crm";
import { useWorkspaces } from "@/contexts/WorkspaceContext";
import type { QuickReply } from "./QuickReplies";

export default function QuickRepliesManager() {
  const { activeWorkspace } = useWorkspaces();
  const [items, setItems] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<QuickReply | null>(null);
  const [shortcut, setShortcut] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(unwrap<QuickReply[]>(await api.get(`${API_URL}/quick-replies`)) || []);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudieron cargar las respuestas rápidas"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setEditing(null);
    setShortcut("");
    setBody("");
  };

  const save = async () => {
    if (!shortcut || !body.trim()) return toast.error("Completa el atajo y el mensaje");
    setSaving(true);
    try {
      if (editing) await api.put(`${API_URL}/quick-replies/${editing._id}`, { shortcut, body: body.trim() });
      else await api.post(`${API_URL}/quick-replies`, { shortcut, body: body.trim() });
      reset();
      await load();
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo guardar"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: QuickReply) => {
    try {
      await api.delete(`${API_URL}/quick-replies/${r._id}`);
      if (editing?._id === r._id) reset();
      await load();
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo eliminar"));
    }
  };

  return (
    <Card className="border border-divider">
      <CardBody className="gap-4 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10 text-warning"><Zap size={24} /></div>
          <div>
            <h2 className="text-xl font-bold">Respuestas rápidas</h2>
            <p className="text-sm text-default-500">Mensajes guardados de {activeWorkspace?.name || "tu empresa"}. En el chat escribe <code>/atajo</code> y Enter.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[180px_1fr_auto]">
          <Input label="Atajo" startContent={<span className="text-default-400">/</span>} value={shortcut} variant="bordered" onValueChange={(v) => setShortcut(v.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30))} />
          <Textarea label="Mensaje" maxLength={2000} minRows={1} value={body} variant="bordered" onValueChange={setBody} />
          <div className="flex items-start gap-2">
            <Button color="primary" isLoading={saving} startContent={!editing ? <Plus size={14} /> : undefined} onPress={save}>{editing ? "Guardar" : "Agregar"}</Button>
            {editing && <Button variant="light" onPress={reset}>Cancelar</Button>}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-4"><Spinner size="sm" /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-default-500">Aún no hay respuestas guardadas. Ejemplo: atajo <b>horario</b> → &quot;Atendemos de lunes a viernes de 9am a 6pm&quot;.</p>
        ) : (
          <ul className="divide-y divide-divider rounded-xl border border-divider">
            {items.map((r) => (
              <li key={r._id} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-primary">/{r.shortcut}</p>
                  <p className="whitespace-pre-wrap text-sm text-default-600">{r.body}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button isIconOnly size="sm" variant="light" onPress={() => { setEditing(r); setShortcut(r.shortcut); setBody(r.body); }}><Pencil size={14} /></Button>
                  <Button isIconOnly color="danger" size="sm" variant="light" onPress={() => remove(r)}><Trash2 size={14} /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
