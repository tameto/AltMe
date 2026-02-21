import { Platform, StyleSheet, View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { SubscriptionPackage } from '@/src/shared/types/subscription';
import Feather from '@expo/vector-icons/Feather';
import { spacing, fontSize, fontFamily } from '@/src/config/theme';
import { PRICING } from '@/src/config/constants';
import { useSubscription } from '@/src/shared/hooks/use-subscription';
import { useUser } from '@/src/shared/hooks/use-user';
import { hasNeverPurchased } from '@/src/services/revenuecat/client';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GoldButton } from '@/src/shared/components/gold-button';
import { redirectToCheckout } from '@/src/services/stripe/client';

const INTRO_OFFER_DURATION_MS = PRICING.INTRO_OFFER_HOURS * 60 * 60 * 1000;

// Stripe price ID は環境変数から動的に取得（テスト時に上書き可能にするため関数化）
const getStripePriceId = (plan: 'monthly' | 'annual'): string =>
  plan === 'monthly'
    ? (process.env.EXPO_PUBLIC_STRIPE_MONTHLY_PRICE_ID ?? '')
    : (process.env.EXPO_PUBLIC_STRIPE_YEARLY_PRICE_ID ?? '');

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

// ---- Web 専用ペイウォール ----

export function WebPaywallScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePurchase = async () => {
    const priceId = getStripePriceId(selectedPlan);
    if (!priceId) {
      setErrorMessage('価格情報を取得できませんでした。');
      return;
    }

    setIsPurchasing(true);
    setErrorMessage(null);
    try {
      await redirectToCheckout(priceId);
    } catch (err) {
      const message = err instanceof Error ? err.message : '決済処理に失敗しました';
      setErrorMessage(message);
      setIsPurchasing(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <CosmicBackground>
      <View style={webStyles.wrapper} testID="paywall-web-screen">
        <View style={webStyles.card}>
          {/* Close button */}
          <Pressable style={webStyles.closeButton} onPress={handleClose} hitSlop={12} testID="paywall-close-button">
            <Feather name="x" size={24} color="rgba(255,255,255,0.38)" />
          </Pressable>

          {/* Crown icon */}
          <View style={webStyles.crownContainer}>
            <Feather name="award" size={36} color="#D4A853" />
          </View>

          {/* Title */}
          <Text style={webStyles.title}>{t('subscription.paywall.subtitle')}</Text>
          <Text style={webStyles.subtitle}>{'AltMe Pro で AI ツインを起動しよう'}</Text>

          {/* Feature list */}
          <View style={webStyles.featureList}>
            {FEATURE_KEYS.map((key) => (
              <View key={key} style={webStyles.featureRow}>
                <Feather name="check" size={16} color="#7DD3FC" />
                <Text style={webStyles.featureLabel}>{t(key)}</Text>
              </View>
            ))}
          </View>

          {/* Plan selector */}
          <View style={webStyles.plans} testID="paywall-plan-selector">
            {/* Monthly */}
            <Pressable
              style={[webStyles.planCard, selectedPlan === 'monthly' && webStyles.planCardSelected]}
              onPress={() => setSelectedPlan('monthly')}
              testID="plan-monthly"
            >
              <Text style={webStyles.planName}>{t('subscription.paywall.plans.monthly')}</Text>
              <Text style={webStyles.planPrice}>{'¥' + PRICING.MONTHLY.toLocaleString()}</Text>
              <Text style={webStyles.planUnit}>{'/月'}</Text>
            </Pressable>

            {/* Annual */}
            <Pressable
              style={[webStyles.planCard, selectedPlan === 'annual' && webStyles.planCardSelected]}
              onPress={() => setSelectedPlan('annual')}
              testID="plan-annual"
            >
              <View style={webStyles.badgeContainer}>
                <Text style={webStyles.badge}>{'33% OFF'}</Text>
              </View>
              <Text style={webStyles.planName}>{t('subscription.paywall.plans.yearly')}</Text>
              <Text style={webStyles.planPrice}>{'¥' + PRICING.ANNUAL.toLocaleString()}</Text>
              <Text style={webStyles.planUnit}>{'¥' + Math.round(PRICING.ANNUAL / 12).toLocaleString() + '/月'}</Text>
            </Pressable>
          </View>

          {/* Error message */}
          {errorMessage && (
            <Text style={webStyles.errorText} testID="paywall-error-message">{errorMessage}</Text>
          )}

          {/* CTA button */}
          <GoldButton
            title={isPurchasing ? t('subscription.paywall.processing') : t('subscription.paywall.startTrial')}
            onPress={handlePurchase}
            disabled={isPurchasing}
            loading={isPurchasing}
            style={webStyles.ctaButton}
            testID="paywall-purchase-button"
          />

          {/* Legal note */}
          <Text style={webStyles.legalNote}>{t('subscription.paywall.trialNote')}</Text>

          {/* Terms | Privacy */}
          <View style={webStyles.legalRow}>
            <Pressable>
              <Text style={webStyles.legalLink}>{t('subscription.paywall.termsOfService')}</Text>
            </Pressable>
            <Text style={webStyles.legalSeparator}>{'|'}</Text>
            <Pressable>
              <Text style={webStyles.legalLink}>{t('subscription.paywall.privacy')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </CosmicBackground>
  );
}

// ---- Native ペイウォール（既存実装を維持） ----

function NativePaywallScreen() {
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

  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

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

  const getSelectedPackage = useCallback((): SubscriptionPackage | null => {
    if (!offerings?.current?.packages) return null;

    const packages = offerings.current.packages;
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
        <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={12}>
          <Feather name="x" size={24} color="rgba(255,255,255,0.38)" />
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={styles.crownContainer}>
            <Feather name="award" size={36} color="#D4A853" />
          </View>

          <Text style={styles.title}>{t('subscription.paywall.subtitle')}</Text>

          {showIntroOffer && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdown}>
                {'🔥 初回限定: 残り ' + formatCountdown(remainingMs)}
              </Text>
            </View>
          )}

          <View style={styles.featureList}>
            {FEATURE_KEYS.map((key) => (
              <View key={key} style={styles.featureRow}>
                <Feather name="check" size={18} color="#7DD3FC" />
                <Text style={styles.featureLabel}>{t(key)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.plans}>
            <Pressable
              style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <Text style={styles.planName}>{t('subscription.paywall.plans.monthly')}</Text>
              <Text style={styles.planPrice}>{'¥' + PRICING.MONTHLY.toLocaleString()}</Text>
              <Text style={styles.planUnit}>{'/月'}</Text>
            </Pressable>

            <Pressable
              style={[styles.planCard, selectedPlan === 'annual' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('annual')}
            >
              <Text style={styles.planName}>{t('subscription.paywall.plans.yearly')}</Text>
              <Text style={styles.planPrice}>{'¥' + PRICING.ANNUAL.toLocaleString()}</Text>
              <Text style={styles.planUnit}>{'¥' + Math.round(PRICING.ANNUAL / 12).toLocaleString() + '/月 (33%OFF)'}</Text>
            </Pressable>

            {showIntroOffer && (
              <Pressable
                style={[styles.planCard, styles.planCardIntro, selectedPlan === 'intro_annual' && styles.planCardIntroSelected]}
                onPress={() => setSelectedPlan('intro_annual')}
              >
                <Text style={styles.planNameIntro}>{t('subscription.paywall.firstTimeOffer')}</Text>
                <Text style={styles.planPriceIntro}>{'¥' + PRICING.ANNUAL_INTRO.toLocaleString()}</Text>
                <Text style={styles.planUnitIntro}>{'¥' + Math.round(PRICING.ANNUAL_INTRO / 12).toLocaleString() + '/月 (' + introDiscount + '%OFF)'}</Text>
              </Pressable>
            )}
          </View>

          <GoldButton
            title={isPurchasing ? t('subscription.paywall.processing') : t('subscription.paywall.startTrial')}
            onPress={handlePurchase}
            disabled={isLoading}
            loading={isPurchasing}
            style={styles.ctaButton}
          />

          <Pressable onPress={handleRestore} disabled={isRestoring} style={styles.restoreButton}>
            <Text style={styles.restoreText}>
              {isRestoring ? t('subscription.paywall.restoring') : t('subscription.paywall.restore')}
            </Text>
          </Pressable>

          <Text style={styles.legalNote}>{t('subscription.paywall.trialNote')}</Text>

          <View style={styles.legalRow}>
            <Pressable>
              <Text style={styles.legalLink}>{t('subscription.paywall.termsOfService')}</Text>
            </Pressable>
            <Text style={styles.legalSeparator}>{'|'}</Text>
            <Pressable>
              <Text style={styles.legalLink}>{t('subscription.paywall.privacy')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </CosmicBackground>
  );
}

// ---- エントリポイント: Platform 分岐 ----

export default function PaywallScreen() {
  if (Platform.OS === 'web') {
    return <WebPaywallScreen />;
  }
  return <NativePaywallScreen />;
}

// ---- Web スタイル ----

const webStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'rgba(15,15,30,0.92)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.15)',
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: -8,
  },
  crownContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212,168,83,0.13)',
    borderWidth: 2,
    borderColor: 'rgba(212,168,83,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
    color: '#F8FAFC',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: -8,
  },
  featureList: {
    alignSelf: 'stretch',
    gap: 10,
    marginVertical: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: fontFamily.regular,
    flex: 1,
  },
  plans: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 12,
  },
  planCard: {
    flex: 1,
    backgroundColor: '#FFFFFF08',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF20',
    alignItems: 'center',
    gap: 4,
  },
  planCardSelected: {
    borderColor: '#7DD3FC',
    borderWidth: 2,
    backgroundColor: '#7DD3FC0A',
  },
  badgeContainer: {
    backgroundColor: 'rgba(125,211,252,0.15)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  badge: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: '#7DD3FC',
  },
  planName: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: 'rgba(255,255,255,0.5)',
  },
  planPrice: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    color: '#F8FAFC',
  },
  planUnit: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.38)',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#F87171',
    textAlign: 'center',
  },
  ctaButton: {
    alignSelf: 'stretch',
  },
  legalNote: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.31)',
    textAlign: 'center',
  },
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

// ---- Native スタイル ----

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
  title: {
    fontSize: 26,
    fontFamily: fontFamily.bold,
    color: '#F8FAFC',
    textAlign: 'center',
  },
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
  ctaButton: {
    alignSelf: 'stretch',
    marginBottom: spacing.md,
  },
  restoreButton: {
    paddingVertical: spacing.sm,
  },
  restoreText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#7DD3FC',
  },
  legalNote: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.31)',
    textAlign: 'center',
  },
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
