import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, spacing, borderRadius, fontSize, fontFamily, sendGradient, glassmorphism } from '@/src/config/theme';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
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
  const { t } = useTranslation();
  const isPro = useIsPro();
  const user = useUser((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const flatListRef = useRef<FlatList>(null);
  const { isConnected: isOnline } = useNetwork();

  if (!isAuthenticated) {
    return (
      <CosmicBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <GuestPromptOverlay />
        </SafeAreaView>
      </CosmicBackground>
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
          <View style={styles.aiAvatarContainer}>
            <MaterialCommunityIcons name="robot-outline" size={14} color={colors.primary} />
          </View>
        )}
        <View style={[styles.messageContent, isUser ? styles.userContent : styles.aiContent]}>
          <Text style={[styles.messageText, isUser && styles.userText]}>
            {item.content}
            {isStreaming && <Text style={styles.cursor}>|</Text>}
          </Text>
          <Text style={styles.messageTimestamp}>
            {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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
      <CosmicBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </CosmicBackground>
    );
  }

  return (
    <CosmicBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrapper}>
              <MaterialCommunityIcons name="robot-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.headerTitle}>{user?.twinName || APP_NAME}</Text>
            <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
          </View>
          {!isPro && (
            <View style={styles.remainingBadge}>
              <Text style={styles.remainingBadgeText}>
                {Math.max(0, FREE_DAILY_LIMIT - todayUserCount)}
              </Text>
            </View>
          )}
        </View>

        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Feather name="wifi-off" size={12} color={colors.error} />
            <Text style={styles.offlineText}>{t('chat.offline')}</Text>
          </View>
        )}

        {isOnline && isPro && wsStatus === 'reconnecting' && (
          <View style={styles.reconnectBanner}>
            <ActivityIndicator size="small" color={colors.warning} />
            <Text style={styles.reconnectText}>{t('chat.connectionStatus.reconnecting')}</Text>
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
          <Text style={styles.typingText}>{t('chat.thinking')}</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}>
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={isAtLimit ? t('chat.inputPlaceholderAtLimit') : t('chat.inputPlaceholderDefault')}
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={CHAT.maxMessageLength}
              editable={!isAtLimit}
            />
            {inputText.trim() && !isLoading && isOnline ? (
              <Pressable
                style={styles.sendButton}
                onPress={handleSend}>
                <LinearGradient
                  colors={sendGradient.colors}
                  start={sendGradient.start}
                  end={sendGradient.end}
                  style={styles.sendGradient}>
                  <Feather name="send" size={18} color={colors.text} />
                </LinearGradient>
              </Pressable>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: glassmorphism.input.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  remainingBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 32,
    alignItems: 'center',
  },
  remainingBadgeText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.textInverse,
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
    fontFamily: fontFamily.medium,
    color: colors.error,
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
    fontFamily: fontFamily.medium,
    color: colors.warning,
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
  aiAvatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: glassmorphism.input.bg,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  messageContent: {
    maxWidth: '75%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.xs,
  },
  userContent: {
    backgroundColor: glassmorphism.bubble.user.bg,
    borderWidth: 1,
    borderColor: glassmorphism.bubble.user.border,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: 4,
    borderBottomRightRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
  aiContent: {
    backgroundColor: glassmorphism.bubble.ai.bg,
    borderWidth: 1,
    borderColor: glassmorphism.bubble.ai.border,
    borderTopLeftRadius: 4,
    borderTopRightRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
  messageText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.text,
    lineHeight: 22,
  },
  userText: {
    color: colors.text,
  },
  messageTimestamp: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#FFFFFF60',
    alignSelf: 'flex-end',
  },
  cursor: {
    color: colors.primary,
    fontFamily: fontFamily.bold,
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
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  inputContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: glassmorphism.input.bg,
    borderWidth: 1,
    borderColor: glassmorphism.input.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 24,
    maxHeight: 120,
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.text,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
