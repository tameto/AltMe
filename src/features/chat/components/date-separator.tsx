import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { spacing, fontFamily } from '@/src/config/theme';

type DateSeparatorProps = {
  date: string; // ISO date string
};

export function DateSeparator({ date }: DateSeparatorProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'ja' ? 'ja-JP' : 'en-US';

  const formatted = new Intl.DateTimeFormat(locale, {
    month: locale === 'ja-JP' ? 'numeric' : 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(date));

  // For Japanese: "2月15日(土)" → "2月15日（土）"
  const displayDate = locale === 'ja-JP'
    ? formatted.replace('(', '（').replace(')', '）')
    : formatted;

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{displayDate}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#FFFFFF15',
  },
  text: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF60',
  },
});
