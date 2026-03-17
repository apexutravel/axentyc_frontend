import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config/api';
import { useSocket } from '@/hooks/useSocket';

interface Conversation {
  _id: string;
  unreadCount: number;
  channel: string;
}

export function useUnreadConversations() {
  const [totalUnread, setTotalUnread] = useState(0);
  const { subscribe } = useSocket();

  const fetchUnreadCount = async () => {
    try {
      const params = new URLSearchParams();
      params.set('channel', 'web_chat');
      
      const data = await api.get<Conversation[]>(
        `${API_ENDPOINTS.conversations.list}?${params.toString()}`
      );
      const conversations = ((data as any)?.data ?? data) as Conversation[];
      
      if (Array.isArray(conversations)) {
        const total = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setTotalUnread(total);
      }
    } catch (error) {
      console.error('[useUnreadConversations] Error fetching conversations:', error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();

    // Poll every 5 seconds for immediate updates
    const interval = setInterval(fetchUnreadCount, 5000);

    return () => clearInterval(interval);
  }, []);

  // Listen to socket events for real-time updates
  useEffect(() => {
    const cleanup1 = subscribe('message.received', () => {
      console.log('[useUnreadConversations] Message received, refreshing count');
      fetchUnreadCount();
    });

    const cleanup2 = subscribe('conversation.updated', () => {
      console.log('[useUnreadConversations] Conversation updated, refreshing count');
      fetchUnreadCount();
    });

    return () => {
      cleanup1();
      cleanup2();
    };
  }, [subscribe]);

  return totalUnread;
}
