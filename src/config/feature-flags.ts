import { Platform } from 'react-native';

type FeatureFlagDef = {
  name: string;
  enabledPlatforms: readonly ('web' | 'ios' | 'android')[];
  enabledEnvironments: readonly ('development' | 'staging' | 'production')[];
};

const FEATURE_FLAGS = {
  stripeCheckout: {
    name: 'Stripe Checkout (Web)',
    enabledPlatforms: ['web'],
    enabledEnvironments: ['development', 'staging', 'production'],
  },
  revenuecatPurchase: {
    name: 'RevenueCat Purchase (Native)',
    enabledPlatforms: ['ios', 'android'],
    enabledEnvironments: ['development', 'staging', 'production'],
  },
  fileDragDrop: {
    name: 'File Drag & Drop (Web)',
    enabledPlatforms: ['web'],
    enabledEnvironments: ['development', 'staging', 'production'],
  },
  keyboardShortcuts: {
    name: 'Keyboard Shortcuts (Web)',
    enabledPlatforms: ['web'],
    enabledEnvironments: ['development', 'staging', 'production'],
  },
  pushNotifications: {
    name: 'Push Notifications (Native)',
    enabledPlatforms: ['ios', 'android'],
    enabledEnvironments: ['development', 'staging', 'production'],
  },
} as const satisfies Record<string, FeatureFlagDef>;

export type FeatureFlagName = keyof typeof FEATURE_FLAGS;

const getEnvironment = (): 'development' | 'staging' | 'production' => {
  if (__DEV__) return 'development';
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV;
  if (appEnv === 'staging') return 'staging';
  return 'production';
};

export const isFeatureEnabled = (flagName: FeatureFlagName): boolean => {
  const flag = FEATURE_FLAGS[flagName];

  const platform = Platform.OS as 'web' | 'ios' | 'android';
  const env = getEnvironment();

  return (flag.enabledPlatforms as readonly string[]).includes(platform) &&
    (flag.enabledEnvironments as readonly string[]).includes(env);
};

export const getEnabledFeatures = (): FeatureFlagName[] => {
  return (Object.keys(FEATURE_FLAGS) as FeatureFlagName[]).filter((name) =>
    isFeatureEnabled(name)
  );
};
