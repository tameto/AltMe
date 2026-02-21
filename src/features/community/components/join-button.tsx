import React from 'react';
import { Alert, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, fontSize, fontFamily, glassmorphism } from '@/src/config/theme';

type JoinButtonProps = {
  isMember: boolean;
  isLoading: boolean;
  onJoin: () => void;
  onLeave: () => void;
};

export function JoinButton({ isMember, isLoading, onJoin, onLeave }: JoinButtonProps) {
  const { t } = useTranslation();

  function handleLongPress() {
    if (!isMember) return;
    Alert.alert(
      t('community.detail.leave'),
      t('community.detail.leaveConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('community.detail.leave'), style: 'destructive', onPress: onLeave },
      ],
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, isMember ? styles.joinedButton : styles.joinButton]}
      onPress={isMember ? undefined : onJoin}
      onLongPress={isMember ? handleLongPress : undefined}
      activeOpacity={0.75}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={isMember ? colors.textSecondary : colors.textInverse} />
      ) : (
        <Text style={[styles.label, isMember ? styles.joinedLabel : styles.joinLabel]}>
          {isMember ? t('community.detail.joined') : t('community.detail.join')}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
    minHeight: 36,
  },
  joinButton: {
    backgroundColor: colors.primary,
  },
  joinedButton: {
    backgroundColor: glassmorphism.card.bg,
    borderWidth: 1,
    borderColor: glassmorphism.card.border,
  },
  label: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
  },
  joinLabel: {
    color: colors.textInverse,
  },
  joinedLabel: {
    color: colors.textSecondary,
  },
});
