import { StyleSheet, View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { PurchasesPackage } from 'react-native-purchases';
import Feather from '@expo/vector-icons/Feather';
import { spacing, fontSize, fontFamily } from '@/src/config/theme';
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
    } catch {
      Alert.alert(t('subscription.paywall.purchaseErrorTitle'), t('subscription.paywall.purchaseError'));
    } finally {
      setIsPurchasing(false);
    }
  }, [getSelectedPackage, purchase, router, t]);

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
  }, [restore, router, t]);

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
          <Feather name="x" size={24} color="rgba(255,255,255,0.38)" />
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Crown icon container */}
          <View style={styles.crownContainer}>
            <Feather name="award" size={36} color="#D4A853" />
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('subscription.paywall.subtitle')}</Text>

          {/* Countdown (intro offer) */}
          {showIntroOffer && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdown}>
                🔥 初回限定: 残り {formatCountdown(remainingMs)}
              </Text>
            </View>
          )}

          {/* Feature list */}
          <View style={styles.featureList}>
            {FEATURE_KEYS.map((key) => (
              <View key={key} style={styles.featureRow}>
                <Feather name="check" size={18} color="#7DD3FC" />
                <Text style={styles.featureLabel}>{t(key)}</Text>
              </View>
            ))}
          </View>

          {/* Plan options — 3 cards horizontal */}
          <View style={styles.plans}>
            {/* Monthly */}
            <Pressable
              style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <Text style={styles.planName}>{t('subscription.paywall.plans.monthly')}</Text>
              <Text style={styles.planPrice}>¥{PRICING.MONTHLY.toLocaleString()}</Text>
              <Text style={styles.planUnit}>/月</Text>
            </Pressable>

            {/* Annual */}
            <Pressable
              style={[styles.planCard, selectedPlan === 'annual' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('annual')}
            >
              <Text style={styles.planName}>{t('subscription.paywall.plans.yearly')}</Text>
              <Text style={styles.planPrice}>¥{PRICING.ANNUAL.toLocaleString()}</Text>
              <Text style={styles.planUnit}>¥{Math.round(PRICING.ANNUAL / 12).toLocaleString()}/月 (33%OFF)</Text>
            </Pressable>

            {/* First Time Offer (intro annual) */}
            {showIntroOffer && (
              <Pressable
                style={[styles.planCard, styles.planCardIntro, selectedPlan === 'intro_annual' && styles.planCardIntroSelected]}
                onPress={() => setSelectedPlan('intro_annual')}
              >
                <Text style={styles.planNameIntro}>{t('subscription.paywall.firstTimeOffer')}</Text>
                <Text style={styles.planPriceIntro}>¥{PRICING.ANNUAL_INTRO.toLocaleString()}</Text>
                <Text style={styles.planUnitIntro}>¥{Math.round(PRICING.ANNUAL_INTRO / 12).toLocaleString()}/月 ({introDiscount}%OFF)</Text>
              </Pressable>
            )}
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

          {/* Legal note */}
          <Text style={styles.legalNote}>{t('subscription.paywall.trialNote')}</Text>

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
  content: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    gap: 16,
  },

  // Crown container
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212,168,83,0.13)',
    borderWidth: 2,
    borderColor: 'rgba(212,168,83,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Title
  title: {
    fontSize: 26,
    fontFamily: fontFamily.bold,
    color: '#F8FAFC',
    textAlign: 'center',
  },

  // Countdown
  countdownContainer: {
    borderRadius: 999,
    backgroundColor: 'rgba(239,68,68,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  countdown: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: '#FCA5A5',
    fontVariant: ['tabular-nums'],
  },

  // Feature list
  featureList: {
    alignSelf: 'stretch',
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: fontFamily.regular,
    flex: 1,
  },

  // Plans — horizontal row
  plans: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 10,
  },
  planCard: {
    flex: 1,
    backgroundColor: '#FFFFFF08',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF20',
    alignItems: 'center',
    gap: 4,
  },
  planCardSelected: {
    borderColor: '#7DD3FC',
    borderWidth: 1.5,
    backgroundColor: '#7DD3FC0A',
  },
  planName: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: 'rgba(255,255,255,0.5)',
  },
  planPrice: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    color: '#F8FAFC',
  },
  planUnit: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.38)',
    textAlign: 'center',
  },
  // Intro plan overrides
  planCardIntro: {
    backgroundColor: 'rgba(125,211,252,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(125,211,252,0.31)',
  },
  planCardIntroSelected: {
    borderColor: '#7DD3FC',
    borderWidth: 2,
  },
  planNameIntro: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: '#7DD3FC',
  },
  planPriceIntro: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    color: '#7DD3FC',
  },
  planUnitIntro: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(125,211,252,0.8)',
    textAlign: 'center',
  },

  // CTA
  ctaButton: {
    alignSelf: 'stretch',
    marginBottom: spacing.md,
  },

  // Restore
  restoreButton: {
    paddingVertical: spacing.sm,
  },
  restoreText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#7DD3FC',
  },

  // Legal note
  legalNote: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.31)',
    textAlign: 'center',
  },

  // Legal
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legalLink: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.25)',
  },
  legalSeparator: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.25)',
  },
});
