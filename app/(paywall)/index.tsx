import { StyleSheet, View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { PurchasesPackage } from 'react-native-purchases';
import { colors, spacing, fontSize, borderRadius } from '@/src/config/theme';
import { PRICING } from '@/src/config/constants';
import { useSubscription } from '@/src/shared/hooks/use-subscription';
import { useUser } from '@/src/shared/hooks/use-user';
import { hasNeverPurchased } from '@/src/services/revenuecat/client';

const INTRO_OFFER_DURATION_MS = PRICING.INTRO_OFFER_HOURS * 60 * 60 * 1000;

type PlanId = 'intro_annual' | 'annual' | 'monthly';

const FEATURE_KEYS = [
  { icon: '✨', key: 'subscription.paywall.featuresList.dedicatedTwin' },
  { icon: '🧠', key: 'subscription.paywall.featuresList.personalityAnalysis' },
  { icon: '📓', key: 'subscription.paywall.featuresList.journalReflection' },
  { icon: '📈', key: 'subscription.paywall.featuresList.emotionTracking' },
  { icon: '💡', key: 'subscription.paywall.featuresList.aiInsights' },
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
  const { t } = useTranslation();
  const { purchase, restore, loadOfferings, offerings, isLoading } = useSubscription();
  const createdAt = useUser((s) => s.user?.createdAt);

  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual');
  const [showIntroOffer, setShowIntroOffer] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const signupTimeRef = useRef<number | null>(null);

  // Load offerings on mount
  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

  // Check intro offer eligibility (AC-3: profiles.created_at < 24h AND never purchased)
  useEffect(() => {
    const checkIntroEligibility = async () => {
      try {
        if (!createdAt) {
          setShowIntroOffer(false);
          return;
        }

        const signupTime = new Date(createdAt).getTime();
        signupTimeRef.current = signupTime;
        const elapsed = Date.now() - signupTime;
        const remaining = INTRO_OFFER_DURATION_MS - elapsed;

        if (remaining <= 0) {
          setShowIntroOffer(false);
          return;
        }

        // Check RevenueCat purchase history (Q4: use SDK)
        const neverPurchased = await hasNeverPurchased();
        if (!neverPurchased) {
          setShowIntroOffer(false);
          return;
        }

        setRemainingMs(remaining);
        setShowIntroOffer(true);
        setSelectedPlan('intro_annual');
      } catch {
        setShowIntroOffer(false);
      }
    };

    checkIntroEligibility();
  }, [createdAt]);

  // Countdown timer (server-based, tamper-resistant per AC-3)
  useEffect(() => {
    if (!showIntroOffer) return;

    const timer = setInterval(() => {
      if (signupTimeRef.current === null) return;

      const elapsed = Date.now() - signupTimeRef.current;
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
      Alert.alert(t('subscription.paywall.errorTitle'), t('subscription.paywall.errorLoadPlan'));
      return;
    }

    setIsPurchasing(true);
    try {
      const success = await purchase(pkg);
      if (success) {
        router.back();
      }
    } catch (error) {
      Alert.alert(t('subscription.paywall.purchaseErrorTitle'), t('subscription.paywall.purchaseError'));
    } finally {
      setIsPurchasing(false);
    }
  }, [getSelectedPackage, purchase, router]);

  const handleRestore = useCallback(async () => {
    setIsRestoring(true);
    try {
      const success = await restore();
      if (success) {
        Alert.alert(t('subscription.paywall.restoreCompleteTitle'), t('subscription.paywall.restoreComplete'), [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert(t('subscription.paywall.restoreResultTitle'), t('subscription.paywall.restoreNoResult'));
      }
    } catch {
      Alert.alert(t('subscription.paywall.errorTitle'), t('subscription.paywall.restoreError'));
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
        <Text style={styles.title}>✨ {t('subscription.paywall.subtitle')}</Text>

        {/* Feature list */}
        <View style={styles.featureList}>
          {FEATURE_KEYS.map((feature) => (
            <View key={feature.key} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureLabel}>{t(feature.key)}</Text>
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
                <Text style={styles.introBadgeText}>{t('subscription.paywall.firstTimeOffer')}</Text>
              </View>
              <View style={styles.planHeader}>
                <View style={styles.radioOuter}>
                  {selectedPlan === 'intro_annual' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planPrice}>
                    ¥{PRICING.ANNUAL_INTRO.toLocaleString()}{t('subscription.paywall.perYear')}
                  </Text>
                  <Text style={styles.planPerMonth}>
                    {t('subscription.paywall.perMonthParens', { price: Math.round(PRICING.ANNUAL_INTRO / 12).toLocaleString() })}
                  </Text>
                </View>
                <Text style={styles.discountBadge}>{t('subscription.paywall.discountOff', { percent: introDiscount })}</Text>
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
                <Text style={styles.planName}>{t('subscription.paywall.plans.yearly')}</Text>
                <Text style={styles.planPrice}>
                  ¥{PRICING.ANNUAL.toLocaleString()}{t('subscription.paywall.perYear')}
                </Text>
                <Text style={styles.planPerMonth}>
                  {t('subscription.paywall.perMonthParens', { price: Math.round(PRICING.ANNUAL / 12).toLocaleString() })}
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
                <Text style={styles.planName}>{t('subscription.paywall.plans.monthly')}</Text>
                <Text style={styles.planPrice}>
                  ¥{PRICING.MONTHLY.toLocaleString()}{t('subscription.paywall.monthlyUnit')}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Trial info */}
        <Text style={styles.trialInfo}>{t('subscription.paywall.trialLabel')}</Text>

        {/* CTA button */}
        <Pressable
          style={[styles.ctaButton, (isPurchasing || isLoading) && styles.ctaButtonDisabled]}
          onPress={handlePurchase}
          disabled={isPurchasing || isLoading}
        >
          <Text style={styles.ctaButtonText}>
            {isPurchasing ? t('subscription.paywall.processing') : t('subscription.paywall.startTrial')}
          </Text>
        </Pressable>

        {/* Restore */}
        <Pressable onPress={handleRestore} disabled={isRestoring} style={styles.restoreButton}>
          <Text style={styles.restoreText}>
            {isRestoring ? t('subscription.paywall.restoring') : t('subscription.paywall.restore')}
          </Text>
        </Pressable>

        {/* Terms | Privacy */}
        <View style={styles.legalRow}>
          <Pressable>
            <Text style={styles.legalLink}>{t('subscription.paywall.termsOfService')}</Text>
          </Pressable>
          <Text style={styles.legalSeparator}>|</Text>
          <Pressable>
            <Text style={styles.legalLink}>{t('subscription.paywall.privacy')}</Text>
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
    backgroundColor: colors.primary + '0A',
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
