import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';

import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { colors, spacing, fontSize, fontFamily } from '@/src/config/theme';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import { useUser } from '@/src/shared/hooks/use-user';
import { GuestPromptOverlay } from '@/src/shared/components/guest-prompt-overlay';
import { useTwinData } from '@/src/features/insights/hooks/use-twin-data';
import { getAvatarSource } from '@/src/config/avatar-map';
import { getMyInstance } from '@/src/services/openclaw/client';
import { useIsPro } from '@/src/shared/hooks/use-subscription';
import { usePageTitle } from '@/src/shared/hooks/use-page-title';
import { useResponsive } from '@/src/shared/hooks/use-responsive';
import type { RuntimeState } from '@/src/shared/types/openclaw';

type BigFiveTrait = {
  id: string;
  label: string;
  value: number;
};

const TRAIT_KEYS = ['extraversion', 'agreeableness', 'conscientiousness', 'neuroticism', 'openness'] as const;

function getIndicatorColor(runtimeState: RuntimeState | null, isPro: boolean): string {
  if (!isPro || runtimeState === null) return '#6B7280';
  switch (runtimeState) {
    case 'healthy':
      return '#22C55E';
    case 'waking':
      return '#F59E0B';
    case 'error':
      return colors.error;
    default:
      return '#6B7280';
  }
}

export default function TwinScreen() {
  const { t } = useTranslation();
  usePageTitle(t('tabs.myAgent'));
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useUser((s) => s.user);
  const { isLoading, personalityTraits, hasData, fetchSoulMd } = useTwinData();
  const isPro = useIsPro();
  const { isMobile } = useResponsive();
  const [soulMdVisible, setSoulMdVisible] = useState(false);
  const [soulMdContent, setSoulMdContent] = useState<string | null>(null);
  const [soulMdLoading, setSoulMdLoading] = useState(false);
  const [runtimeState, setRuntimeState] = useState<RuntimeState | null>(null);

  useEffect(() => {
    if (!isPro || !user?.id) return;
    let cancelled = false;

    getMyInstance().then((instance) => {
      if (!cancelled && instance) {
        setRuntimeState(instance.runtimeState);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isPro, user?.id]);

  const isWeb = Platform.OS === 'web';
  const Wrapper = isWeb ? View : SafeAreaView;

  if (!isAuthenticated) {
    return (
      <CosmicBackground>
        <Wrapper style={styles.container} {...(!isWeb && { edges: ['top'] })}>
          <GuestPromptOverlay />
        </Wrapper>
      </CosmicBackground>
    );
  }

  const twinName = user?.twinName || t('twin.defaultName');
  const mbti = user?.mbtiType;

  const bigFiveTraits: BigFiveTrait[] = personalityTraits
    ? TRAIT_KEYS.map((key) => ({
        id: key,
        label: t(`twin.traits.${key}`),
        value: personalityTraits[key] / 100,
      }))
    : [];

  const handleViewSoulMd = async () => {
    setSoulMdContent(null);
    setSoulMdLoading(true);
    setSoulMdVisible(true);
    const content = await fetchSoulMd();
    setSoulMdContent(content);
    setSoulMdLoading(false);
  };

  const indicatorColor = getIndicatorColor(runtimeState, isPro);

  return (
    <CosmicBackground>
      <Wrapper style={styles.container} {...(!isWeb && { edges: ['top'] })}>
        <ScrollView
          contentContainerStyle={[styles.content, !isMobile && styles.contentDesktop]}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Header */}
          <Text style={styles.headerTitle}>AltMe</Text>

          {/* Avatar Card */}
          <View testID="twin-avatar" style={styles.avatarCard}>
            <View style={styles.avatar}>
              <Image
                source={getAvatarSource(user?.avatarIcon ?? 'default')}
                style={styles.avatarImage}
              />
            </View>

            {/* Twin Name */}
            <Text style={styles.twinName}>{twinName}</Text>

            {/* MBTI Badge - 設定時のみ表示 */}
            {mbti ? (
              <View testID="mbti-badge" style={styles.mbtiBadge}>
                <Text style={styles.mbtiBadgeText}>{mbti}</Text>
              </View>
            ) : null}

            {/* Online Indicator */}
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: indicatorColor }]} />
              <Text style={[styles.onlineText, { color: indicatorColor }]}>
                {isPro && runtimeState === 'healthy'
                  ? t('twin.status.online')
                  : isPro && runtimeState === 'waking'
                  ? t('twin.status.provisioning')
                  : t('twin.status.offline')}
              </Text>
            </View>
          </View>

          {/* Personality Traits Section */}
          <Text style={styles.sectionTitle}>{t('twin.personalityTitle')}</Text>

          {isLoading ? (
            <View testID="loading-indicator" style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : !hasData ? (
            <View testID="no-data-message" style={styles.emptyContainer}>
              <Feather name="alert-circle" size={32} color={colors.textSecondary} />
              <Text style={styles.emptyText}>{t('twin.noDiagnosis')}</Text>
              <Text style={styles.emptySubText}>{t('twin.noDiagnosisDescription')}</Text>
            </View>
          ) : (
            <View style={[styles.bigFiveContainer, !isMobile && styles.bigFiveGrid]}>
              {bigFiveTraits.map((trait) => (
                <View key={trait.id} testID="trait-progress-bar" style={styles.traitCard}>
                  <Text style={styles.traitLabel}>
                    {trait.label} {Math.round(trait.value * 100)}%
                  </Text>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${trait.value * 100}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* View SOUL.md Button - Proユーザーのみ表示 */}
          {isPro ? (
            <Pressable testID="view-soul-md-button" style={styles.viewSoulButton} onPress={handleViewSoulMd}>
              <Text style={styles.viewSoulButtonText}>{t('twin.viewSoulMd')}</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        {/* SOUL.md Modal */}
        <Modal
          visible={soulMdVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setSoulMdVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, !isMobile && styles.modalContainerDesktop]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>SOUL.md</Text>
                <Pressable onPress={() => setSoulMdVisible(false)}>
                  <Feather name="x" size={24} color={colors.text} />
                </Pressable>
              </View>
              <ScrollView style={styles.modalBody}>
                {soulMdLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : soulMdContent ? (
                  <Text style={styles.soulMdText}>{soulMdContent}</Text>
                ) : (
                  <Text style={styles.emptyText}>{t('twin.soulMdNotGenerated')}</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </Wrapper>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingVertical: spacing.md,
    paddingHorizontal: 20,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
    gap: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  avatarCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.25)',
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: '#7DD3FC40',
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  twinName: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'center',
  },
  mbtiBadge: {
    backgroundColor: '#7DD3FC15',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  mbtiBadgeText: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    color: '#7DD3FC',
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  onlineText: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: colors.text,
    alignSelf: 'flex-start',
  },
  loadingContainer: {
    width: '100%',
    paddingVertical: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  contentDesktop: {
    maxWidth: 720,
    alignSelf: 'center' as const,
    width: '100%' as unknown as number,
  },
  bigFiveContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  bigFiveGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.md,
  },
  traitCard: {
    backgroundColor: '#FFFFFF08',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF15',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: spacing.sm,
    flexGrow: 1,
    flexBasis: '45%' as unknown as number,
    minWidth: 200,
  },
  traitLabel: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.text,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#FFFFFF15',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7DD3FC',
    borderRadius: 3,
  },
  viewSoulButton: {
    backgroundColor: '#00D4FF12',
    borderColor: '#00D4FF50',
    borderWidth: 1,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  viewSoulButtonText: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    color: '#00D4FF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: spacing.xxl,
  },
  modalContainerDesktop: {
    maxWidth: 600,
    alignSelf: 'center' as const,
    width: '100%' as unknown as number,
    borderRadius: 20,
    marginBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF15',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
  modalBody: {
    padding: spacing.md,
  },
  soulMdText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.text,
    lineHeight: 22,
  },
});
