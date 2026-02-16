import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';
import { useRouter, type Href } from 'expo-router';

import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GlassCard } from '@/src/shared/components/glass-card';
import { GoldButton } from '@/src/shared/components/gold-button';
import { colors, spacing, fontSize, fontFamily, borderRadius } from '@/src/config/theme';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import { useIsPro } from '@/src/shared/hooks/use-subscription';

type Language = 'jp' | 'en';

type Community = {
  id: string;
  name: string;
  thumbnail: string;
  participantCount: number;
  conversationCount: number;
};

const MOCK_COMMUNITIES: Community[] = [
  { id: '1', name: 'ビジネスリーダー', thumbnail: '💼', participantCount: 1234, conversationCount: 567 },
  { id: '2', name: 'クリエイティブ', thumbnail: '🎨', participantCount: 892, conversationCount: 423 },
  { id: '3', name: 'ウェルネス', thumbnail: '🧘', participantCount: 654, conversationCount: 312 },
];

export default function CommunityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isPro = useIsPro();
  const [language, setLanguage] = useState<Language>('jp');

  const handleUpgradeToPro = () => {
    router.push('/(paywall)' as Href);
  };

  return (
    <CosmicBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AltMe</Text>
            {/* Language Switcher */}
            <View style={styles.languageSwitcher}>
              <Pressable
                style={[
                  styles.languageButton,
                  language === 'jp' ? styles.languageButtonActive : styles.languageButtonInactive,
                ]}
                onPress={() => setLanguage('jp')}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    language === 'jp' ? styles.languageButtonTextActive : styles.languageButtonTextInactive,
                  ]}
                >
                  JP
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.languageButton,
                  language === 'en' ? styles.languageButtonActive : styles.languageButtonInactive,
                ]}
                onPress={() => setLanguage('en')}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    language === 'en' ? styles.languageButtonTextActive : styles.languageButtonTextInactive,
                  ]}
                >
                  EN
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Popular Communities Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>人気のコミュニティ</Text>
            <Pressable style={styles.addButton} onPress={() => router.push('/community-create' as Href)}>
              <Feather name="plus" size={20} color={colors.primary} />
            </Pressable>
          </View>

          {/* Community Cards */}
          {MOCK_COMMUNITIES.map((community) => (
            <Pressable key={community.id} style={styles.communityCardWrapper}>
              <View style={styles.communityCard}>
                <View style={styles.communityThumbnail}>
                  <Text style={styles.communityThumbnailText}>{community.thumbnail}</Text>
                </View>
                <View style={styles.communityInfo}>
                  <Text style={styles.communityName}>{community.name}</Text>
                  <View style={styles.communityStats}>
                    <View style={styles.communityStat}>
                      <Feather name="users" size={14} color={colors.textSecondary} />
                      <Text style={styles.communityStatText}>{community.participantCount}</Text>
                    </View>
                    <View style={styles.communityStat}>
                      <Feather name="message-circle" size={14} color={colors.textSecondary} />
                      <Text style={styles.communityStatText}>{community.conversationCount}</Text>
                    </View>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={colors.textTertiary} />
              </View>
            </Pressable>
          ))}

          {/* Pro Upgrade Banner */}
          {!isPro && (
            <GlassCard style={styles.proUpgradeBanner}>
              <Text style={styles.proUpgradeTitle}>
                Proメンバーになってもっと楽しもう
              </Text>
              <Text style={styles.proUpgradeSubtitle}>
                すべてのコミュニティに参加できます
              </Text>
              <GoldButton
                title="Proにアップグレード"
                onPress={handleUpgradeToPro}
                style={styles.proUpgradeButton}
              />
            </GlassCard>
          )}

          {/* Guest Banner */}
          {!isAuthenticated && (
            <View style={styles.guestBanner}>
              <Feather name="eye" size={16} color={colors.textSecondary} />
              <Text style={styles.guestBannerText}>
                {t('community.guestBanner')}
              </Text>
            </View>
          )}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  languageSwitcher: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  languageButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  languageButtonActive: {
    backgroundColor: colors.primary,
  },
  languageButtonInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF25',
  },
  languageButtonText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
  },
  languageButtonTextActive: {
    color: colors.textInverse,
  },
  languageButtonTextInactive: {
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
  addButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityCardWrapper: {
    marginBottom: spacing.md,
  },
  communityCard: {
    backgroundColor: '#FFFFFF08',
    borderColor: '#7DD3FC40',
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  communityThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityThumbnailText: {
    fontSize: 24,
  },
  communityInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  communityName: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
  communityStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  communityStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  communityStatText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  proUpgradeBanner: {
    padding: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  proUpgradeTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  proUpgradeSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  proUpgradeButton: {
    marginTop: spacing.xs,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFFFFF0A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  guestBannerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
});
