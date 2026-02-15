import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';

import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { colors, spacing, fontSize, fontFamily } from '@/src/config/theme';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import { useUser } from '@/src/shared/hooks/use-user';
import { GuestPromptOverlay } from '@/src/shared/components/guest-prompt-overlay';

type BigFiveTrait = {
  label: string;
  value: number;
};

const MOCK_BIG_FIVE: BigFiveTrait[] = [
  { label: '開放性', value: 0.75 },
  { label: '誠実性', value: 0.82 },
  { label: '外向性', value: 0.45 },
  { label: '協調性', value: 0.68 },
  { label: '神経症傾向', value: 0.35 },
];

export default function TwinScreen() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useUser((s) => s.user);

  if (!isAuthenticated) {
    return (
      <CosmicBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <GuestPromptOverlay />
        </SafeAreaView>
      </CosmicBackground>
    );
  }

  const twinName = user?.twinName || t('twin.defaultName');
  const mbti = user?.mbtiType || 'INFP';

  const handleViewSoulMd = () => {
    Alert.alert('SOUL.md', t('twin.soulMdComingSoon'));
  };

  return (
    <CosmicBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Header */}
          <Text style={styles.headerTitle}>AltMe</Text>

          {/* Twin Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Feather name="user" size={40} color={colors.primary} />
            </View>
            <View style={styles.onlineIndicator} />
          </View>

          {/* Twin Name */}
          <Text style={styles.twinName}>{twinName}</Text>

          {/* MBTI Badge */}
          <View style={styles.mbtiBadge}>
            <Text style={styles.mbtiBadgeText}>{mbti}</Text>
          </View>

          {/* Personality Traits Section */}
          <Text style={styles.sectionTitle}>パーソナリティ特性</Text>

          {/* Big Five Bars */}
          <View style={styles.bigFiveContainer}>
            {MOCK_BIG_FIVE.map((trait, index) => (
              <View key={index} style={styles.traitRow}>
                <Text style={styles.traitLabel}>{trait.label}</Text>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${trait.value * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.traitValue}>
                    {Math.round(trait.value * 100)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* View SOUL.md Button */}
          <Pressable style={styles.viewSoulButton} onPress={handleViewSoulMd}>
            <Feather name="file-text" size={16} color={colors.text} />
            <Text style={styles.viewSoulButtonText}>SOUL.md を閲覧</Text>
            <Feather name="chevron-right" size={16} color={colors.textSecondary} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
    color: colors.text,
    alignSelf: 'flex-start',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderColor: colors.primary,
    borderWidth: 3,
    backgroundColor: '#FFFFFF12',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowRadius: 16,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
  twinName: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  mbtiBadge: {
    backgroundColor: '#FFFFFF12',
    borderColor: '#FFFFFF25',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: spacing.xl,
  },
  mbtiBadgeText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  bigFiveContainer: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  traitRow: {
    gap: spacing.xs,
  },
  traitLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.text,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#FFFFFF15',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  traitValue: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  viewSoulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderColor: '#FFFFFF25',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    width: '100%',
  },
  viewSoulButtonText: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    color: colors.text,
  },
});
