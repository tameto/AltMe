import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';

import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GoldButton } from '@/src/shared/components/gold-button';
import { spacing, borderRadius, fontSize, fontFamily } from '@/src/config/theme';
import { createCommunity } from '@/src/services/community/client';
import { THUMBNAIL_SOURCES, THUMBNAIL_KEYS, type ThumbnailKey } from '@/src/config/thumbnail-map';

const SCREEN_WIDTH = Dimensions.get('window').width;
const THUMBNAIL_GRID_PADDING = spacing.md * 2;
const THUMBNAIL_COLUMNS = 5;
const THUMBNAIL_ITEM_SIZE = (SCREEN_WIDTH - THUMBNAIL_GRID_PADDING) / THUMBNAIL_COLUMNS;

type LanguageCode = 'ja' | 'en' | 'ko';
type CategoryKey = 'entertainment' | 'lifestyle' | 'technology' | 'other';

const LANGUAGES: LanguageCode[] = ['ja', 'en', 'ko'];
const CATEGORIES: CategoryKey[] = ['entertainment', 'lifestyle', 'technology', 'other'];

export default function CommunityCreateScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('ja');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<ThumbnailKey | null>(null);
  const [showThumbnailPicker, setShowThumbnailPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isValid = channelName.trim().length > 0;

  const handleCreate = async () => {
    if (!isValid || isLoading) return;

    setIsLoading(true);
    try {
      const result = await createCommunity({
        name: channelName.trim(),
        description: description.trim(),
        language: selectedLanguage,
        category: selectedCategory ?? 'other',
        thumbnailUrl: selectedThumbnail ?? undefined,
      });

      if (result) {
        router.back();
      } else {
        Alert.alert(
          'エラー',
          'コミュニティの作成に失敗しました。もう一度お試しください。',
          [{ text: 'OK' }],
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CosmicBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={24} color="#F8FAFC" />
          </Pressable>
          <Text style={styles.headerTitle}>コミュニティを作成</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Thumbnail Picker */}
          <View style={styles.thumbnailSection}>
            <Pressable
              style={styles.thumbnailPicker}
              onPress={() => setShowThumbnailPicker(!showThumbnailPicker)}
            >
              {selectedThumbnail !== null ? (
                <Image
                  source={THUMBNAIL_SOURCES[selectedThumbnail]}
                  style={styles.thumbnailPreview}
                />
              ) : (
                <>
                  <Feather name="camera" size={32} color="rgba(255,255,255,0.25)" />
                  <Text style={styles.thumbnailLabel}>{t('community.create.thumbnail')}</Text>
                </>
              )}
            </Pressable>

            {showThumbnailPicker ? (
              <FlatList
                data={THUMBNAIL_KEYS}
                keyExtractor={(item) => item}
                numColumns={THUMBNAIL_COLUMNS}
                scrollEnabled={false}
                style={styles.thumbnailGrid}
                renderItem={({ item }) => (
                  <Pressable
                    style={[
                      styles.thumbnailGridItem,
                      selectedThumbnail === item
                        ? styles.thumbnailGridItemSelected
                        : styles.thumbnailGridItemUnselected,
                    ]}
                    onPress={() => setSelectedThumbnail(item)}
                  >
                    <Image
                      source={THUMBNAIL_SOURCES[item]}
                      style={styles.thumbnailGridImage}
                    />
                  </Pressable>
                )}
              />
            ) : null}
          </View>

          {/* Channel Name */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>{t('community.create.channelName')}</Text>
            <TextInput
              style={styles.input}
              value={channelName}
              onChangeText={setChannelName}
              placeholder={t('community.create.channelNamePlaceholder')}
              placeholderTextColor="#64748B"
              maxLength={50}
            />
          </View>

          {/* Description */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>{t('community.create.description')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder={t('community.create.descriptionPlaceholder')}
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={300}
            />
          </View>

          {/* Language Selector */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>{t('community.create.language')}</Text>
            <View style={styles.chipRow}>
              {LANGUAGES.map((lang) => (
                <Pressable
                  key={lang}
                  style={[
                    styles.chip,
                    selectedLanguage === lang && styles.chipSelected,
                  ]}
                  onPress={() => setSelectedLanguage(lang)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedLanguage === lang && styles.chipTextSelected,
                    ]}
                  >
                    {t(`community.create.languages.${lang}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Category Selector */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>{t('community.create.category')}</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.chip,
                    selectedCategory === cat && styles.chipSelected,
                  ]}
                  onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategory === cat && styles.chipTextSelected,
                    ]}
                  >
                    {t(`community.create.categories.${cat}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Create Button */}
          <GoldButton
            title={t('community.create.cta')}
            onPress={handleCreate}
            disabled={!isValid || isLoading}
          />
        </ScrollView>
      </SafeAreaView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
    color: '#F8FAFC',
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  thumbnailSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  thumbnailPicker: {
    width: 120,
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  thumbnailPreview: {
    width: 120,
    height: 80,
    borderRadius: 16,
  },
  thumbnailLabel: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.25)',
  },
  thumbnailGrid: {
    marginTop: spacing.sm,
    width: SCREEN_WIDTH - THUMBNAIL_GRID_PADDING,
  },
  thumbnailGridItem: {
    width: THUMBNAIL_ITEM_SIZE,
    height: THUMBNAIL_ITEM_SIZE * (2 / 3),
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  thumbnailGridItemSelected: {
    borderColor: 'rgba(125,211,252,0.31)',
    backgroundColor: 'rgba(125,211,252,0.08)',
  },
  thumbnailGridItemUnselected: {
    borderColor: '#FFFFFF20',
    backgroundColor: 'transparent',
  },
  thumbnailGridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  fieldSection: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: '#F8FAFC',
    backgroundColor: 'rgba(255,255,255,0.03)',
    height: 48,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF08',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
  },
  chipSelected: {
    backgroundColor: 'rgba(125,211,252,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(125,211,252,0.31)',
  },
  chipText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: '#F8FAFC',
  },
  chipTextSelected: {
    color: '#7DD3FC',
    fontFamily: fontFamily.semiBold,
  },
});
