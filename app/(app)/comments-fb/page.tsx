
'use client';

import { useMemo, useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, Send, MoreHorizontal } from 'lucide-react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Tabs, Tab } from '@heroui/tabs';
import { Avatar } from '@heroui/avatar';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown';
import { Popover, PopoverTrigger, PopoverContent } from '@heroui/popover';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Comment {
  id: string;
  from: { id: string; name: string };
  message: string;
  created_time: string;
  parent?: { id: string };
}

interface Post {
  id: string;
  message?: string;
  full_picture?: string;
  created_time: string;
  from?: { id: string; name: string };
  comments?: { data: Comment[] };
}

interface FacebookPage {
  pageId: string;
  accountName: string;
}

export default function FacebookCommentsPage() {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [emojiOpenFor, setEmojiOpenFor] = useState<string | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [postReplyText, setPostReplyText] = useState('');
  const [openThreads, setOpenThreads] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    if (selectedPage) fetchPosts();
  }, [selectedPage]);

  const fetchPages = async () => {
    try {
      const data = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/integrations/facebook/status`);
      const fbPages = data.data?.accounts?.filter((a: any) => a.platform === 'facebook' && a.status === 'connected') || [];
      setPages(fbPages);
      if (fbPages.length > 0) setSelectedPage(fbPages[0].pageId);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar páginas');
    }
  };

  // Build threaded view
  const { roots, childrenMap } = useMemo(() => {
    const all = (selectedPost?.comments?.data || []) as Comment[];
    const map: Record<string, Comment[]> = {};
    const roots: Comment[] = [];
    for (const c of all) {
      const parentId = (c as any)?.parent?.id;
      if (parentId) {
        if (!map[parentId]) map[parentId] = [];
        map[parentId].push(c);
      } else {
        roots.push(c);
      }
    }
    return { roots, childrenMap: map };
  }, [selectedPost]);

  const sendPostComment = async () => {
    if (!selectedPost || !postReplyText.trim()) return;
    setSending(true);
    try {
      const response = await api.post(`${process.env.NEXT_PUBLIC_API_URL}/integrations/facebook/reply-comment`, {
        commentId: selectedPost.id, // Graph API allows commenting on a post via /{postId}/comments
        message: postReplyText,
        pageId: selectedPage,
        postId: selectedPost.id,
      });
      if (response.success) {
        const pageName = pages.find(p => p.pageId === selectedPage)?.accountName || 'Página';
        const newComment: Comment = {
          id: response.commentId || `temp-${Date.now()}`,
          from: { id: selectedPage, name: pageName },
          message: postReplyText,
          created_time: new Date().toISOString(),
        };
        const updated = posts.map(p => p.id === selectedPost.id
          ? { ...p, comments: { data: [...(p.comments?.data || []), newComment] } }
          : p);
        setPosts(updated);
        setPostReplyText('');
        toast.success('Comentario publicado');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al comentar');
    } finally {
      setSending(false);
    }
  };

  const fetchPosts = async () => {
    if (!selectedPage) return;
    setLoading(true);
    try {
      const data = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/integrations/facebook/feed?pageId=${selectedPage}&limit=20`);
      setPosts(data.data?.posts || []);
      if (data.data?.posts?.length > 0 && !selectedPost) {
        setSelectedPost(data.data.posts[0]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar publicaciones');
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    
    setSending(true);
    console.log('Enviando respuesta:', { commentId, message: replyText });
    
    try {
      const response = await api.post(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/facebook/reply-comment`,
        { commentId, message: replyText, pageId: selectedPage, postId: selectedPost?.id }
      );
      
      console.log('Respuesta del servidor:', response);
      
      if (response.success) {
        toast.success('Respuesta enviada');
        const pageName = pages.find(p => p.pageId === selectedPage)?.accountName || 'Página';
        // Optimistic append
        if (selectedPost) {
          const newComment: Comment = {
            id: response.commentId || `temp-${Date.now()}`,
            from: { id: selectedPage, name: pageName },
            message: replyText,
            created_time: new Date().toISOString(),
            parent: { id: commentId },
          };
          const updated = posts.map(p => p.id === selectedPost.id
            ? { ...p, comments: { data: [...(p.comments?.data || []), newComment] } }
            : p);
          setPosts(updated);
        }
        setReplyText('');
        setReplyingTo(null);
      }
    } catch (error: any) {
      console.error('Error completo:', error);
      toast.error(error.message || 'Error al enviar');
    } finally {
      setSending(false);
    }
  };

  const hideComment = async (commentId: string, hide: boolean) => {
    try {
      await api.post(`${process.env.NEXT_PUBLIC_API_URL}/integrations/facebook/hide-comment`, {
        commentId,
        pageId: selectedPage,
        hide,
      });
      // Optimistic: do nothing visually for now or mark hidden
      toast.success(hide ? 'Comentario ocultado' : 'Comentario visible');
    } catch (e: any) {
      toast.error(e.message || 'No se pudo actualizar visibilidad');
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await api.post(`${process.env.NEXT_PUBLIC_API_URL}/integrations/facebook/delete-comment`, {
        commentId,
        pageId: selectedPage,
      });
      if (selectedPost) {
        const updated = posts.map(p => p.id === selectedPost.id
          ? { ...p, comments: { data: (p.comments?.data || []).filter(c => c.id !== commentId) } }
          : p);
        setPosts(updated);
      }
      toast.success('Comentario eliminado');
    } catch (e: any) {
      toast.error(e.message || 'No se pudo eliminar');
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="h-screen flex flex-col bg-content1">
      {/* Top: Title + Integrations Tabs */}
      <div className="border-b px-4 py-3 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-semibold">Comentarios de Facebook</h1>
          </div>
          <div className="flex items-center gap-2">
            <Input
              labelPlacement="outside"
              placeholder="Buscar publicación..."
              classNames={{ inputWrapper: 'h-9' }}
            />
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              {pages.map(p => (
                <option key={p.pageId} value={p.pageId}>{p.accountName}</option>
              ))}
            </select>
            <Button size="sm" color="primary" startContent={<RefreshCw className="w-4 h-4" />} onPress={fetchPosts}>
              Actualizar
            </Button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-3">
          <Tabs aria-label="Integraciones" variant="underlined" color="primary" classNames={{ tabList: 'gap-6' }} selectedKey="fb-comments">
            <Tab key="inbox" title={<span className="text-sm">Todos los mensajes</span>} href="/inbox" />
            <Tab key="messenger" title={<span className="text-sm opacity-50">Messenger</span>} isDisabled />
            <Tab key="instagram" title={<span className="text-sm opacity-50">Instagram</span>} isDisabled />
            <Tab key="whatsapp" title={<span className="text-sm opacity-50">WhatsApp</span>} isDisabled />
            <Tab key="fb-comments" title={<span className="text-sm">Comentarios Facebook</span>} href="/comments-fb" />
            <Tab key="ig-comments" title={<span className="text-sm opacity-50">Comentarios Instagram</span>} isDisabled />
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Posts List */}
        <div className="w-80 border-r overflow-y-auto bg-white">
          <div className="p-3 border-b bg-content2">
            <h2 className="font-semibold text-sm">Publicaciones ({posts.length})</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-default-500">Cargando...</div>
          ) : (
            <div>
              {posts.map(post => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className={`w-full text-left p-3 border-b hover:bg-default-100 transition ${selectedPost?.id === post.id ? 'bg-primary-50 border-l-3 border-l-primary' : ''}`}
                >
                  <div className="flex gap-2 items-start">
                    {post.full_picture && (
                      <img src={post.full_picture} className="w-12 h-12 rounded object-cover flex-shrink-0" alt="" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2 text-foreground">{post.message || 'Sin texto'}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-default-500">
                        <span>{formatTime(post.created_time)}</span>
                        <span>·</span>
                        <span>{post.comments?.data?.length || 0} comentarios</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Post Detail */}
        <div className="flex-1 overflow-y-auto">
          {selectedPost ? (
            <div className="max-w-3xl mx-auto p-4">
              <Card shadow="sm" className="mb-4">
                <CardHeader className="flex gap-3 items-center">
                  <Avatar name={selectedPost.from?.name || 'P'} className="bg-primary text-white" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{selectedPost.from?.name || 'Página'}</span>
                    <span className="text-tiny text-default-500">{formatTime(selectedPost.created_time)}</span>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  {selectedPost.message && <p className="mb-3 text-foreground">{selectedPost.message}</p>}
                  {selectedPost.full_picture && (
                    <img src={selectedPost.full_picture} className="w-full rounded-lg max-h-[420px] object-cover" alt="" />
                  )}
                </CardBody>
              </Card>

              <Card shadow="sm">
                <CardHeader className="pb-0">
                  <h3 className="text-sm font-semibold">{selectedPost.comments?.data?.length || 0} Comentarios</h3>
                </CardHeader>
                <CardBody className="space-y-5">
                  {roots.map(comment => (
                    <div key={comment.id} className="flex gap-3 group">
                      <Avatar name={comment.from.name} className="bg-default-300 text-white" size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="bg-default-100 rounded-2xl px-3 py-2 inline-block">
                          <div className="font-semibold text-sm">{comment.from.name}</div>
                          <div className="text-sm whitespace-pre-wrap break-words">{comment.message}</div>
                        </div>
                        <div className="flex items-center gap-3 mt-1 px-1">
                          <Button
                            size="sm"
                            variant="light"
                            className="h-7 text-xs"
                            onPress={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText(''); }}
                          >Responder</Button>
                          <span className="text-xs text-default-500">{formatTime(comment.created_time)}</span>

                          <Dropdown isOpen={menuOpenFor === comment.id} onOpenChange={(open) => setMenuOpenFor(open ? comment.id : null)}>
                            <DropdownTrigger>
                              <Button isIconOnly size="sm" variant="light" className="opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4" /></Button>
                            </DropdownTrigger>
                            <DropdownMenu onAction={(key) => {
                              if (key === 'hide') hideComment(comment.id, true);
                              if (key === 'delete') deleteComment(comment.id);
                            }}>
                              <DropdownItem key="hide">Ocultar</DropdownItem>
                              <DropdownItem key="delete" className="text-danger" color="danger">Eliminar</DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>

                        {/* Replies toggle */}
                        {childrenMap[comment.id]?.length ? (
                          <div className="mt-1 ml-1">
                            <Button size="sm" variant="light" className="h-7 text-xs" onPress={() => setOpenThreads(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}>
                              {openThreads[comment.id] ? 'Ocultar respuestas' : `Ver ${childrenMap[comment.id].length} respuesta(s)`}
                            </Button>
                          </div>
                        ) : null}

                        {/* Reply box */}
                        {replyingTo === comment.id && (
                          <div className="mt-2 flex items-center gap-2">
                            <Avatar name="P" className="bg-primary text-white" size="sm" />
                            <div className="flex-1 flex items-center gap-2 bg-default-100 rounded-full pl-3 pr-1 py-1">
                              <Input
                                aria-label="Escribe una respuesta"
                                variant="bordered"
                                classNames={{ inputWrapper: 'shadow-none border-none bg-transparent', input: 'text-sm' }}
                                value={replyText}
                                onValueChange={setReplyText}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(comment.id); } }}
                                placeholder="Escribe una respuesta..."
                              />
                              <Popover isOpen={emojiOpenFor === comment.id} onOpenChange={(open) => setEmojiOpenFor(open ? comment.id : null)} placement="top-end">
                                <PopoverTrigger>
                                  <Button size="sm" variant="light">😊</Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0">
                                  <EmojiPicker onEmojiClick={(em) => { setReplyText(prev => prev + (em.emoji || '')); setEmojiOpenFor(null); }} lazyLoadEmojis width={280} height={350} />
                                </PopoverContent>
                              </Popover>
                              <Button size="sm" color="primary" isDisabled={!replyText.trim() || sending} onPress={() => sendReply(comment.id)} startContent={<Send className="w-4 h-4" />}>Enviar</Button>
                            </div>
                          </div>
                        )}

                        {/* Thread replies */}
                        {openThreads[comment.id] && childrenMap[comment.id]?.length ? (
                          <div className="mt-2 space-y-3 ml-8">
                            {childrenMap[comment.id].map(rc => (
                              <div key={rc.id} className="flex gap-3">
                                <Avatar name={rc.from.name} className="bg-default-300 text-white" size="sm" />
                                <div className="bg-default-100 rounded-2xl px-3 py-2 inline-block">
                                  <div className="font-semibold text-sm">{rc.from.name}</div>
                                  <div className="text-sm whitespace-pre-wrap break-words">{rc.message}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </CardBody>

                {/* Post composer */}
                <div className="px-4 pb-4">
                  <div className="flex gap-2 items-center">
                    <Avatar name="P" className="bg-primary text-white" size="sm" />
                    <div className="flex-1 flex items-center gap-2 bg-default-100 rounded-full pl-3 pr-2 py-1">
                      <Input
                        aria-label="Escribe un comentario"
                        variant="bordered"
                        classNames={{ inputWrapper: 'shadow-none border-none bg-transparent', input: 'text-sm' }}
                        value={postReplyText}
                        onValueChange={setPostReplyText}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendPostComment(); } }}
                        placeholder={`Comentas como ${pages.find(p => p.pageId === selectedPage)?.accountName || 'tu página'}`}
                      />
                      <Button size="sm" variant="light">😊</Button>
                      <Button size="sm" color="primary" isDisabled={!postReplyText.trim() || sending} onPress={sendPostComment} startContent={<Send className="w-4 h-4" />}>Publicar</Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Selecciona una publicación</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
