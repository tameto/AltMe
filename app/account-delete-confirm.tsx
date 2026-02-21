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

import { colors, spacing, borderRadius, fontSize, fontFamily } from '@/src/config/theme';
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
            <Feather name="arrow-left" size={24} color={isDeleting ? colors.textTertiary : colors.text} />
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
            <View style={styles.warningIconContainer}>
              <Feather name="alert-triangle" size={36} color={colors.error} />
            </View>
            <Text style={styles.warningTitle}>{t('settings.deleteConfirm.warning')}</Text>
            <Text style={styles.warningDescription}>
              {t('settings.deleteConfirm.description')}
            </Text>
          </View>

          {/* Deletion Data List */}
          <View style={styles.dataListSection}>
            {deletionItems.map((item, index) => (
              <View key={index} style={styles.dataListItem}>
                <Feather name="trash-2" size={16} color={colors.error} />
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
              <ActivityIndicator color="#FFFFFF" />
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
  warningIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239,68,68,0.13)',
    borderWidth: 2,
    borderColor: 'rgba(239,68,68,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningTitle: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    color: colors.text,
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
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
    gap: 10,
    padding: 16,
    paddingHorizontal: 20,
  },
  dataListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dataListItemText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.8)',
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
    backgroundColor: '#FFFFFF08',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 48,
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
    backgroundColor: '#EF4444',
    height: 54,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: colors.textTertiary,
    opacity: 0.5,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    height: 48,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
});
