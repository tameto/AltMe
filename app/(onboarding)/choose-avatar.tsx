import { StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GoldButton } from '@/src/shared/components/gold-button';
import { colors, spacing, fontFamily, borderRadius } from '@/src/config/theme';
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
            <Text style={styles.step}>4/6</Text>
          </View>

          <Text style={styles.title}>{t('onboarding.avatar.title')}</Text>

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
  step: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: '#94A3B8',
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  previewCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFFFFF0D',
    borderWidth: 1,
    borderColor: '#FFFFFF25',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCircleActive: {
    borderColor: '#7DD3FC',
    borderWidth: 3,
    shadowColor: '#7DD3FC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  gridItem: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: '#FFFFFF0D',
    borderWidth: 1,
    borderColor: '#FFFFFF25',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  gridItemSelected: {
    borderColor: '#7DD3FC',
    borderWidth: 3,
    shadowColor: '#7DD3FC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  gridLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
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
