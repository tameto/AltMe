import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';

import { colors, spacing, borderRadius, fontSize } from '@/src/config/theme';

type LanguageCode = 'ja' | 'en' | 'ko';
type CategoryKey = 'entertainment' | 'lifestyle' | 'technology' | 'sports' | 'music';

const LANGUAGES: LanguageCode[] = ['ja', 'en', 'ko'];
const CATEGORIES: CategoryKey[] = ['entertainment', 'lifestyle', 'technology', 'sports', 'music'];

export default function CommunityCreateScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('ja');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);

  const isValid = channelName.trim().length > 0;

  const handleCreate = () => {
    if (!isValid) return;
    // TODO: Implement channel creation logic
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('community.create.title')}</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Thumbnail Picker */}
        <View style={styles.thumbnailSection}>
          <Text style={styles.label}>{t('community.create.thumbnail')}</Text>
          <Pressable style={styles.thumbnailPicker}>
            <FontAwesome name="image" size={32} color={colors.textTertiary} />
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
            placeholderTextColor={colors.textTertiary}
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
            placeholderTextColor={colors.textTertiary}
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
        <Pressable
          style={[styles.createButton, !isValid && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={!isValid}
        >
          <Text style={[styles.createButtonText, !isValid && styles.createButtonTextDisabled]}>
            {t('community.create.cta')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
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
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  fieldSection: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textArea: {
    height: 100,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  createButtonDisabled: {
    backgroundColor: colors.border,
  },
  createButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  createButtonTextDisabled: {
    color: colors.textTertiary,
  },
});
