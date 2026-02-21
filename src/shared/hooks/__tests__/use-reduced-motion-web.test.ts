/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react-native';
import { useReducedMotion } from '../use-reduced-motion.web';

describe('useReducedMotion (Web)', () => {
  let changeHandler: ((event: { matches: boolean }) => void) | null;
  let currentMatches: boolean;

  beforeEach(() => {
    changeHandler = null;
    currentMatches = false;

    // window.matchMedia is already defined in jest.setup.ts,
    // override the mock implementation instead of redefining
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: currentMatches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event: string, handler: (e: { matches: boolean }) => void) => {
        if (event === 'change') changeHandler = handler;
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  it('returns false when reduced motion is not preferred', () => {
    currentMatches = false;
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when reduced motion is preferred', () => {
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('updates when preference changes', () => {
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    act(() => {
      if (changeHandler) {
        changeHandler({ matches: true });
      }
    });

    expect(result.current).toBe(true);
  });

  it('cleans up event listener on unmount', () => {
    const removeEventListenerMock = jest.fn();
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event: string, handler: (e: { matches: boolean }) => void) => {
        if (event === 'change') changeHandler = handler;
      }),
      removeEventListener: removeEventListenerMock,
      dispatchEvent: jest.fn(),
    }));

    const { unmount } = renderHook(() => useReducedMotion());
    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
