import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';

import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GoldButton } from '@/src/shared/components/gold-button';
import { spacing, borderRadius, fontSize, fontFamily, glassmorphism } from '@/src/config/theme';
import { createCommunity } from '@/src/services/community/client';

type LanguageCode = 'ja' | 'en' | 'ko';
type CategoryKey = 'info' | 'business' | 'hobby' | 'casual' | 'other';

const LANGUAGES: LanguageCode[] = ['ja', 'en', 'ko'];
const CATEGORIES: CategoryKey[] = ['info', 'business', 'hobby', 'casual', 'other'];

export default function CommunityCreateScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('ja');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
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
            <Feather name="x" size={24} color="#94A3B8" />
          </Pressable>
          <Text style={styles.headerTitle}>コミュニティを作成</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Thumbnail Picker */}
          <View style={styles.thumbnailSection}>
            <Text style={styles.label}>{t('community.create.thumbnail')}</Text>
            <Pressable style={styles.thumbnailPicker}>
              <Feather name="image" size={32} color="#64748B" />
            </Pressable>
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
    height: 120,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: '#FFFFFF25',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: glassmorphism.input.bg,
  },
  fieldSection: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: '#94A3B8',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#FFFFFF15',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: '#F8FAFC',
    backgroundColor: glassmorphism.input.bg,
    height: 48,
  },
  textArea: {
    height: 100,
    paddingTop: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF10',
    borderWidth: 1,
    borderColor: '#FFFFFF25',
  },
  chipSelected: {
    backgroundColor: '#7DD3FC',
    borderWidth: 0,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: '#F8FAFC',
  },
  chipTextSelected: {
    color: '#0F172A',
    fontFamily: fontFamily.medium,
  },
});
