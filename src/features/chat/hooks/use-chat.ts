import { useState, useCallback, useRef, useEffect } from 'react';
import { FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { supabase } from '@/src/services/supabase/client';
import { env } from '@/src/config/env';
import { getMyInstance, getGatewayToken, subscribeToInstanceChanges } from '@/src/services/openclaw/client';
import { OpenClawWebSocketClient } from '@/src/services/openclaw/websocket-client';
import { setActiveClient } from '@/src/services/openclaw/connection-manager';
import { FREE_DAILY_LIMIT, CHAT, APP_NAME } from '@/src/config/constants';
import { useIsPro } from '@/src/shared/hooks/use-subscription';
import { useUser } from '@/src/shared/hooks/use-user';
import { useNetwork } from '@/src/shared/hooks/use-network';
import type { WsConnectionStatus, ConnectionMode } from '@/src/shared/types/openclaw';

const DEVICE_ID_KEY = 'device_id';

const getOrCreateDeviceId = async (): Promise<string> => {
  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;
  const id = `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
};

export type DisplayMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type UseChatReturn = {
  messages: DisplayMessage[];
  displayData: DisplayMessage[];
  inputText: string;
  setInputText: (text: string) => void;
  isLoading: boolean;
  isLoadingHistory: boolean;
  streamingText: string;
  connectionMode: ConnectionMode;
  wsStatus: WsConnectionStatus;
  todayUserCount: number;
  isAtLimit: boolean;
  handleSend: () => Promise<void>;
  flatListRef: React.RefObject<FlatList | null>;
};

export function useChat(): UseChatReturn {
  const router = useRouter();
  const { t } = useTranslation();
  const isPro = useIsPro();
  const user = useUser((s) => s.user);
  const { isConnected: isOnline } = useNetwork();

  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [streamingText, setStreamingText] = useState('');
  const [todayUserCount, setTodayUserCount] = useState(0);

  // WebSocket / OpenClaw state
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('edge_function');
  const connectionModeRef = useRef<ConnectionMode>('edge_function');
  const [wsStatus, setWsStatus] = useState<WsConnectionStatus>('disconnected');
  const wsClientRef = useRef<OpenClawWebSocketClient | null>(null);
  const streamingTextRef = useRef('');

  const updateConnectionMode = useCallback((mode: ConnectionMode) => {
    connectionModeRef.current = mode;
    setConnectionMode(mode);
  }, []);

  const isAtLimit = !isPro && todayUserCount >= FREE_DAILY_LIMIT;

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.id) {
        setIsLoadingHistory(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('chat_messages')
          .select('id, role, content, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(CHAT.contextMessageCount);

        if (data && data.length > 0) {
          const mapped = data.reverse().map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            createdAt: m.created_at,
          }));
          setMessages(mapped);
        } else {
          const twinName = user.twinName || APP_NAME;
          const welcomeContent = user.displayName
            ? t('chat.welcomeMessage', { name: user.displayName, twinName })
            : t('chat.welcomeMessageDefault', { twinName });
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: welcomeContent,
            createdAt: new Date().toISOString(),
          }]);
        }

        // Count today's user messages (only relevant for free users)
        if (!isPro) {
          const todayStr = new Date().toLocaleDateString('en-CA', {
            timeZone: user.timezone || 'Asia/Tokyo',
          });
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('role', 'user')
            .gte('created_at', `${todayStr}T00:00:00`);
          setTodayUserCount(count ?? 0);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadHistory();
  }, [user?.id, user?.displayName, user?.twinName, user?.timezone, isPro, t]);

  // Connect to OpenClaw WebSocket for Pro users
  const connectToWebSocket = useCallback(async (cancelled: { current: boolean }) => {
    try {
      const inst = await getMyInstance();
      if (cancelled.current) return;

      if (!inst || inst.status !== 'running' || !inst.cfWorkerUrl) {
        updateConnectionMode('edge_function');
        return;
      }

      const token = await getGatewayToken();
      if (cancelled.current || !token) {
        updateConnectionMode('edge_function');
        return;
      }

      const deviceId = await getOrCreateDeviceId();
      if (cancelled.current) return;

      // Disconnect existing client
      wsClientRef.current?.disconnect();
      setActiveClient(null);

      const client = new OpenClawWebSocketClient({
        cfWorkerUrl: inst.cfWorkerUrl,
        userId: inst.userId,
        gatewayToken: token,
        deviceId,
        onTextDelta: (delta, _sessionId) => {
          streamingTextRef.current += delta;
          setStreamingText(streamingTextRef.current);
        },
        onTextDone: (content, _sessionId) => {
          const aiMessage: DisplayMessage = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMessage]);
          setStreamingText('');
          streamingTextRef.current = '';
          setIsLoading(false);
        },
        onConnected: (_sessionId) => {
          updateConnectionMode('websocket');
        },
        onError: (code, message) => {
          console.error(`OpenClaw error: ${code} - ${message}`);
          setIsLoading(false);
          if (code === 'AUTH_FAILED') {
            updateConnectionMode('edge_function');
          }
        },
        onStatusChange: (status) => {
          setWsStatus(status);
          if (status === 'disconnected' && !cancelled.current) {
            updateConnectionMode('edge_function');
          }
        },
      });

      wsClientRef.current = client;
      setActiveClient(client);
      client.connect();
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      if (!cancelled.current) {
        updateConnectionMode('edge_function');
      }
    }
  }, [updateConnectionMode]);

  useEffect(() => {
    if (!isPro || !user?.id) {
      updateConnectionMode('edge_function');
      return;
    }

    const cancelled = { current: false };

    connectToWebSocket(cancelled);

    // Subscribe to instance changes so we auto-connect when provisioning completes
    const unsubscribe = subscribeToInstanceChanges(user.id, (updated) => {
      if (updated.status === 'running' && updated.ipAddress && connectionModeRef.current !== 'websocket') {
        connectToWebSocket(cancelled);
      }
      if (updated.status === 'stopped' || updated.status === 'error' || updated.status === 'destroying') {
        wsClientRef.current?.disconnect();
        wsClientRef.current = null;
        setActiveClient(null);
        updateConnectionMode('edge_function');
      }
    });

    return () => {
      cancelled.current = true;
      wsClientRef.current?.disconnect();
      wsClientRef.current = null;
      setActiveClient(null);
      unsubscribe();
    };
  }, [isPro, user?.id, connectToWebSocket, updateConnectionMode]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messages.length > 0 || streamingText) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, streamingText]);

  // Send via WebSocket (Pro mode)
  const sendViaWebSocket = useCallback((text: string) => {
    const client = wsClientRef.current;
    if (!client?.isConnected) {
      return false;
    }
    streamingTextRef.current = '';
    client.sendMessage(text);
    return true;
  }, []);

  // Send via Edge Function (Free mode / fallback)
  const sendViaEdgeFunction = useCallback(async (text: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${env.supabaseUrl}/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ message: text }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === 'chat_limit_reached') {
          router.push('/(paywall)');
          return;
        }
        if (errorData.error === 'rate_limited') {
          setMessages((prev) => [...prev, {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: t('chat.rateLimited'),
            createdAt: new Date().toISOString(),
          }]);
          return;
        }
        throw new Error(errorData.error || 'Chat request failed');
      }

      // Handle SSE streaming
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let accumulated = '';
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });
        const lines = accumulated.split('\n');
        accumulated = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.delta) {
              fullResponse += parsed.delta;
              setStreamingText(fullResponse);
            }
            if (parsed.isComplete && fullResponse) {
              const aiMessage: DisplayMessage = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: fullResponse,
                createdAt: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, aiMessage]);
              setStreamingText('');
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }

      // If stream ended without isComplete event
      if (fullResponse) {
        setMessages((prev) => {
          if (prev.find((m) => m.content === fullResponse)) return prev;
          return [...prev, {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: fullResponse,
            createdAt: new Date().toISOString(),
          }];
        });
        setStreamingText('');
      }

      if (!isPro) {
        setTodayUserCount((c) => c + 1);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: t('chat.errorResponse'),
        createdAt: new Date().toISOString(),
      }]);
      setStreamingText('');
    }
  }, [router, isPro, t]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading || !isOnline) return;

    if (isAtLimit) {
      router.push('/(paywall)');
      return;
    }

    if (text.length > CHAT.maxMessageLength) return;

    const userMessage: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setStreamingText('');

    if (connectionMode === 'websocket') {
      const sent = sendViaWebSocket(text);
      if (!sent) {
        // Fallback to Edge Function
        await sendViaEdgeFunction(text);
        setIsLoading(false);
      }
      // isLoading will be cleared by onTextDone callback for WebSocket
    } else {
      await sendViaEdgeFunction(text);
      setIsLoading(false);
    }
  }, [inputText, isLoading, isAtLimit, isOnline, router, connectionMode, sendViaWebSocket, sendViaEdgeFunction]);

  // Build display data: messages + streaming bubble
  const displayData: DisplayMessage[] = streamingText
    ? [...messages, {
        id: 'streaming',
        role: 'assistant',
        content: streamingText,
        createdAt: new Date().toISOString(),
      }]
    : messages;

  return {
    messages,
    displayData,
    inputText,
    setInputText,
    isLoading,
    isLoadingHistory,
    streamingText,
    connectionMode,
    wsStatus,
    todayUserCount,
    isAtLimit,
    handleSend,
    flatListRef,
  };
}
