import { StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius } from '@/src/config/theme';
import {
  useOnboardingStore,
  type AvatarStyle,
} from '@/src/features/onboarding/stores/onboarding-store';

const AVATAR_OPTIONS: {
  key: AvatarStyle;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  { key: 'geometric', icon: 'hexagon-outline' },
  { key: 'cosmic', icon: 'creation' },
  { key: 'organic', icon: 'waves' },
  { key: 'techno', icon: 'cpu-64-bit' },
  { key: 'zen', icon: 'leaf' },
];

const TEAL = '#7DD3FC';
const GOLD = '#F59E0B';

export default function ChooseAvatarScreen() {
  const { t } = useTranslation();
  const avatarStyle = useOnboardingStore((s) => s.avatarStyle);
  const setAvatarStyle = useOnboardingStore((s) => s.setAvatarStyle);

  const selectedOption = AVATAR_OPTIONS.find((o) => o.key === avatarStyle);

  const handleNext = () => {
    if (!avatarStyle) return;
    router.push('/(onboarding)/choose-tone');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>
              {'\u2190 '}{t('common.back')}
            </Text>
          </Pressable>
          <Text style={styles.step}>{t('onboarding.avatar.step')}</Text>
        </View>

        <Text style={styles.title}>{t('onboarding.avatar.title')}</Text>

        <View style={styles.previewContainer}>
          <View style={[styles.previewCircle, avatarStyle ? styles.previewCircleActive : null]}>
            {selectedOption ? (
              <MaterialCommunityIcons
                name={selectedOption.icon}
                size={64}
                color={TEAL}
              />
            ) : (
              <MaterialCommunityIcons
                name="account-outline"
                size={64}
                color={colors.textTertiary}
              />
            )}
          </View>
        </View>

        <View style={styles.grid}>
          {AVATAR_OPTIONS.map((option) => {
            const isSelected = avatarStyle === option.key;
            return (
              <Pressable
                key={option.key}
                style={[styles.gridItem, isSelected ? styles.gridItemSelected : null]}
                onPress={() => setAvatarStyle(option.key)}
              >
                <MaterialCommunityIcons
                  name={option.icon}
                  size={32}
                  color={isSelected ? TEAL : colors.textSecondary}
                />
                <Text
                  style={[styles.gridLabel, isSelected ? styles.gridLabelSelected : null]}
                >
                  {t(`onboarding.avatar.styles.${option.key}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.ctaButton, !avatarStyle ? styles.ctaButtonDisabled : null]}
            onPress={handleNext}
            disabled={!avatarStyle}
          >
            <Text style={styles.ctaButtonText}>{t('onboarding.avatar.cta')}</Text>
          </Pressable>
        </View>
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
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
  },
  backButtonText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '500',
  },
  step: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  previewCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCircleActive: {
    borderColor: TEAL,
    backgroundColor: `${TEAL}15`,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  gridItem: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  gridItemSelected: {
    borderColor: TEAL,
    backgroundColor: `${TEAL}15`,
  },
  gridLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  gridLabelSelected: {
    color: TEAL,
    fontWeight: '700',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
  },
  ctaButton: {
    backgroundColor: GOLD,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  ctaButtonDisabled: {
    opacity: 0.4,
  },
  ctaButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
