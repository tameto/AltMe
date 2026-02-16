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
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GoldButton } from '@/src/shared/components/gold-button';
import { spacing, fontFamily, borderRadius, glassmorphism } from '@/src/config/theme';
import { useOnboardingStore } from '@/src/features/onboarding/stores/onboarding-store';
import type { AvatarIcon, SpeechTone } from '@/src/shared/types/user';
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
  const avatarStyle = useOnboardingStore((s) => s.avatarStyle);
  const toneStyle = useOnboardingStore((s) => s.toneStyle);
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
          const avatarMap: Record<string, AvatarIcon> = {
            geometric: 'geometric', cosmic: 'cosmic', organic: 'organic', techno: 'tech', zen: 'zen',
          };
          const toneMap: Record<string, SpeechTone> = {
            polite: 'polite', casual: 'friendly', intellectual: 'intellectual', mentor: 'mentor', tsundere: 'tsundere',
          };
          await updateProfile({
            onboardingCompleted: true,
            ...(avatarStyle ? { avatarIcon: avatarMap[avatarStyle] ?? 'default' } : {}),
            ...(toneStyle ? { speechTone: toneMap[toneStyle] ?? 'friendly' } : {}),
          });
        } catch (err) {
          console.error('Failed to update onboarding status:', err);
        }
        router.replace('/(tabs)');
      };
      completeOnboarding();
    }
  }, [isPro, chatEnded, updateProfile, avatarStyle, toneStyle]);

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
          {isTwin ? (
            <Text style={styles.twinLabel}>{t('onboarding.meetTwin.twinLabel')}</Text>
          ) : null}
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
    [t],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <CosmicBackground>
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

          {isLoading ? (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#7DD3FC" />
              <Text style={styles.typingText}>
                {t('onboarding.meetTwin.typing')}
              </Text>
            </View>
          ) : null}

          {chatEnded ? (
            <View style={styles.endSection}>
              <GoldButton
                title={t('onboarding.meetTwin.unlockButton')}
                onPress={handlePaywall}
                style={styles.unlockButton}
              />
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
                  placeholderTextColor="#64748B"
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
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: glassmorphism.card.border,
  },
  headerTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: '#94A3B8',
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
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  twinBubble: {
    alignSelf: 'flex-start',
    backgroundColor: glassmorphism.bubble.ai.bg,
    borderWidth: 1,
    borderColor: glassmorphism.bubble.ai.border,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: glassmorphism.bubble.user.bg,
    borderWidth: 1,
    borderColor: glassmorphism.bubble.user.border,
  },
  twinLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: '#7DD3FC',
    marginBottom: spacing.xs,
  },
  messageText: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  twinMessageText: {
    color: '#F8FAFC',
  },
  userMessageText: {
    color: '#F8FAFC',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  typingText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: '#94A3B8',
  },
  inputSafeArea: {
    borderTopWidth: 1,
    borderTopColor: glassmorphism.card.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: glassmorphism.input.bg,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: '#F8FAFC',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: glassmorphism.input.border,
  },
  sendButton: {
    backgroundColor: '#7DD3FC',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    height: 40,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    fontFamily: fontFamily.semiBold,
    color: '#0F172A',
    fontSize: 14,
  },
  messageCounter: {
    textAlign: 'center',
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: '#64748B',
    paddingBottom: spacing.sm,
  },
  endSection: {
    padding: spacing.xl,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: glassmorphism.card.border,
  },
  unlockButton: {
    alignSelf: 'stretch',
    marginBottom: spacing.md,
  },
  skipButton: {
    paddingVertical: spacing.sm,
  },
  skipButtonText: {
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
    fontSize: 15,
  },
});
