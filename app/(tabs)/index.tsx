import React, { useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, spacing, borderRadius, fontSize, fontFamily, sendGradient, glassmorphism } from '@/src/config/theme';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { FREE_DAILY_LIMIT, APP_NAME, CHAT } from '@/src/config/constants';
import { useIsPro } from '@/src/shared/hooks/use-subscription';
import { useUser } from '@/src/shared/hooks/use-user';
import { useNetwork } from '@/src/shared/hooks/use-network';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import { GuestPromptOverlay } from '@/src/shared/components/guest-prompt-overlay';
import { useChat, type DisplayMessage } from '@/src/features/chat/hooks/use-chat';

export default function ChatScreen() {
  const { t } = useTranslation();
  const isPro = useIsPro();
  const user = useUser((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isConnected: isOnline } = useNetwork();

  const {
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
  } = useChat();

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

  if (!isAuthenticated) {
    return (
      <CosmicBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <GuestPromptOverlay />
        </SafeAreaView>
      </CosmicBackground>
    );
  }

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
