export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  revenuecatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
  revenuecatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  posthogApiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '',
  onesignalAppId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? '',
  cfWorkerUrl: process.env.EXPO_PUBLIC_CF_WORKER_URL ?? '',
} as const;
