import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fontFamily } from '@/src/config/theme';

type RemainingCounterProps = {
  remaining: number;
  total: number;
};

export function RemainingCounter({ remaining, total }: RemainingCounterProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {t('chat.remainingFormat', { remaining, total })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    backgroundColor: '#0F172ADD',
  },
  text: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#FFFFFF40',
  },
});
