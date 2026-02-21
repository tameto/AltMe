// This file exists for TypeScript resolution only.
// Metro bundler resolves imports to auth.native.ts (iOS/Android)
// or auth.web.ts (web) automatically based on platform.
export {
  signInWithApple,
  signInWithGoogle,
  signOut,
  getCurrentSession,
  getCurrentProfile,
  updateProfile,
  deleteAccount,
  mapDbProfile,
} from './auth.native';
