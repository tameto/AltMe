import { StyleSheet, View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { PurchasesPackage } from 'react-native-purchases';
import Feather from '@expo/vector-icons/Feather';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '@/src/config/theme';
import { PRICING } from '@/src/config/constants';
import { useSubscription } from '@/src/shared/hooks/use-subscription';
import { useUser } from '@/src/shared/hooks/use-user';
import { hasNeverPurchased } from '@/src/services/revenuecat/client';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GoldButton } from '@/src/shared/components/gold-button';

const INTRO_OFFER_DURATION_MS = PRICING.INTRO_OFFER_HOURS * 60 * 60 * 1000;

type PlanId = 'intro_annual' | 'annual' | 'monthly';

const FEATURE_KEYS = [
  'subscription.paywall.featuresList.dedicatedTwin',
  'subscription.paywall.featuresList.personalityAnalysis',
  'subscription.paywall.featuresList.journalReflection',
  'subscription.paywall.featuresList.emotionTracking',
  'subscription.paywall.featuresList.aiInsights',
  'subscription.paywall.featuresList.unlimitedChat',
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
    <CosmicBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Close button */}
        <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={12}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Crown icon */}
          <Feather name="award" size={64} color="#D4A853" style={styles.crownIcon} />

          {/* Title */}
          <Text style={styles.title}>{t('subscription.paywall.subtitle')}</Text>

          {/* Countdown (intro offer) */}
          {showIntroOffer && (
            <Text style={styles.countdown}>
              初回限定 残り {formatCountdown(remainingMs)}
            </Text>
          )}

          {/* Feature list */}
          <View style={styles.featureList}>
            {FEATURE_KEYS.map((key) => (
              <View key={key} style={styles.featureRow}>
                <Feather name="check" size={20} color="#7DD3FC" />
                <Text style={styles.featureLabel}>{t(key)}</Text>
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
                  <View style={[styles.radioOuter, selectedPlan === 'intro_annual' && styles.radioOuterSelected]}>
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
                  <Text style={styles.discountBadge}>{introDiscount}%OFF</Text>
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
                <View style={[styles.radioOuter, selectedPlan === 'annual' && styles.radioOuterSelected]}>
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
                <View style={[styles.radioOuter, selectedPlan === 'monthly' && styles.radioOuterSelected]}>
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

          {/* CTA button */}
          <GoldButton
            title={isPurchasing ? t('subscription.paywall.processing') : t('subscription.paywall.startTrial')}
            onPress={handlePurchase}
            disabled={isLoading}
            loading={isPurchasing}
            style={styles.ctaButton}
          />

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
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.md,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 32,
    color: '#94A3B8',
    lineHeight: 36,
    fontFamily: fontFamily.regular,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },

  // Crown icon
  crownIcon: {
    marginBottom: spacing.md,
  },

  // Title
  title: {
    fontSize: 28,
    fontFamily: fontFamily.bold,
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  // Countdown
  countdown: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    color: '#EF4444',
    fontVariant: ['tabular-nums'],
    marginBottom: spacing.lg,
  },

  // Feature list
  featureList: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureLabel: {
    fontSize: fontSize.md,
    color: '#F8FAFC',
    fontFamily: fontFamily.regular,
    flex: 1,
  },

  // Plans
  plans: {
    alignSelf: 'stretch',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  planCard: {
    backgroundColor: '#FFFFFF08',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
    overflow: 'visible',
  },
  planCardSelected: {
    borderColor: '#7DD3FC',
    borderWidth: 2,
    backgroundColor: '#7DD3FC0A',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#7DD3FC',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7DD3FC',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: '#94A3B8',
    marginBottom: 2,
  },
  planPrice: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: '#F8FAFC',
  },
  planPerMonth: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Intro offer badge
  introBadge: {
    position: 'absolute',
    top: -10,
    left: spacing.md,
    backgroundColor: '#7DD3FC',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  introBadgeText: {
    color: '#0F172A',
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
    letterSpacing: 0.5,
  },
  discountBadge: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    color: '#7DD3FC',
  },

  // CTA
  ctaButton: {
    alignSelf: 'stretch',
    marginBottom: spacing.md,
  },

  // Restore
  restoreButton: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  restoreText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },

  // Legal
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legalLink: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#64748B',
  },
});
