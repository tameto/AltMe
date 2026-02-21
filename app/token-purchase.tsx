import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Feather from '@expo/vector-icons/Feather';

import { colors, spacing, fontSize, fontFamily, borderRadius } from '@/src/config/theme';
import { CREDIT_PACKS } from '@/src/config/constants';
import { redirectToCheckout } from '@/src/services/stripe/client';

type PackKey = keyof typeof CREDIT_PACKS;

const PACKS: { key: PackKey; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { key: 'SMALL', icon: 'zap' },
  { key: 'MEDIUM', icon: 'star' },
  { key: 'LARGE', icon: 'award' },
];

export default function TokenPurchaseModal() {
  const router = useRouter();
  const { t } = useTranslation();
  const [purchasingPack, setPurchasingPack] = useState<PackKey | null>(null);

  const handlePurchase = async (packKey: PackKey) => {
    if (Platform.OS === 'web') {
      try {
        setPurchasingPack(packKey);
        // Stripe price ID は環境変数または定数から取得する想定
        // ここでは packKey をそのまま priceId のマッピングに使用
        const priceId = `credit_${packKey.toLowerCase()}`;
        await redirectToCheckout(priceId);
      } catch (error) {
        Alert.alert(
          t('tokenPurchase.title'),
          t('tokenPurchase.purchaseError'),
        );
      } finally {
        setPurchasingPack(null);
      }
    } else {
      // Native: RevenueCat Consumable (将来実装)
      Alert.alert(
        t('tokenPurchase.title'),
        t('tokenPurchase.nativeComingSoon'),
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="x" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('tokenPurchase.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>{t('tokenPurchase.subtitle')}</Text>

        <View style={styles.packsContainer}>
          {PACKS.map(({ key, icon }) => {
            const pack = CREDIT_PACKS[key];
            const isPurchasing = purchasingPack === key;
            return (
              <Pressable
                key={key}
                style={[styles.packCard, isPurchasing && styles.packCardDisabled]}
                onPress={() => handlePurchase(key)}
                disabled={purchasingPack !== null}
                testID={`pack-${key.toLowerCase()}`}
              >
                <Feather name={icon} size={28} color="#7DD3FC" />
                <Text style={styles.packCredits}>
                  {pack.credits.toLocaleString()} {t('tokenPurchase.credits')}
                </Text>
                <Text style={styles.packPrice}>
                  {Platform.OS === 'web'
                    ? `¥${pack.price.toLocaleString()}`
                    : `¥${pack.price.toLocaleString()}`}
                </Text>
                {isPurchasing ? (
                  <ActivityIndicator size="small" color="#7DD3FC" style={styles.packLoader} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {Platform.OS === 'web' ? (
          <Text style={styles.disclaimer}>
            {t('tokenPurchase.stripeDisclaimer')}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  packsContainer: {
    gap: spacing.md,
  },
  packCard: {
    backgroundColor: '#FFFFFF08',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  packCardDisabled: {
    opacity: 0.6,
  },
  packCredits: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  packPrice: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    color: '#7DD3FC',
  },
  packLoader: {
    marginTop: spacing.xs,
  },
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
