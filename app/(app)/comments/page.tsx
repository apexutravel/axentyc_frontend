'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, Image as ImageIcon, User, Calendar, ExternalLink, Plus, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Comment {
  id: string;
  from: {
    id: string;
    name: string;
  };
  message: string;
  created_time: string;
}

interface Post {
  id: string;
  message?: string;
  full_picture?: string;
  permalink_url?: string;
  created_time: string;
  from?: {
    id: string;
    name: string;
  };
  comments?: {
    data: Comment[];
  };
}

interface FacebookPage {
  pageId: string;
  accountName: string;
  platform: string;
}

export default function CommentsPage() {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      fetchPosts();
    }
  }, [selectedPage]);

  const fetchPages = async () => {
    try {
      const data = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/integrations/facebook/status`);
      if (data.data?.accounts) {
        const fbPages = data.data.accounts.filter((acc: any) => acc.platform === 'facebook' && acc.status === 'connected');
        setPages(fbPages);
        if (fbPages.length > 0) {
          setSelectedPage(fbPages[0].pageId);
        }
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast.error('Error al cargar páginas');
    }
  };

  const fetchPosts = async () => {
    if (!selectedPage) return;
    
    setLoading(true);
    try {
      const data = await api.get(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/facebook/feed?pageId=${selectedPage}&limit=20`
      );
      if (data.data?.posts) {
        setPosts(data.data.posts);
        if (data.data.posts.length > 0 && !selectedPost) {
          setSelectedPost(data.data.posts[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Error al cargar publicaciones');
    } finally {
      setLoading(false);
    }
  };

  const syncComments = async () => {
    if (!selectedPage) return;
    
    setSyncing(true);
    try {
      const data = await api.post(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/facebook/sync-comments`,
        { pageId: selectedPage }
      );
      if (data.data?.success) {
        const added = data.data.results[0]?.commentsAdded || 0;
        toast.success(`${added} comentarios sincronizados`);
        fetchPosts();
      }
    } catch (error) {
      console.error('Error syncing comments:', error);
      toast.error('Error al sincronizar comentarios');
    } finally {
      setSyncing(false);
    }
  };

  const createDeal = (comment: Comment) => {
    // TODO: Implementar creación de deal
    toast.success(`Deal creado para ${comment.from.name}`);
  };

  const createLead = (comment: Comment) => {
    // TODO: Implementar creación de lead
    toast.success(`Lead creado para ${comment.from.name}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Comentarios de Facebook</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Page Selector */}
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {pages.map((page) => (
                <option key={page.pageId} value={page.pageId}>
                  {page.accountName}
                </option>
              ))}
            </select>
            
            {/* Sync Button */}
            <button
              onClick={syncComments}
              disabled={syncing || !selectedPage}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Posts List */}
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Publicaciones Recientes</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay publicaciones</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPost?.id === post.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex gap-3">
                      {post.full_picture && (
                        <img
                          src={post.full_picture}
                          alt="Post"
                          className="w-16 h-16 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 line-clamp-2 mb-2">
                          {post.message || 'Publicación sin texto'}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {post.comments?.data?.length || 0} comentarios
                          </span>
                          <span>{formatDate(post.created_time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comments Detail */}
        <div className="flex-1 bg-white overflow-y-auto">
          {selectedPost ? (
            <div className="p-6">
              {/* Post Header */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex gap-4">
                  {selectedPost.full_picture && (
                    <img
                      src={selectedPost.full_picture}
                      alt="Post"
                      className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-gray-900 mb-3">{selectedPost.message || 'Publicación sin texto'}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedPost.created_time)}
                      </span>
                      {selectedPost.permalink_url && (
                        <a
                          href={selectedPost.permalink_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Ver en Facebook
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Comentarios ({selectedPost.comments?.data?.length || 0})
                </h3>
                {selectedPost.comments?.data && selectedPost.comments.data.length > 0 ? (
                  <div className="space-y-4">
                    {selectedPost.comments.data.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-gray-900">{comment.from.name}</span>
                              <span className="text-xs text-gray-500">{formatDate(comment.created_time)}</span>
                            </div>
                            <p className="text-gray-700 text-sm">{comment.message}</p>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 ml-13">
                          <button
                            onClick={() => createLead(comment)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Crear Lead
                          </button>
                          <button
                            onClick={() => createDeal(comment)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
                          >
                            <TrendingUp className="w-3 h-3" />
                            Crear Deal
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay comentarios en esta publicación</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Selecciona una publicación para ver sus comentarios</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
