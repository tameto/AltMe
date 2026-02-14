const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    console.warn(`Missing environment variable: ${key}`);
    return '';
  }
  return value;
};

export const env = {
  supabaseUrl: getEnvVar('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  revenuecatIosKey: getEnvVar('EXPO_PUBLIC_REVENUECAT_IOS_KEY'),
  revenuecatAndroidKey: getEnvVar('EXPO_PUBLIC_REVENUECAT_ANDROID_KEY'),
} as const;
