import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';

import { colors, spacing, borderRadius, fontSize, fontFamily, glassmorphism } from '@/src/config/theme';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';

export default function AccountDeleteConfirmScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const deleteAccount = useAuthStore((s) => s.deleteAccount);

  const confirmText = t('settings.deleteConfirm.inputMatch');

  const [input, setInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = input === confirmText;

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteAccount();
      router.replace('/(auth)/login');
    } catch {
      setError(t('settings.deleteConfirm.error'));
      setIsDeleting(false);
    }
  };

  const deletionItems = [
    t('settings.deleteConfirm.deletedItem1'),
    t('settings.deleteConfirm.deletedItem2'),
    t('settings.deleteConfirm.deletedItem3'),
    t('settings.deleteConfirm.deletedItem4'),
  ];

  return (
    <CosmicBackground overlayOpacity={0.9}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} disabled={isDeleting}>
            <Feather name="x" size={24} color={isDeleting ? colors.textTertiary : colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('settings.deleteConfirm.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Warning Section */}
          <View style={styles.warningSection}>
            <Feather name="alert-triangle" size={48} color={colors.error} />
            <Text style={styles.warningTitle}>{t('settings.deleteConfirm.warning')}</Text>
            <Text style={styles.warningDescription}>
              {t('settings.deleteConfirm.description')}
            </Text>
          </View>

          {/* Deletion Data List */}
          <View style={styles.dataListSection}>
            <Text style={styles.dataListTitle}>{t('settings.deleteConfirm.dataListTitle')}</Text>
            {deletionItems.map((item, index) => (
              <View key={index} style={styles.dataListItem}>
                <Feather name="circle" size={6} color={colors.textSecondary} />
                <Text style={styles.dataListItemText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Confirmation Input */}
          <View style={styles.confirmSection}>
            <Text style={styles.confirmLabel}>
              {t('settings.deleteConfirm.inputLabel', { confirmText })}
            </Text>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={confirmText}
              placeholderTextColor={colors.textTertiary}
              editable={!isDeleting}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Delete Button */}
          <Pressable
            style={[styles.deleteButton, !isConfirmed && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.deleteButtonText}>
                {t('settings.deleteConfirm.cta')}
              </Text>
            )}
          </Pressable>

          {/* Cancel Button */}
          <Pressable
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isDeleting}
          >
            <Text style={styles.cancelButtonText}>{t('settings.deleteConfirm.cancel')}</Text>
          </Pressable>
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
    color: colors.text,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  warningSection: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  warningTitle: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.error,
    textAlign: 'center',
  },
  warningDescription: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  dataListSection: {
    gap: spacing.sm,
  },
  dataListTitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  dataListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dataListItemText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    flex: 1,
  },
  confirmSection: {
    gap: spacing.sm,
  },
  confirmLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: glassmorphism.input.bg,
    borderWidth: 1,
    borderColor: glassmorphism.input.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.text,
  },
  errorCard: {
    backgroundColor: colors.error + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  errorText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.error,
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: colors.error,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: colors.textTertiary,
    opacity: 0.5,
  },
  deleteButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#FFFFFF25',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
});
