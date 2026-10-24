"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/popover";
import { Zap } from "lucide-react";
import { api } from "@/lib/api";
import { API_URL } from "@/config/api";
import { unwrap } from "@/lib/crm";
import { useWorkspaces } from "@/contexts/WorkspaceContext";

export interface QuickReply {
  _id: string;
  shortcut: string;
  body: string;
}

export function useQuickReplies() {
  const { activeWorkspaceId } = useWorkspaces();
  const [replies, setReplies] = useState<QuickReply[]>([]);

  const load = useCallback(async () => {
    try {
      setReplies(unwrap<QuickReply[]>(await api.get(`${API_URL}/quick-replies`)) || []);
    } catch {
      setReplies([]);
    }
  }, []);

  useEffect(() => {
    if (activeWorkspaceId) load();
  }, [activeWorkspaceId, load]);

  /** "/hola" -> the reply body when the whole input is exactly a known shortcut. */
  const expand = useCallback(
    (input: string): string | null => {
      const m = /^\/([a-z0-9_-]{1,30})$/.exec(input.trim());
      return m ? replies.find((r) => r.shortcut === m[1])?.body ?? null : null;
    },
    [replies],
  );

  return { replies, expand, reload: load };
}

export default function QuickReplyButton({ replies, onPick }: { replies: QuickReply[]; onPick: (body: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover isOpen={open} placement="top-start" onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button isIconOnly aria-label="Respuestas rápidas" radius="full" size="sm" variant="flat"><Zap size={16} /></Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 items-stretch p-2">
        {replies.length === 0 ? (
          <p className="p-3 text-xs text-default-500">Aún no tienes respuestas rápidas. Créalas en Configuración → Respuestas rápidas y úsalas escribiendo <code>/atajo</code> + Enter.</p>
        ) : (
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {replies.map((r) => (
              <li key={r._id}>
                <button className="w-full rounded-lg p-2 text-left hover:bg-default-100" type="button" onClick={() => { onPick(r.body); setOpen(false); }}>
                  <p className="text-xs font-bold text-primary">/{r.shortcut}</p>
                  <p className="line-clamp-2 text-xs text-default-600">{r.body}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
