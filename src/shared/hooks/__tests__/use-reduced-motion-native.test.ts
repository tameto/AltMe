import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from '../use-reduced-motion.native';

const mockIsReduceMotionEnabled = AccessibilityInfo.isReduceMotionEnabled as jest.Mock;
const mockAddEventListener = AccessibilityInfo.addEventListener as jest.Mock;

describe('useReducedMotion (Native)', () => {
  let changeHandler: ((isEnabled: boolean) => void) | null;
  const mockRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    changeHandler = null;
    mockIsReduceMotionEnabled.mockResolvedValue(false);
    mockAddEventListener.mockImplementation((_event: string, handler: (isEnabled: boolean) => void) => {
      changeHandler = handler;
      return { remove: mockRemove };
    });
  });

  it('returns false when reduced motion is disabled', async () => {
    const { result } = renderHook(() => useReducedMotion());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('returns true when reduced motion is enabled', async () => {
    mockIsReduceMotionEnabled.mockResolvedValue(true);

    const { result } = renderHook(() => useReducedMotion());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('updates when accessibility setting changes', async () => {
    const { result } = renderHook(() => useReducedMotion());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    act(() => {
      if (changeHandler) changeHandler(true);
    });

    expect(result.current).toBe(true);
  });

  it('cleans up subscription on unmount', async () => {
    const { result, unmount } = renderHook(() => useReducedMotion());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    unmount();
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it('subscribes to reduceMotionChanged event', () => {
    renderHook(() => useReducedMotion());

    expect(mockAddEventListener).toHaveBeenCalledWith(
      'reduceMotionChanged',
      expect.any(Function),
    );
  });
});
