import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors } from '@/src/config/theme';

type Props = {
  currentStep: number;
  totalSteps?: number;
  style?: ViewStyle;
};

export function OnboardingProgressBar({ currentStep, totalSteps = 6, style }: Props) {
  const clamped = Math.max(0, Math.min(currentStep, totalSteps));

  return (
    <View
      style={[styles.container, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${clamped} of ${totalSteps}`}
      accessibilityValue={{ min: 0, max: totalSteps, now: clamped }}
    >
      {Array.from({ length: totalSteps }, (_, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            { backgroundColor: i < clamped ? colors.primary : colors.border },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    width: '100%',
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});
