import { act, renderHook } from '@testing-library/react-native';
import { useResponsive } from '../use-responsive';

const setWindowSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, writable: true, configurable: true });
};

describe('useResponsive hook (web)', () => {
  beforeEach(() => {
    setWindowSize(375, 812);
  });

  it('returns mobile breakpoint for small width', () => {
    setWindowSize(375, 812);
    const { result } = renderHook(() => useResponsive());

    expect(result.current.breakpoint).toBe('mobile');
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.isWide).toBe(false);
    expect(result.current.width).toBe(375);
    expect(result.current.height).toBe(812);
  });

  it('returns tablet breakpoint for width 768', () => {
    setWindowSize(768, 1024);
    const { result } = renderHook(() => useResponsive());

    expect(result.current.breakpoint).toBe('tablet');
    expect(result.current.isTablet).toBe(true);
  });

  it('returns desktop breakpoint for width 1024', () => {
    setWindowSize(1024, 768);
    const { result } = renderHook(() => useResponsive());

    expect(result.current.breakpoint).toBe('desktop');
    expect(result.current.isDesktop).toBe(true);
  });

  it('returns wide breakpoint for width 1440', () => {
    setWindowSize(1440, 900);
    const { result } = renderHook(() => useResponsive());

    expect(result.current.breakpoint).toBe('wide');
    expect(result.current.isWide).toBe(true);
  });

  it('has correct boolean flags for each breakpoint', () => {
    setWindowSize(1280, 800);
    const { result } = renderHook(() => useResponsive());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isWide).toBe(false);
  });

  it('updates breakpoint on resize event', () => {
    setWindowSize(375, 812);
    const { result } = renderHook(() => useResponsive());
    expect(result.current.breakpoint).toBe('mobile');

    act(() => {
      setWindowSize(1920, 1080);
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.breakpoint).toBe('wide');
    expect(result.current.isWide).toBe(true);
    expect(result.current.width).toBe(1920);
    expect(result.current.height).toBe(1080);
  });
});
