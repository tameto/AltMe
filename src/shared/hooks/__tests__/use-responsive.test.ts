import { getBreakpoint, BREAKPOINTS } from '../use-responsive';

describe('BREAKPOINTS', () => {
  it('defines correct breakpoint thresholds', () => {
    expect(BREAKPOINTS.tablet).toBe(768);
    expect(BREAKPOINTS.desktop).toBe(1024);
    expect(BREAKPOINTS.wide).toBe(1440);
  });
});

describe('getBreakpoint', () => {
  it('returns mobile for width < 768', () => {
    expect(getBreakpoint(0)).toBe('mobile');
    expect(getBreakpoint(375)).toBe('mobile');
    expect(getBreakpoint(767)).toBe('mobile');
  });

  it('returns tablet for width 768-1023', () => {
    expect(getBreakpoint(768)).toBe('tablet');
    expect(getBreakpoint(900)).toBe('tablet');
    expect(getBreakpoint(1023)).toBe('tablet');
  });

  it('returns desktop for width 1024-1439', () => {
    expect(getBreakpoint(1024)).toBe('desktop');
    expect(getBreakpoint(1280)).toBe('desktop');
    expect(getBreakpoint(1439)).toBe('desktop');
  });

  it('returns wide for width >= 1440', () => {
    expect(getBreakpoint(1440)).toBe('wide');
    expect(getBreakpoint(1920)).toBe('wide');
    expect(getBreakpoint(2560)).toBe('wide');
  });

  it('handles exact boundary values correctly', () => {
    expect(getBreakpoint(767)).toBe('mobile');
    expect(getBreakpoint(768)).toBe('tablet');
    expect(getBreakpoint(1023)).toBe('tablet');
    expect(getBreakpoint(1024)).toBe('desktop');
    expect(getBreakpoint(1439)).toBe('desktop');
    expect(getBreakpoint(1440)).toBe('wide');
  });
});
