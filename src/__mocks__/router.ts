/**
 * Expo Router mock for unit tests.
 * Provides useRouter, usePathname, useSegments, and other router hooks.
 */

export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn().mockReturnValue(false),
  dismiss: jest.fn(),
  dismissAll: jest.fn(),
  navigate: jest.fn(),
  setParams: jest.fn(),
};

export const mockUsePathname = jest.fn().mockReturnValue('/');
export const mockUseSegments = jest.fn().mockReturnValue([]);
export const mockUseLocalSearchParams = jest.fn().mockReturnValue({});
export const mockUseGlobalSearchParams = jest.fn().mockReturnValue({});

/**
 * Call jest.mock('expo-router', () => require('@/src/__mocks__/router').expoRouterMock)
 * or use setupRouterMock() for automatic setup.
 */
export const expoRouterMock = {
  useRouter: () => mockRouter,
  usePathname: mockUsePathname,
  useSegments: mockUseSegments,
  useLocalSearchParams: mockUseLocalSearchParams,
  useGlobalSearchParams: mockUseGlobalSearchParams,
  Link: 'Link',
  Redirect: 'Redirect',
  Stack: { Screen: 'Screen' },
  Tabs: { Screen: 'Screen' },
  Slot: 'Slot',
  router: mockRouter,
};

/**
 * Reset all router mocks. Call in beforeEach() or afterEach().
 */
export const resetRouterMocks = (): void => {
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  mockRouter.back.mockReset();
  mockRouter.canGoBack.mockReset().mockReturnValue(false);
  mockRouter.dismiss.mockReset();
  mockRouter.dismissAll.mockReset();
  mockRouter.navigate.mockReset();
  mockRouter.setParams.mockReset();
  mockUsePathname.mockReset().mockReturnValue('/');
  mockUseSegments.mockReset().mockReturnValue([]);
  mockUseLocalSearchParams.mockReset().mockReturnValue({});
  mockUseGlobalSearchParams.mockReset().mockReturnValue({});
};
