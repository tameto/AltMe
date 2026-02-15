import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';

import { colors, spacing, fontSize, borderRadius } from '@/src/config/theme';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';

export default function CommunityScreen() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <FontAwesome name="users" size={48} color={colors.primaryLight} />
        <Text style={styles.title}>{t('community.title')}</Text>
        <Text style={styles.subtitle}>{t('community.subtitle')}</Text>
        {!isAuthenticated && (
          <View style={styles.guestBanner}>
            <FontAwesome name="eye" size={14} color={colors.textSecondary} />
            <Text style={styles.guestBannerText}>
              {t('community.guestBanner')}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  guestBannerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
