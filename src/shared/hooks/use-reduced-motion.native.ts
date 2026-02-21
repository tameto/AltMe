import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const checkMotion = async () => {
      const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      setPrefersReducedMotion(isReduceMotionEnabled);
    };

    checkMotion();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isEnabled) => setPrefersReducedMotion(isEnabled),
    );

    return () => subscription.remove();
  }, []);

  return prefersReducedMotion;
};
