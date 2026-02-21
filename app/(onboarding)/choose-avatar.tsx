import { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, FlatList, Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GoldButton } from '@/src/shared/components/gold-button';
import { spacing, fontFamily, borderRadius } from '@/src/config/theme';
import { useOnboardingStore } from '@/src/features/onboarding/stores/onboarding-store';
import { AVATAR_SOURCES } from '@/src/config/avatar-map';
import type { AvatarIcon } from '@/src/shared/types/user';

const AVATAR_ENTRIES = Object.entries(AVATAR_SOURCES) as [string, ImageSourcePropType][];

type AvatarItem = {
  key: string;
  source: ImageSourcePropType;
};

const avatarData: AvatarItem[] = AVATAR_ENTRIES.map(([key, source]) => ({ key, source }));

export default function ChooseAvatarScreen() {
  const { t } = useTranslation();
  const avatarIcon = useOnboardingStore((s) => s.avatarIcon);
  const setAvatarIcon = useOnboardingStore((s) => s.setAvatarIcon);

  const handleNext = () => {
    if (!avatarIcon) return;
    router.push('/(onboarding)/choose-tone');
  };

  const renderItem = useCallback(
    ({ item }: { item: AvatarItem }) => {
      const isSelected = avatarIcon === item.key;
      return (
        <Pressable
          style={[styles.gridItem, isSelected ? styles.gridItemSelected : null]}
          onPress={() => setAvatarIcon(item.key as AvatarIcon)}
        >
          <Image
            source={item.source}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        </Pressable>
      );
    },
    [avatarIcon, setAvatarIcon],
  );

  const keyExtractor = useCallback((item: AvatarItem) => item.key, []);

  const selectedSource = avatarIcon ? AVATAR_SOURCES[avatarIcon] : null;

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
            <View style={[styles.previewCircle, avatarIcon ? styles.previewCircleActive : null]}>
              {selectedSource ? (
                <Image
                  source={selectedSource}
                  style={styles.previewImage}
                  resizeMode="cover"
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

          <FlatList
            data={avatarData}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={5}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            style={styles.grid}
          />

          <View style={styles.footer}>
            <GoldButton
              title={t('onboarding.avatar.cta')}
              onPress={handleNext}
              disabled={!avatarIcon}
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
    marginBottom: spacing.lg,
  },
  previewCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(125,211,252,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(125,211,252,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewCircleActive: {
    borderColor: 'rgba(125,211,252,0.31)',
    borderWidth: 2,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  grid: {
    flex: 1,
  },
  gridContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  columnWrapper: {
    gap: spacing.sm,
    justifyContent: 'center',
  },
  gridItem: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    overflow: 'hidden',
  },
  gridItemSelected: {
    backgroundColor: 'rgba(125,211,252,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(125,211,252,0.31)',
  },
  avatarImage: {
    width: 64,
    height: 64,
  },
  footer: {
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  ctaButton: {
    alignSelf: 'stretch',
  },
});
