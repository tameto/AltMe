import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors, spacing, borderRadius, fontSize } from '@/src/config/theme';
import { FREE_DAILY_LIMIT, CHAT, APP_NAME } from '@/src/config/constants';
import { useIsPro } from '@/src/shared/hooks/use-subscription';
import { useUser } from '@/src/shared/hooks/use-user';
import { useNetwork } from '@/src/shared/hooks/use-network';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import { GuestPromptOverlay } from '@/src/shared/components/guest-prompt-overlay';
import { supabase } from '@/src/services/supabase/client';
import { env } from '@/src/config/env';
import { getMyInstance, getGatewayToken, subscribeToInstanceChanges } from '@/src/services/openclaw/client';
import { OpenClawWebSocketClient } from '@/src/services/openclaw/websocket-client';
import type { WsConnectionStatus, ConnectionMode } from '@/src/shared/types/openclaw';

const DEVICE_ID_KEY = 'device_id';

const getOrCreateDeviceId = async (): Promise<string> => {
  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;
  const id = `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
};

type DisplayMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export default function ChatScreen() {
  const router = useRouter();
  const isPro = useIsPro();
  const user = useUser((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const flatListRef = useRef<FlatList>(null);
  const { isConnected: isOnline } = useNetwork();

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <GuestPromptOverlay />
      </SafeAreaView>
    );
  }

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
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: `${user.displayName ? `${user.displayName}さん、` : ''}こんにちは！${user.twinName || APP_NAME}だよ。今日はどんなことがあった？`,
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
  }, [user?.id, user?.displayName, user?.twinName, user?.timezone, isPro]);

  // Connect to OpenClaw WebSocket for Pro users
  const connectToWebSocket = useCallback(async (cancelled: { current: boolean }) => {
    try {
      const inst = await getMyInstance();
      if (cancelled.current) return;

      if (!inst || inst.status !== 'running' || !inst.ipAddress) {
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

      const client = new OpenClawWebSocketClient({
        ipAddress: inst.ipAddress,
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
        updateConnectionMode('edge_function');
      }
    });

    return () => {
      cancelled.current = true;
      wsClientRef.current?.disconnect();
      wsClientRef.current = null;
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
          router.push('/(paywall)' as never);
          return;
        }
        if (errorData.error === 'rate_limited') {
          setMessages((prev) => [...prev, {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: 'ちょっと待ってね。少し間を置いてからもう一度話しかけて。',
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
        content: 'ごめんね、うまく返事ができなかった。もう一度試してみて。',
        createdAt: new Date().toISOString(),
      }]);
      setStreamingText('');
    }
  }, [router, isPro]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading || !isOnline) return;

    if (isAtLimit) {
      router.push('/(paywall)' as never);
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

  const renderMessage = useCallback(({ item }: { item: DisplayMessage }) => {
    const isUser = item.role === 'user';
    const isStreaming = item.id === 'streaming';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <FontAwesome name="user-circle" size={14} color={colors.primary} />
          </View>
        )}
        <View style={[styles.messageContent, isUser ? styles.userContent : styles.aiContent]}>
          <Text style={[styles.messageText, isUser && styles.userText]}>
            {item.content}
            {isStreaming && <Text style={styles.cursor}>|</Text>}
          </Text>
        </View>
      </View>
    );
  }, []);

  // Connection status dot color
  const statusDotColor = connectionMode === 'websocket'
    ? (wsStatus === 'connected' ? colors.success : wsStatus === 'reconnecting' ? colors.warning : colors.textTertiary)
    : colors.success;

  if (isLoadingHistory) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
          <Text style={styles.headerTitle}>{user?.twinName || APP_NAME}</Text>
          {isPro && connectionMode === 'websocket' && (
            <View style={styles.modeBadge}>
              <Text style={styles.modeBadgeText}>Pro</Text>
            </View>
          )}
        </View>
        {!isPro && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push('/(paywall)' as never)}>
            <Text style={styles.upgradeText}>Pro</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isPro && (
        <View style={styles.limitBanner}>
          <Text style={styles.limitText}>
            {isAtLimit
              ? 'Proにアップグレードして無制限に会話しよう'
              : `残り${Math.max(0, FREE_DAILY_LIMIT - todayUserCount)}回`}
          </Text>
        </View>
      )}

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <FontAwesome name="wifi" size={12} color={colors.error} />
          <Text style={styles.offlineText}>オフライン</Text>
        </View>
      )}

      {isOnline && isPro && wsStatus === 'reconnecting' && (
        <View style={styles.reconnectBanner}>
          <ActivityIndicator size="small" color={colors.warning} />
          <Text style={styles.reconnectText}>再接続中...</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={displayData}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
      />

      {isLoading && !streamingText && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.typingText}>考え中...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={isAtLimit ? 'Proにアップグレードして続けよう' : '今日の出来事を教えて...'}
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={CHAT.maxMessageLength}
            editable={!isAtLimit}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading || !isOnline) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading || !isOnline}>
            <FontAwesome
              name="send"
              size={16}
              color={inputText.trim() && !isLoading && isOnline ? colors.textInverse : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  modeBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  modeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  upgradeText: {
    color: colors.textInverse,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  limitBanner: {
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  limitText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error + '15',
    paddingVertical: spacing.xs,
  },
  offlineText: {
    fontSize: fontSize.xs,
    color: colors.error,
    fontWeight: '500',
  },
  reconnectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warning + '15',
    paddingVertical: spacing.xs,
  },
  reconnectText: {
    fontSize: fontSize.xs,
    color: colors.warning,
    fontWeight: '500',
  },
  messageList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexGrow: 1,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  aiBubble: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  messageContent: {
    maxWidth: '75%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  userContent: {
    backgroundColor: colors.primary,
    marginLeft: 'auto',
    borderBottomRightRadius: spacing.xs,
  },
  aiContent: {
    backgroundColor: colors.surfaceSecondary,
    borderBottomLeftRadius: spacing.xs,
  },
  messageText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  userText: {
    color: colors.textInverse,
  },
  cursor: {
    color: colors.primary,
    fontWeight: '700',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  typingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceSecondary,
  },
});
