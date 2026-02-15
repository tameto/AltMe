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

import { colors, spacing, borderRadius, fontSize } from '@/src/config/theme';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';

const CONFIRM_TEXT = '削除';

export default function AccountDeleteConfirmScreen() {
  const router = useRouter();
  const deleteAccount = useAuthStore((s) => s.deleteAccount);

  const [input, setInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = input === CONFIRM_TEXT;

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteAccount();
      router.replace('/(auth)/login');
    } catch {
      setError(
        'アカウントの削除に失敗しました。時間をおいて再度お試しください。\n\n解決しない場合はサポートまでご連絡ください: support@altme.app',
      );
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} disabled={isDeleting}>
          <FontAwesome name="arrow-left" size={20} color={isDeleting ? colors.textTertiary : colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>アカウント削除</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.warningCard}>
          <FontAwesome name="exclamation-triangle" size={32} color={colors.error} />
          <Text style={styles.warningTitle}>本当に削除しますか？</Text>
          <Text style={styles.warningText}>
            アカウントを削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。
          </Text>
        </View>

        <View style={styles.confirmSection}>
          <Text style={styles.confirmLabel}>
            確認のため「{CONFIRM_TEXT}」と入力してください
          </Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={CONFIRM_TEXT}
            placeholderTextColor={colors.textTertiary}
            editable={!isDeleting}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Pressable
          style={[styles.deleteButton, !isConfirmed && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={!isConfirmed || isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={[styles.deleteButtonText, !isConfirmed && styles.deleteButtonTextDisabled]}>
              アカウントを完全に削除
            </Text>
          )}
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={() => router.back()} disabled={isDeleting}>
          <Text style={styles.cancelButtonText}>キャンセル</Text>
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
