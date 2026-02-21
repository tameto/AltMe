import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { glassmorphism } from '@/src/config/theme';

type Variant = 'card' | 'bubble-ai' | 'bubble-user' | 'input';

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  style?: ViewStyle;
  testID?: string;
};

const variantStyles: Record<Variant, { bg: string; border: string }> = {
  card: { bg: glassmorphism.card.bg, border: glassmorphism.card.border },
  'bubble-ai': { bg: glassmorphism.bubble.ai.bg, border: glassmorphism.bubble.ai.border },
  'bubble-user': { bg: glassmorphism.bubble.user.bg, border: glassmorphism.bubble.user.border },
  input: { bg: glassmorphism.input.bg, border: glassmorphism.input.border },
};

export function GlassCard({ children, variant = 'card', style, testID }: Props) {
  const v = variantStyles[variant];

  const webStyle = {
    borderColor: v.border,
    backgroundColor: v.bg,
    backdropFilter: `blur(${glassmorphism.card.blur}px)`,
    WebkitBackdropFilter: `blur(${glassmorphism.card.blur}px)`,
  } as ViewStyle;

  return (
    <View
      testID={testID}
      style={[styles.outer, webStyle, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 16,
  },
});
