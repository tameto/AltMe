module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-purchases|@supabase/.*|zustand)',
  ],
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  clearMocks: true,
  testPathIgnorePatterns: [
    '/node_modules/',
    '/supabase/',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/types/**',
  ],
};
