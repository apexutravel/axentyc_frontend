"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { Textarea } from "@heroui/input";
import { AlertTriangle, EyeOff, ExternalLink, Eye, Image as ImageIcon, Instagram, MessageCircle, RefreshCw, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { API_URL } from "@/config/api";
import { useSocket } from "@/hooks/useSocket";

interface IgAccount {
  accountId: string;
  accountName: string;
  webhookError?: string | null;
  lastWebhookAt?: string | null;
}

interface IgComment {
  id: string;
  from: { id: string; name: string; isOwn?: boolean };
  message: string;
  created_time: string;
  like_count?: number;
  hidden?: boolean;
  parent?: { id: string };
}

interface IgPost {
  id: string;
  message?: string;
  full_picture?: string;
  permalink_url?: string;
  created_time: string;
  media_type?: string;
  like_count?: number;
  comments_count?: number;
  comments: { data: IgComment[] };
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function InstagramComments() {
  const { subscribe } = useSocket();
  const [accounts, setAccounts] = useState<IgAccount[]>([]);
  const [accountId, setAccountId] = useState("");
  const [posts, setPosts] = useState<IgPost[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const selected = useMemo(() => posts.find((p) => p.id === selectedId) || null, [posts, selectedId]);
  const account = accounts.find((a) => a.accountId === accountId);

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const res: any = await api.get(`${API_URL}/integrations/facebook/status`);
      const raw = res?.data?.accounts ?? res?.accounts ?? [];
      const list: IgAccount[] = raw
        .filter((a: any) => a.platform === "instagram" && a.status === "connected" && a.accountId)
        .map((a: any) => ({ accountId: a.accountId, accountName: a.accountName, webhookError: a.metadata?.webhookError, lastWebhookAt: a.metadata?.lastWebhookAt }));
      setAccounts(list);
      setAccountId((current) => current || list[0]?.accountId || "");
    } catch {
      toast.error("No se pudieron cargar las cuentas de Instagram");
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    if (!accountId) return;
    setLoadingPosts(true);
    setError(null);
    try {
      const res: any = await api.get(`${API_URL}/integrations/instagram/feed?accountId=${accountId}&limit=20`);
      const list: IgPost[] = res?.data?.posts ?? res?.posts ?? [];
      setPosts(list);
      setSelectedId((current) => (list.some((p) => p.id === current) ? current : list[0]?.id ?? null));
    } catch (e: any) {
      setPosts([]);
      setError(e?.message || "No se pudieron cargar las publicaciones");
    } finally {
      setLoadingPosts(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // A comment arrived through the webhook: refresh the open account
  useEffect(() => {
    return subscribe("ig.comment.new", (data: any) => {
      if (!data?.accountId || data.accountId === accountId) loadPosts();
    });
  }, [subscribe, accountId, loadPosts]);

  const { roots, children } = useMemo(() => {
    const all = selected?.comments.data || [];
    const map: Record<string, IgComment[]> = {};
    const top: IgComment[] = [];
    for (const c of all) {
      if (c.parent?.id) (map[c.parent.id] ||= []).push(c);
      else top.push(c);
    }
    top.sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime());
    for (const key of Object.keys(map)) map[key].sort((a, b) => new Date(a.created_time).getTime() - new Date(b.created_time).getTime());
    return { roots: top, children: map };
  }, [selected]);

  const send = async () => {
    const message = text.trim();
    if (!message || !selected || !accountId) return;
    setSending(true);
    try {
      await api.post(`${API_URL}/integrations/instagram/reply-comment`, {
        accountId,
        message,
        ...(replyTo ? { commentId: replyTo } : { mediaId: selected.id }),
      });
      setText("");
      setReplyTo(null);
      toast.success(replyTo ? "Respuesta enviada" : "Comentario publicado");
      await loadPosts();
    } catch (e: any) {
      toast.error(e?.message || "No se pudo enviar el comentario");
    } finally {
      setSending(false);
    }
  };

  const toggleHidden = async (comment: IgComment) => {
    try {
      await api.post(`${API_URL}/integrations/instagram/hide-comment`, { accountId, commentId: comment.id, hide: !comment.hidden });
      await loadPosts();
    } catch (e: any) {
      toast.error(e?.message || "No se pudo cambiar la visibilidad");
    }
  };

  const remove = async (comment: IgComment) => {
    if (!window.confirm("¿Eliminar este comentario de Instagram? Esta acción no se puede deshacer.")) return;
    try {
      await api.post(`${API_URL}/integrations/instagram/delete-comment`, { accountId, commentId: comment.id });
      toast.success("Comentario eliminado");
      await loadPosts();
    } catch (e: any) {
      toast.error(e?.message || "No se pudo eliminar el comentario");
    }
  };

  const renderComment = (comment: IgComment, nested = false) => (
    <div key={comment.id} className={`${nested ? "ml-10 mt-2" : "mt-4"}`}>
      <div className="flex gap-2.5">
        <Avatar className="shrink-0" name={comment.from.name.replace("@", "").slice(0, 2).toUpperCase()} size="sm" />
        <div className="min-w-0 flex-1">
          <div className={`inline-block max-w-full rounded-2xl px-3 py-2 ${comment.hidden ? "bg-default-100 opacity-60" : "bg-default-100"}`}>
            <p className="text-xs font-semibold">
              {comment.from.name}
              {comment.from.isOwn && <span className="ml-1 text-primary">· Tu cuenta</span>}
            </p>
            <p className="whitespace-pre-wrap break-words text-sm">{comment.message}</p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 px-1 text-[11px] text-default-500">
            <span>{formatDate(comment.created_time)}</span>
            {!!comment.like_count && <span>{comment.like_count} me gusta</span>}
            {comment.hidden && <span className="font-medium text-warning">Oculto</span>}
            {!nested && (
              <button className="font-semibold hover:text-primary" type="button" onClick={() => { setReplyTo(comment.id); setText(`${comment.from.name} `); }}>
                Responder
              </button>
            )}
            <button className="inline-flex items-center gap-1 hover:text-primary" type="button" onClick={() => toggleHidden(comment)}>
              {comment.hidden ? <Eye size={11} /> : <EyeOff size={11} />}
              {comment.hidden ? "Mostrar" : "Ocultar"}
            </button>
            <button className="inline-flex items-center gap-1 hover:text-danger" type="button" onClick={() => remove(comment)}>
              <Trash2 size={11} /> Eliminar
            </button>
          </div>
        </div>
      </div>
      {(children[comment.id] || []).map((reply) => renderComment(reply, true))}
    </div>
  );

  const empty = (title: string, hint: string) => (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-secondary/10 bg-secondary/10">
        <Instagram className="text-secondary" size={34} />
      </div>
      <h3 className="mb-1 text-lg font-bold">{title}</h3>
      <p className="max-w-md text-sm text-default-500">{hint}</p>
    </div>
  );

  if (loadingAccounts) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-3xl border border-divider/70 bg-content1/95">
        <Spinner size="sm" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-1 rounded-3xl border border-divider/70 bg-content1/95">
        {empty(
          "No hay una cuenta de Instagram conectada",
          "Conecta tu página de Facebook en Integraciones. Instagram debe ser una cuenta Business o Creator vinculada a esa página.",
        )}
      </div>
    );
  }

  return (
    <>
      {/* Posts */}
      <div className={`${selected ? "hidden md:flex" : "flex"} min-h-0 w-full flex-col overflow-hidden rounded-3xl border border-divider/70 bg-content1/95 shadow-sm md:w-[360px] md:rounded-l-3xl md:rounded-r-none`}>
        <div className="shrink-0 space-y-3 border-b border-divider/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold">Publicaciones ({posts.length})</h2>
              <p className="text-xs text-default-500">Selecciona una publicación para ver sus comentarios</p>
            </div>
            <Button isIconOnly isLoading={loadingPosts} size="sm" variant="flat" onPress={loadPosts}>
              <RefreshCw size={15} />
            </Button>
          </div>
          {accounts.length > 1 && (
            <Select
              aria-label="Cuenta de Instagram"
              selectedKeys={accountId ? [accountId] : []}
              size="sm"
              startContent={<Instagram className="text-secondary" size={14} />}
              onChange={(e) => e.target.value && setAccountId(e.target.value)}
            >
              {accounts.map((a) => <SelectItem key={a.accountId}>{`@${a.accountName}`}</SelectItem>)}
            </Select>
          )}
          {account && !account.webhookError && (
            <p className="flex items-center gap-1.5 text-[11px] text-default-500">
              <span className={`h-2 w-2 shrink-0 rounded-full ${account.lastWebhookAt ? "bg-success" : "bg-warning"}`} />
              {account.lastWebhookAt
                ? `Meta envía eventos en vivo · último ${formatDate(account.lastWebhookAt)}`
                : "Meta aún no ha enviado eventos en vivo. Se revisa Instagram cada minuto, así que no pierdes mensajes, pero llegan con hasta 1 min de retraso."}
            </p>
          )}
          {account?.webhookError && (
            <div className="flex gap-2 rounded-xl border border-warning/30 bg-warning/10 p-2.5 text-[11px] text-warning-700 dark:text-warning">
              <AlertTriangle className="mt-0.5 shrink-0" size={13} />
              <span>
                Los comentarios nuevos pueden no llegar en tiempo real: Meta rechazó la suscripción ({account.webhookError}). Aun así puedes verlos aquí con Actualizar. Vuelve a conectar la página para reintentar.
              </span>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loadingPosts && posts.length === 0 ? (
            <div className="flex justify-center py-12"><Spinner size="sm" /></div>
          ) : error ? (
            <div className="px-4 py-10 text-center">
              <AlertTriangle className="mx-auto mb-2 text-danger" size={26} />
              <p className="text-sm font-medium">No se pudieron cargar las publicaciones</p>
              <p className="mt-1 break-words text-xs text-default-500">{error}</p>
              <p className="mt-2 text-xs text-default-400">Si el permiso instagram_manage_comments no está aprobado o el token venció, desconecta y vuelve a conectar la página.</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Instagram className="mx-auto mb-3 text-default-300" size={38} />
              <p className="text-sm text-default-500">Esta cuenta aún no tiene publicaciones</p>
            </div>
          ) : (
            posts.map((post) => (
              <button
                key={post.id}
                className={`flex w-full gap-3 border-b border-l-4 border-divider/70 px-3 py-3 text-left transition-colors ${selectedId === post.id ? "border-l-secondary bg-secondary/10" : "border-l-transparent hover:bg-default-100/70"}`}
                type="button"
                onClick={() => setSelectedId(post.id)}
              >
                {post.full_picture ? (
                  <img alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-divider" src={post.full_picture} />
                ) : (
                  <Avatar className="shrink-0 rounded-lg bg-default-200" icon={<ImageIcon size={18} />} radius="sm" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-semibold">{post.message || "Publicación sin texto"}</p>
                  <p className="mt-1 text-[10px] text-default-400">{formatDate(post.created_time)}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-default-500">
                    <MessageCircle size={11} /> {post.comments_count ?? post.comments.data.length}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Comments */}
      <div className={`${selected ? "flex" : "hidden md:flex"} min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-divider/70 bg-content1/95 shadow-sm md:rounded-none md:border-l-0`}>
        {selected ? (
          <>
            <button className="flex shrink-0 items-center gap-1 border-b border-divider/70 px-4 py-2 text-sm font-medium text-primary md:hidden" type="button" onClick={() => setSelectedId(null)}>
              ← Volver a la lista
            </button>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="flex gap-4">
                {selected.full_picture && <img alt="" className="h-28 w-28 shrink-0 rounded-xl object-cover" src={selected.full_picture} />}
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <Chip color="secondary" size="sm" startContent={<Instagram size={11} />} variant="flat">@{account?.accountName}</Chip>
                    <span className="text-xs text-default-400">{formatDate(selected.created_time)}</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm">{selected.message || "Publicación sin texto"}</p>
                  {selected.permalink_url && (
                    <a className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline" href={selected.permalink_url} rel="noreferrer" target="_blank">
                      Ver en Instagram <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-5 border-t border-divider/70 pt-3">
                <h3 className="text-sm font-semibold">{selected.comments.data.length} comentarios</h3>
                {roots.length === 0 ? <p className="mt-4 text-sm text-default-500">Todavía no hay comentarios en esta publicación.</p> : roots.map((c) => renderComment(c))}
              </div>
            </div>
            <div className="shrink-0 border-t border-divider/70 p-3">
              {replyTo && (
                <div className="mb-2 flex items-center justify-between rounded-lg bg-default-100 px-3 py-1.5 text-xs">
                  <span>Respondiendo a un comentario</span>
                  <button className="text-primary" type="button" onClick={() => { setReplyTo(null); setText(""); }}>Cancelar</button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <Textarea
                  aria-label="Escribir comentario"
                  maxRows={4}
                  minRows={1}
                  placeholder={replyTo ? "Escribe tu respuesta..." : "Comentar en esta publicación..."}
                  value={text}
                  onValueChange={setText}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />
                <Button color="primary" isDisabled={!text.trim()} isIconOnly isLoading={sending} onPress={send}>
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          empty("Comentarios de Instagram", "Selecciona una publicación para ver y responder sus comentarios.")
        )}
      </div>
    </>
  );
}
