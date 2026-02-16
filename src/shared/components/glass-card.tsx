import React from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

import { glassmorphism } from '@/src/config/theme';

type Variant = 'card' | 'bubble-ai' | 'bubble-user' | 'input';

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  style?: ViewStyle;
};

const variantStyles: Record<Variant, { bg: string; border: string }> = {
  card: { bg: glassmorphism.card.bg, border: glassmorphism.card.border },
  'bubble-ai': { bg: glassmorphism.bubble.ai.bg, border: glassmorphism.bubble.ai.border },
  'bubble-user': { bg: glassmorphism.bubble.user.bg, border: glassmorphism.bubble.user.border },
  input: { bg: glassmorphism.input.bg, border: glassmorphism.input.border },
};

export function GlassCard({ children, variant = 'card', style }: Props) {
  const v = variantStyles[variant];

  return (
    <View style={[styles.outer, { borderColor: v.border }, style]}>
      <BlurView
        intensity={glassmorphism.card.blur}
        tint="dark"
        style={StyleSheet.absoluteFill}
        {...(Platform.OS === 'android' && { experimentalBlurMethod: 'dimezisBlurView' })}
      />
      <View style={[styles.inner, { backgroundColor: v.bg }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 16,
  },
  inner: {
    flex: 1,
  },
});
