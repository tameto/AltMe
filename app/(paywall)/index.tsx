import { StyleSheet, View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PurchasesPackage } from 'react-native-purchases';
import { colors, spacing, fontSize, borderRadius } from '@/src/config/theme';
import { PRICING } from '@/src/config/constants';
import { useSubscription } from '@/src/shared/hooks/use-subscription';

const INSTALL_TIME_KEY = 'install_time';
const INTRO_OFFER_DURATION_MS = PRICING.INTRO_OFFER_HOURS * 60 * 60 * 1000;

type PlanId = 'intro_annual' | 'annual' | 'monthly';

const FEATURES = [
  { icon: '✨', label: '専用AIツイン（無制限チャット）' },
  { icon: '🧠', label: '詳細性格分析' },
  { icon: '📓', label: '日記 + AI振り返り' },
  { icon: '📈', label: '感情トラッキング' },
  { icon: '💡', label: 'AI洞察レポート' },
] as const;

const formatCountdown = (ms: number): string => {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function PaywallScreen() {
  const router = useRouter();
  const { purchase, restore, loadOfferings, offerings, isLoading } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanId>('intro_annual');
  const [showIntroOffer, setShowIntroOffer] = useState(true);
  const [remainingMs, setRemainingMs] = useState(INTRO_OFFER_DURATION_MS);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const installTimeRef = useRef<number | null>(null);

  // Load offerings on mount
  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

  // Initialize install time and intro offer state
  useEffect(() => {
    const initInstallTime = async () => {
      try {
        const stored = await AsyncStorage.getItem(INSTALL_TIME_KEY);
        let installTime: number;

        if (stored) {
          installTime = parseInt(stored, 10);
        } else {
          installTime = Date.now();
          await AsyncStorage.setItem(INSTALL_TIME_KEY, installTime.toString());
        }

        installTimeRef.current = installTime;
        const elapsed = Date.now() - installTime;
        const remaining = INTRO_OFFER_DURATION_MS - elapsed;

        if (remaining <= 0) {
          setShowIntroOffer(false);
          setSelectedPlan('annual');
        } else {
          setRemainingMs(remaining);
          setShowIntroOffer(true);
        }
      } catch {
        setShowIntroOffer(false);
        setSelectedPlan('annual');
      }
    };

    initInstallTime();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!showIntroOffer) return;

    const timer = setInterval(() => {
      if (installTimeRef.current === null) return;

      const elapsed = Date.now() - installTimeRef.current;
      const remaining = INTRO_OFFER_DURATION_MS - elapsed;

      if (remaining <= 0) {
        setRemainingMs(0);
        setShowIntroOffer(false);
        setSelectedPlan((current) => (current === 'intro_annual' ? 'annual' : current));
        clearInterval(timer);
      } else {
        setRemainingMs(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [showIntroOffer]);

  const getSelectedPackage = useCallback((): PurchasesPackage | null => {
    if (!offerings?.current?.availablePackages) return null;

    const packages = offerings.current.availablePackages;
    switch (selectedPlan) {
      case 'intro_annual':
        return packages.find((p) => p.identifier === 'intro_annual') ?? null;
      case 'annual':
        return packages.find((p) => p.identifier === '$rc_annual') ?? null;
      case 'monthly':
        return packages.find((p) => p.identifier === '$rc_monthly') ?? null;
      default:
        return null;
    }
  }, [offerings, selectedPlan]);

  const handlePurchase = useCallback(async () => {
    const pkg = getSelectedPackage();
    if (!pkg) {
      Alert.alert('エラー', 'プランの取得に失敗しました。もう一度お試しください。');
      return;
    }

    setIsPurchasing(true);
    try {
      const success = await purchase(pkg);
      if (success) {
        router.back();
      }
    } catch (error) {
      Alert.alert('購入エラー', '購入処理中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsPurchasing(false);
    }
  }, [getSelectedPackage, purchase, router]);

  const handleRestore = useCallback(async () => {
    setIsRestoring(true);
    try {
      const success = await restore();
      if (success) {
        Alert.alert('復元完了', '購入情報を復元しました。', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('復元結果', '復元可能な購入情報が見つかりませんでした。');
      }
    } catch {
      Alert.alert('エラー', '復元処理中にエラーが発生しました。');
    } finally {
      setIsRestoring(false);
    }
  }, [restore, router]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const introDiscount = Math.round(
    (1 - PRICING.ANNUAL_INTRO / (PRICING.MONTHLY * 12)) * 100,
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Close button */}
      <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={12}>
        <Text style={styles.closeText}>×</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>✨ AIツインの全機能を解放</Text>

        {/* Feature list */}
        <View style={styles.featureList}>
          {FEATURES.map((feature) => (
            <View key={feature.label} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureLabel}>{feature.label}</Text>
            </View>
          ))}
        </View>

        {/* Plan options */}
        <View style={styles.plans}>
          {/* FIRST TIME OFFER */}
          {showIntroOffer && (
            <Pressable
              style={[
                styles.planCard,
                selectedPlan === 'intro_annual' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('intro_annual')}
            >
              <View style={styles.introBadge}>
                <Text style={styles.introBadgeText}>FIRST TIME OFFER</Text>
              </View>
              <View style={styles.planHeader}>
                <View style={styles.radioOuter}>
                  {selectedPlan === 'intro_annual' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planPrice}>
                    ¥{PRICING.ANNUAL_INTRO.toLocaleString()}/年
                  </Text>
                  <Text style={styles.planPerMonth}>
                    (¥{Math.round(PRICING.ANNUAL_INTRO / 12).toLocaleString()}/月)
                  </Text>
                </View>
                <Text style={styles.discountBadge}>{introDiscount}% OFF</Text>
              </View>
              <View style={styles.countdownRow}>
                <Text style={styles.countdownIcon}>⏰</Text>
                <Text style={styles.countdownTimer}>{formatCountdown(remainingMs)}</Text>
              </View>
            </Pressable>
          )}

          {/* Annual */}
          <Pressable
            style={[
              styles.planCard,
              selectedPlan === 'annual' && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan('annual')}
          >
            <View style={styles.planHeader}>
              <View style={styles.radioOuter}>
                {selectedPlan === 'annual' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>年額</Text>
                <Text style={styles.planPrice}>
                  ¥{PRICING.ANNUAL.toLocaleString()}/年
                </Text>
                <Text style={styles.planPerMonth}>
                  (¥{Math.round(PRICING.ANNUAL / 12).toLocaleString()}/月)
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Monthly */}
          <Pressable
            style={[
              styles.planCard,
              selectedPlan === 'monthly' && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.planHeader}>
              <View style={styles.radioOuter}>
                {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>月額</Text>
                <Text style={styles.planPrice}>
                  ¥{PRICING.MONTHLY.toLocaleString()}/月
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Trial info */}
        <Text style={styles.trialInfo}>3日間無料トライアル</Text>

        {/* CTA button */}
        <Pressable
          style={[styles.ctaButton, (isPurchasing || isLoading) && styles.ctaButtonDisabled]}
          onPress={handlePurchase}
          disabled={isPurchasing || isLoading}
        >
          <Text style={styles.ctaButtonText}>
            {isPurchasing ? '処理中...' : '無料トライアルを開始'}
          </Text>
        </Pressable>

        {/* Restore */}
        <Pressable onPress={handleRestore} disabled={isRestoring} style={styles.restoreButton}>
          <Text style={styles.restoreText}>
            {isRestoring ? '復元中...' : '購入を復元'}
          </Text>
        </Pressable>

        {/* Terms | Privacy */}
        <View style={styles.legalRow}>
          <Pressable>
            <Text style={styles.legalLink}>利用規約</Text>
          </Pressable>
          <Text style={styles.legalSeparator}>|</Text>
          <Pressable>
            <Text style={styles.legalLink}>プライバシー</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    left: spacing.md,
    zIndex: 10,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 28,
    color: colors.textSecondary,
    lineHeight: 32,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },

  // Title
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // Feature list
  featureList: {
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  featureIcon: {
    fontSize: fontSize.lg,
    width: 32,
    textAlign: 'center',
  },
  featureLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },

  // Plans
  plans: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  planCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'visible',
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#7C3AED0A',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  planPrice: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  planPerMonth: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Intro offer badge
  introBadge: {
    position: 'absolute',
    top: -12,
    left: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  introBadgeText: {
    color: colors.textInverse,
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  discountBadge: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.success,
    marginLeft: spacing.sm,
  },

  // Countdown
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginLeft: 30,
  },
  countdownIcon: {
    fontSize: fontSize.sm,
    marginRight: spacing.xs,
  },
  countdownTimer: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.error,
    fontVariant: ['tabular-nums'],
  },

  // Trial info
  trialInfo: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },

  // CTA
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: spacing.md,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },

  // Restore
  restoreButton: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  restoreText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },

  // Legal
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legalLink: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
