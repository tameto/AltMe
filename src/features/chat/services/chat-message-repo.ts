import { supabase } from '@/src/services/supabase/client';
import { CHAT } from '@/src/config/constants';

export type HistoryRecord = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export const fetchHistory = async (
  userId: string,
  limit: number = CHAT.contextMessageCount,
): Promise<HistoryRecord[]> => {
  const { data } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) return [];

  return data.reverse().map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    createdAt: m.created_at,
  }));
};

export const fetchHistoryPaginated = async (
  userId: string,
  limit: number = CHAT.historyPageSize,
  before?: string,
): Promise<{ messages: HistoryRecord[]; hasMore: boolean }> => {
  let query = supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data } = await query;
  if (!data) return { messages: [], hasMore: false };

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;

  return {
    messages: items.reverse().map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      createdAt: m.created_at,
    })),
    hasMore,
  };
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  const { count } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'assistant')
    .eq('is_read', false);
  return count ?? 0;
};

export const markMessagesAsRead = async (messageIds: string[]): Promise<void> => {
  if (messageIds.length === 0) return;
  await supabase
    .from('chat_messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .in('id', messageIds);
};

export const countTodayMessages = async (
  userId: string,
  timezone: string,
): Promise<number> => {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: timezone });

  // Build UTC offset for the timezone to avoid boundary issues
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  });
  const parts = formatter.formatToParts(new Date());
  const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? '+00:00';
  // Convert "GMT+9" → "+09:00", "GMT-5" → "-05:00", "GMT" → "+00:00"
  const offset = tzPart === 'GMT'
    ? '+00:00'
    : tzPart.replace(/^GMT/, '').replace(/^([+-])(\d)$/, '$10$2:00').replace(/^([+-])(\d{2})$/, '$1$2:00');

  const { count } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'user')
    .gte('created_at', `${todayStr}T00:00:00${offset}`);
  return count ?? 0;
};
