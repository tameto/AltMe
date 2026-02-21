import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';
import { useRouter, type Href } from 'expo-router';

import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GoldButton } from '@/src/shared/components/gold-button';
import { colors, spacing, fontSize, fontFamily, borderRadius } from '@/src/config/theme';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import { useIsPro } from '@/src/shared/hooks/use-subscription';
import { useCommunities } from '@/src/features/community/hooks/use-communities';
import type { Community } from '@/src/services/community/client';

type Language = 'jp' | 'en';

export default function CommunityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isPro = useIsPro();
  const [language, setLanguage] = useState<Language>('jp');

  const { communities, isLoading, isRefreshing, refresh } = useCommunities();

  const handleUpgradeToPro = () => {
    router.push('/(paywall)' as Href);
  };

  const renderCommunity = ({ item }: { item: Community }) => (
    <Pressable style={styles.communityCard} onPress={() => router.push(`/community/${item.id}` as Href)}>
      <View style={styles.communityThumbnail}>
        <Feather name="users" size={28} color={colors.textSecondary} />
      </View>
      <View style={styles.communityInfo}>
        <Text style={styles.communityName}>{item.name}</Text>
        <Text style={styles.communityStatText}>{'👥 '}{item.memberCount}{t('community.memberCount')}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#7DD3FC60" />
    </Pressable>
  );

  const ListHeader = (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AltMe</Text>
        {/* Language Switcher */}
        <View style={styles.languageSwitcher}>
          <Pressable onPress={() => setLanguage('jp')}>
            <Text style={[styles.languageButtonText, language === 'jp' ? styles.languageTextActive : styles.languageTextInactive]}>
              JP
            </Text>
          </Pressable>
          <Text style={styles.languageSeparator}>/</Text>
          <Pressable onPress={() => setLanguage('en')}>
            <Text style={[styles.languageButtonText, language === 'en' ? styles.languageTextActive : styles.languageTextInactive]}>
              EN
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Popular Communities Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('community.popularTitle')}</Text>
        <Pressable style={styles.addButton} onPress={() => router.push('/community-create' as Href)}>
          <Feather name="plus" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : null}
    </>
  );

  const ListFooter = (
    <>
      {/* Pro Upgrade Banner */}
      {!isPro ? (
        <View style={styles.proUpgradeBanner}>
          <Text style={styles.proUpgradeTitle}>
            {t('community.proBannerTitle')}
          </Text>
          <GoldButton
            title={t('community.proBannerCta')}
            onPress={handleUpgradeToPro}
            style={styles.proUpgradeButton}
          />
        </View>
      ) : null}

      {/* Guest Banner */}
      {!isAuthenticated ? (
        <View style={styles.guestBanner}>
          <Feather name="eye" size={16} color={colors.textSecondary} />
          <Text style={styles.guestBannerText}>
            {t('community.guestBanner')}
          </Text>
        </View>
      ) : null}
    </>
  );

  return (
    <CosmicBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <FlatList
          data={communities}
          keyExtractor={(item) => item.id}
          renderItem={renderCommunity}
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
        />
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
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  languageSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFFFFF10',
    borderWidth: 1,
    borderColor: '#FFFFFF20',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  languageButtonText: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
  },
  languageTextActive: {
    color: '#00D4FF',
  },
  languageTextInactive: {
    color: '#64748B',
  },
  languageSeparator: {
    fontSize: 14,
    color: '#64748B',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  addButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginVertical: spacing.lg,
  },
  communityCard: {
    backgroundColor: '#FFFFFF08',
    borderColor: '#7DD3FC40',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  communityThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#FFFFFF15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityInfo: {
    flex: 1,
    gap: 4,
  },
  communityName: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
  communityStatText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  proUpgradeBanner: {
    backgroundColor: '#FFFFFF08',
    borderWidth: 1.5,
    borderColor: '#D4A85360',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  proUpgradeTitle: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
    textAlign: 'center',
  },
  proUpgradeButton: {
    width: 220,
    height: 44,
    borderRadius: 22,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFFFFF0A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  guestBannerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
});
