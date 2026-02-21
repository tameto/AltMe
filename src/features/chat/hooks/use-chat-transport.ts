import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { supabase } from '@/src/services/supabase/client';
import { env } from '@/src/config/env';
import { getMyInstance, getGatewayToken, subscribeToInstanceChanges } from '@/src/services/openclaw/client';
import { OpenClawWebSocketClient } from '@/src/services/openclaw/websocket-client';
import { setActiveClient } from '@/src/services/openclaw/connection-manager';
import { useIsPro } from '@/src/shared/hooks/use-subscription';
import { useUser } from '@/src/shared/hooks/use-user';
import type { WsConnectionStatus, ConnectionMode } from '@/src/shared/types/openclaw';
import type { DisplayMessage } from './use-chat-messages';

const DEVICE_ID_KEY = 'device_id';

const getOrCreateDeviceId = async (): Promise<string> => {
  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;
  const id = `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
};

export type UseChatTransportReturn = {
  connectionMode: ConnectionMode;
  wsStatus: WsConnectionStatus;
  streamingText: string;
  sendViaEdgeFunction: (
    text: string,
    callbacks: {
      onAddMessage: (msg: DisplayMessage) => void;
      onIncrementTodayCount: () => void;
    },
  ) => Promise<void>;
  sendViaWebSocket: (text: string) => boolean;
};

export function useChatTransport(): UseChatTransportReturn {
  const router = useRouter();
  const { t } = useTranslation();
  const isPro = useIsPro();
  const user = useUser((s) => s.user);

  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('edge_function');
  const connectionModeRef = useRef<ConnectionMode>('edge_function');
  const [wsStatus, setWsStatus] = useState<WsConnectionStatus>('disconnected');
  const [streamingText, setStreamingText] = useState('');
  const streamingTextRef = useRef('');
  const wsClientRef = useRef<OpenClawWebSocketClient | null>(null);

  // Callbacks ref for WebSocket events (set by caller during send)
  const wsCallbacksRef = useRef<{
    onAddMessage: (msg: DisplayMessage) => void;
    onSetLoading: (loading: boolean) => void;
  } | null>(null);

  const updateConnectionMode = useCallback((mode: ConnectionMode) => {
    connectionModeRef.current = mode;
    setConnectionMode(mode);
  }, []);

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

      wsClientRef.current?.disconnect();
      setActiveClient(null);

      const client = new OpenClawWebSocketClient({
        cfWorkerUrl: inst.cfWorkerUrl,
        userId: inst.userId,
        gatewayToken: token,
        deviceId,
        clientType: Platform.OS === 'web' ? 'web' : 'mobile',
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
          wsCallbacksRef.current?.onAddMessage(aiMessage);
          setStreamingText('');
          streamingTextRef.current = '';
          wsCallbacksRef.current?.onSetLoading(false);
        },
        onConnected: (_sessionId) => {
          updateConnectionMode('websocket');
        },
        onError: (code, message) => {
          console.error(`OpenClaw error: ${code} - ${message}`);
          wsCallbacksRef.current?.onSetLoading(false);
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

    const handleVisibilityChange = () => {
      if (Platform.OS !== 'web') return;
      if (document.visibilityState === 'hidden') {
        wsClientRef.current?.disconnect();
        wsClientRef.current = null;
        setActiveClient(null);
        updateConnectionMode('edge_function');
      } else if (document.visibilityState === 'visible' && !cancelled.current) {
        connectToWebSocket(cancelled);
      }
    };

    const handleBeforeUnload = () => {
      if (Platform.OS !== 'web') return;
      wsClientRef.current?.disconnect();
    };

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      cancelled.current = true;
      wsClientRef.current?.disconnect();
      wsClientRef.current = null;
      setActiveClient(null);
      unsubscribe();
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    };
  }, [isPro, user?.id, connectToWebSocket, updateConnectionMode]);

  const sendViaEdgeFunction = useCallback(async (
    text: string,
    callbacks: {
      onAddMessage: (msg: DisplayMessage) => void;
      onIncrementTodayCount: () => void;
    },
  ) => {
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
          callbacks.onAddMessage({
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: t('chat.rateLimited'),
            createdAt: new Date().toISOString(),
          });
          return;
        }
        throw new Error(errorData.error || 'Chat request failed');
      }

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
              callbacks.onAddMessage({
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: fullResponse,
                createdAt: new Date().toISOString(),
              });
              setStreamingText('');
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }

      if (fullResponse) {
        // Guard against duplicate if isComplete already fired
        setStreamingText('');
      }

      if (!isPro) {
        callbacks.onIncrementTodayCount();
      }
    } catch (error) {
      console.error('Chat error:', error);
      callbacks.onAddMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: t('chat.errorResponse'),
        createdAt: new Date().toISOString(),
      });
      setStreamingText('');
    }
  }, [router, isPro, t]);

  const sendViaWebSocket = useCallback((text: string): boolean => {
    const client = wsClientRef.current;
    if (!client?.isConnected) return false;
    streamingTextRef.current = '';
    client.sendMessage(text);
    return true;
  }, []);

  return {
    connectionMode,
    wsStatus,
    streamingText,
    sendViaEdgeFunction,
    sendViaWebSocket,
  };
}

export type { ConnectionMode, WsConnectionStatus };
