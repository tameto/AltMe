import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useState, useRef, useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius } from '@/src/config/theme';
import { useOnboardingStore } from '@/src/features/onboarding/stores/onboarding-store';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import { useIsPro } from '@/src/shared/hooks/use-subscription';
import { supabase } from '@/src/services/supabase/client';

const MAX_FREE_EXCHANGES = 3;

type ChatMessage = {
  id: string;
  role: 'user' | 'twin';
  content: string;
};

export default function MeetTwinScreen() {
  const { t } = useTranslation();
  const personalityResult = useOnboardingStore((s) => s.personalityResult);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const isPro = useIsPro();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [chatEnded, setChatEnded] = useState(false);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // When user becomes Pro (returned from paywall after purchase), complete onboarding
  useEffect(() => {
    if (isPro && chatEnded) {
      const completeOnboarding = async () => {
        try {
          await updateProfile({ onboardingCompleted: true });
        } catch (err) {
          console.error('Failed to update onboarding status:', err);
        }
        router.replace('/(tabs)');
      };
      completeOnboarding();
    }
  }, [isPro, chatEnded, updateProfile]);

  useEffect(() => {
    const introMessage = generateIntroMessage();
    setMessages([
      {
        id: 'twin-intro',
        role: 'twin',
        content: introMessage,
      },
    ]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const generateIntroMessage = (): string => {
    const traits = personalityResult?.personalityTraits;
    if (!traits) {
      return 'はじめまして！あなたのAI分身です。あなたのことをもっと知りたいな！何でも話してくださいね。';
    }

    const highestTrait = getHighestTrait(traits);
    const traitGreetings: Record<string, string> = {
      openness:
        'はじめまして！あなたのAI分身です。新しいことにチャレンジするのが好きなあなたにぴったりのパートナーになれると思います！一緒に新しいアイデアを探しましょう。',
      conscientiousness:
        'はじめまして！あなたのAI分身です。計画的に物事を進めるあなたのスタイルに合わせて、タスク管理や整理をお手伝いしますね！',
      extraversion:
        'はじめまして！あなたのAI分身です。エネルギッシュなあなたと一緒に、楽しくアイデアを出し合えることを楽しみにしています！',
      agreeableness:
        'はじめまして！あなたのAI分身です。他者への思いやりが深いあなたのように、私もあなたの気持ちに寄り添えるパートナーでありたいです。',
      neuroticism:
        'はじめまして！あなたのAI分身です。繊細で感性豊かなあなたをサポートしたいと思います。一緒に頼れる存在を目指しますね！',
    };

    return traitGreetings[highestTrait] ?? traitGreetings.openness;
  };

  const getHighestTrait = (traits: Record<string, number>): string => {
    let highest = '';
    let highestValue = -1;
    for (const [key, value] of Object.entries(traits)) {
      if (value > highestValue) {
        highest = key;
        highestValue = value;
      }
    }
    return highest;
  };

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading || chatEnded) return;

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    const newUserCount = userMessageCount + 1;
    setUserMessageCount(newUserCount);

    try {
      const { data, error } = await supabase.functions.invoke('onboarding-chat', {
        body: {
          messages: updatedMessages.map((m) => ({
            role: m.role === 'twin' ? 'assistant' : 'user',
            content: m.content,
          })),
          personalityResult: personalityResult,
          messageCount: newUserCount,
        },
      });

      const twinResponse: ChatMessage = {
        id: `twin-${Date.now()}`,
        role: 'twin',
        content:
          error || !data?.message
            ? generateFallbackResponse(newUserCount)
            : data.message,
      };

      setMessages((prev) => [...prev, twinResponse]);

      if (newUserCount >= MAX_FREE_EXCHANGES) {
        setChatEnded(true);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackResponse: ChatMessage = {
        id: `twin-${Date.now()}`,
        role: 'twin',
        content: generateFallbackResponse(newUserCount),
      };
      setMessages((prev) => [...prev, fallbackResponse]);

      if (newUserCount >= MAX_FREE_EXCHANGES) {
        setChatEnded(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, chatEnded, messages, userMessageCount, personalityResult]);

  const generateFallbackResponse = (count: number): string => {
    if (count >= MAX_FREE_EXCHANGES) {
      return 'もっとお話ししたいな...あなたのことが少しずつわかってきました。続きを解除して、もっと深く会話しましょう！';
    }
    if (count === 2) {
      return 'なるほど！あなたのことが少しずつわかってきました。もう少し話してみませんか？';
    }
    return '興味深いですね！あなたの考え方が伝わってきます。もっと詳しく教えてください！';
  };

  const handlePaywall = () => {
    router.push('/(paywall)');
  };

  const handleSkip = async () => {
    try {
      await updateProfile({ onboardingCompleted: true });
    } catch (err) {
      console.error('Failed to update onboarding status:', err);
    }
    router.replace('/(tabs)');
  };

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isTwin = item.role === 'twin';
      return (
        <View
          style={[
            styles.messageBubble,
            isTwin ? styles.twinBubble : styles.userBubble,
          ]}
        >
          {isTwin && (
            <Text style={styles.twinLabel}>{t('onboarding.meetTwin.twinLabel')}</Text>
          )}
          <Text
            style={[
              styles.messageText,
              isTwin ? styles.twinMessageText : styles.userMessageText,
            ]}
          >
            {item.content}
          </Text>
        </View>
      );
    },
    [],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t('onboarding.meetTwin.title')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t('onboarding.meetTwin.subtitle')}
          </Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {isLoading && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.typingText}>
              {t('onboarding.meetTwin.typing')}
            </Text>
          </View>
        )}

        {chatEnded ? (
          <View style={styles.endSection}>
            <Pressable style={styles.paywallButton} onPress={handlePaywall}>
              <Text style={styles.paywallButtonText}>
                {t('onboarding.meetTwin.unlockButton')}
              </Text>
            </Pressable>
            <Pressable style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>
                {t('onboarding.meetTwin.skipButton')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={t('onboarding.meetTwin.inputPlaceholder')}
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={sendMessage}
                blurOnSubmit={false}
                editable={!isLoading}
              />
              <Pressable
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <Text style={styles.sendButtonText}>{t('onboarding.meetTwin.send')}</Text>
              </Pressable>
            </View>
            <Text style={styles.messageCounter}>
              {t('onboarding.meetTwin.remaining', { count: MAX_FREE_EXCHANGES - userMessageCount })}
            </Text>
          </SafeAreaView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  twinBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  twinLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  messageText: {
    fontSize: fontSize.md,
    lineHeight: 24,
  },
  twinMessageText: {
    color: colors.text,
  },
  userMessageText: {
    color: colors.textInverse,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  typingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  inputSafeArea: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  messageCounter: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    paddingBottom: spacing.sm,
  },
  endSection: {
    padding: spacing.xl,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paywallButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: spacing.md,
  },
  paywallButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: spacing.sm,
  },
  skipButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
});
