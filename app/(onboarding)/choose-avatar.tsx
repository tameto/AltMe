import { StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GoldButton } from '@/src/shared/components/gold-button';
import { spacing, fontFamily, borderRadius } from '@/src/config/theme';
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
    <CosmicBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={24} color="#F8FAFC" />
            </Pressable>
            <Text style={styles.headerTitle}>{t('onboarding.avatar.title')}</Text>
            <Text style={styles.step}>5 / 6</Text>
          </View>

          <View style={styles.previewContainer}>
            <View style={[styles.previewCircle, avatarStyle ? styles.previewCircleActive : null]}>
              {selectedOption ? (
                <MaterialCommunityIcons
                  name={selectedOption.icon}
                  size={72}
                  color="#7DD3FC"
                />
              ) : (
                <MaterialCommunityIcons
                  name="account-outline"
                  size={72}
                  color="#64748B"
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
                    size={36}
                    color={isSelected ? '#7DD3FC' : '#94A3B8'}
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
            <GoldButton
              title={t('onboarding.avatar.cta')}
              onPress={handleNext}
              disabled={!avatarStyle}
              style={styles.ctaButton}
            />
          </View>
        </View>
      </SafeAreaView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
    textAlign: 'center',
  },
  step: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.38)',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  previewCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(125,211,252,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(125,211,252,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCircleActive: {
    borderColor: 'rgba(125,211,252,0.25)',
    borderWidth: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  gridItem: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  gridItemSelected: {
    backgroundColor: 'rgba(125,211,252,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(125,211,252,0.31)',
  },
  gridLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  gridLabelSelected: {
    fontFamily: fontFamily.semiBold,
    color: '#7DD3FC',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
  },
  ctaButton: {
    alignSelf: 'stretch',
  },
});
