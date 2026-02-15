import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';

import { colors, spacing, borderRadius, fontSize } from '@/src/config/theme';
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} disabled={isDeleting}>
          <FontAwesome name="arrow-left" size={20} color={isDeleting ? colors.textTertiary : colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.deleteConfirm.title')}</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.warningCard}>
          <FontAwesome name="exclamation-triangle" size={32} color={colors.error} />
          <Text style={styles.warningTitle}>{t('settings.deleteConfirm.warning')}</Text>
          <Text style={styles.warningText}>
            {t('settings.deleteConfirm.description')}
          </Text>
        </View>

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

        <Pressable
          style={[styles.deleteButton, !isConfirmed && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={!isConfirmed || isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={[styles.deleteButtonText, !isConfirmed && styles.deleteButtonTextDisabled]}>
              {t('settings.deleteConfirm.cta')}
            </Text>
          )}
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={() => router.back()} disabled={isDeleting}>
          <Text style={styles.cancelButtonText}>{t('settings.deleteConfirm.cancel')}</Text>
        </Pressable>
      </View>
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
    flex: 1,
    padding: spacing.md,
  },
  warningCard: {
    backgroundColor: colors.error + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  warningTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.error,
  },
  warningText: {
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmSection: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  confirmLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
  errorCard: {
    backgroundColor: colors.error + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  deleteButtonDisabled: {
    backgroundColor: colors.border,
  },
  deleteButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  deleteButtonTextDisabled: {
    color: colors.textTertiary,
  },
  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
