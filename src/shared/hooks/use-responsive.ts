import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import type { Breakpoint, ResponsiveInfo } from '@/src/shared/types/platform';

export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

export const getBreakpoint = (width: number): Breakpoint => {
  if (width >= BREAKPOINTS.wide) return 'wide';
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
};

const getResponsiveInfo = (width: number, height: number): ResponsiveInfo => {
  const breakpoint = getBreakpoint(width);
  return {
    breakpoint,
    width,
    height,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isWide: breakpoint === 'wide',
  };
};

export const useResponsive = (): ResponsiveInfo => {
  // Native is always mobile — no resize handling needed
  if (Platform.OS !== 'web') {
    const { width, height } = Dimensions.get('window');
    return getResponsiveInfo(width, height);
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [info, setInfo] = useState<ResponsiveInfo>(() => {
    // SSR safe: fallback to mobile when window is not available
    const w = typeof window !== 'undefined' ? window.innerWidth : 375;
    const h = typeof window !== 'undefined' ? window.innerHeight : 812;
    return getResponsiveInfo(w, h);
  });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const handleResize = () => {
      setInfo(getResponsiveInfo(window.innerWidth, window.innerHeight));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return info;
};
