import type { Config } from 'jest';

const transformIgnorePatterns = [
  'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-purchases|@supabase/.*|zustand|@ronradtke/react-native-markdown-display)',
];

const baseConfig: Partial<Config> = {
  setupFiles: ['./jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  clearMocks: true,
  testPathIgnorePatterns: ['/node_modules/', '/supabase/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/types/**',
  ],
  transformIgnorePatterns,
  coverageReporters: ['text', 'text-summary', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

// Patterns that identify platform-specific test files
// Matches both dot-separated (*.web.test.ts) and hyphen-separated (*-web.test.ts)
const platformTestPatterns = [
  '\\.(web|ios|android|native)\\.test\\.[jt]sx?$',
  '-(web|ios|android|native)\\.test\\.[jt]sx?$',
];

const config: Config = {
  projects: [
    // shared: runs all common tests once (excludes platform-specific tests)
    {
      ...baseConfig,
      displayName: 'shared',
      preset: 'jest-expo/ios',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
      testPathIgnorePatterns: [
        ...baseConfig.testPathIgnorePatterns as string[],
        ...platformTestPatterns,
      ],
    },
    // web: only web-specific tests
    {
      ...baseConfig,
      displayName: 'web',
      preset: 'jest-expo/web',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['web.ts', 'web.tsx', 'ts', 'tsx', 'js', 'jsx', 'json'],
      testMatch: [
        '<rootDir>/src/**/*.web.test.{ts,tsx}',
        '<rootDir>/src/**/*-web.test.{ts,tsx}',
      ],
    },
    // ios: only ios-specific and native-specific tests
    {
      ...baseConfig,
      displayName: 'ios',
      preset: 'jest-expo/ios',
      testEnvironment: 'node',
      moduleFileExtensions: ['native.ts', 'native.tsx', 'ios.ts', 'ios.tsx', 'ts', 'tsx', 'js', 'jsx', 'json'],
      testMatch: [
        '<rootDir>/src/**/*.ios.test.{ts,tsx}',
        '<rootDir>/src/**/*-ios.test.{ts,tsx}',
        '<rootDir>/src/**/*.native.test.{ts,tsx}',
        '<rootDir>/src/**/*-native.test.{ts,tsx}',
      ],
    },
    // android: only android-specific and native-specific tests
    {
      ...baseConfig,
      displayName: 'android',
      preset: 'jest-expo/android',
      testEnvironment: 'node',
      moduleFileExtensions: ['native.ts', 'native.tsx', 'android.ts', 'android.tsx', 'ts', 'tsx', 'js', 'jsx', 'json'],
      testMatch: [
        '<rootDir>/src/**/*.android.test.{ts,tsx}',
        '<rootDir>/src/**/*-android.test.{ts,tsx}',
        '<rootDir>/src/**/*.native.test.{ts,tsx}',
        '<rootDir>/src/**/*-native.test.{ts,tsx}',
      ],
    },
  ],
};

// jest.config.ts requires export default (framework requirement)
// eslint-disable-next-line no-restricted-syntax
export default config;
