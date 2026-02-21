import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive } from '@/src/shared/hooks/use-responsive';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';
import { useRouter, type Href } from 'expo-router';

import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GoldButton } from '@/src/shared/components/gold-button';
import { colors, spacing, fontSize, fontFamily, borderRadius } from '@/src/config/theme';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import { useIsPro } from '@/src/shared/hooks/use-subscription';
import { usePageTitle } from '@/src/shared/hooks/use-page-title';
import { useCommunities } from '@/src/features/community/hooks/use-communities';
import { CommunityCard } from '@/src/features/community/components/community-card';
import type { Community } from '@/src/services/community/client';

type Language = 'jp' | 'en';

export default function CommunityScreen() {
  const { t } = useTranslation();
  const { isMobile, isDesktop, isWide } = useResponsive();
  usePageTitle(t('tabs.community'));
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isPro = useIsPro();
  const [language, setLanguage] = useState<Language>('jp');

  const languageForQuery = language === 'jp' ? 'ja' : 'en';
  const { communities, isLoading, isRefreshing, refresh } = useCommunities(languageForQuery);

  const handleUpgradeToPro = () => {
    router.push('/(paywall)' as Href);
  };

  const handleCommunityPress = useCallback(
    (id: string) => {
      router.push(`/community/${id}` as Href);
    },
    [router],
  );

  const numColumns = isWide ? 3 : isDesktop ? 2 : 1;

  const renderCommunity = useCallback(
    ({ item }: { item: Community }) => (
      <View style={numColumns > 1 ? styles.gridItem : undefined}>
        <CommunityCard community={item} onPress={handleCommunityPress} />
      </View>
    ),
    [handleCommunityPress, numColumns],
  );

  const keyExtractor = useCallback((item: Community) => item.id, []);

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

  const Wrapper = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <CosmicBackground>
      <Wrapper style={styles.container} {...(Platform.OS !== 'web' && { edges: ['top'] })}>
        <View style={[styles.innerContent, !isMobile && styles.contentDesktop]}>
          <FlatList
            key={`community-grid-${numColumns}`}
            data={communities}
            keyExtractor={keyExtractor}
            renderItem={renderCommunity}
            numColumns={numColumns}
            contentContainerStyle={styles.content}
            contentInsetAdjustmentBehavior="automatic"
            ListHeaderComponent={ListHeader}
            ListFooterComponent={ListFooter}
            {...(numColumns > 1 && { columnWrapperStyle: styles.columnWrapper })}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refresh}
                tintColor={colors.primary}
              />
            }
          />
        </View>
      </Wrapper>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  innerContent: {
    flex: 1,
  },
  contentDesktop: {
    maxWidth: 960,
    alignSelf: 'center' as const,
    width: '100%' as unknown as number,
  },
  content: {
    paddingVertical: spacing.md,
    paddingHorizontal: 20,
    paddingBottom: spacing.xxl,
    gap: 16,
  },
  columnWrapper: {
    gap: 16,
  },
  gridItem: {
    flex: 1,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
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
