/**
 * TDD-RED: Twin Screen Real Data Tests
 *
 * These tests define the expected behavior of useTwinData hook
 * BEFORE implementation. All tests should FAIL initially.
 *
 * SDD Spec: Feature 2 (Twin Screen - Real Data Integration)
 * AC-2.1 ~ AC-2.5
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useTwinData } from '../use-twin-data';
import { supabase } from '@/src/services/supabase/client';

// Mock Supabase client
jest.mock('@/src/services/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock useUser hook
jest.mock('@/src/shared/hooks/use-user', () => ({
  useUser: jest.fn(() => ({ id: 'test-user-id' })),
}));

const supabaseMock = supabase as jest.Mocked<typeof supabase>;

const mockPersonalityResult = {
  id: 'pr-1',
  user_id: 'test-user-id',
  personality_traits: {
    openness: 75,
    conscientiousness: 82,
    extraversion: 45,
    agreeableness: 68,
    neuroticism: 35,
  },
  summary: 'Creative and organized individual with introverted tendencies.',
  communication_style: {
    tone: 'friendly',
    formality: 'casual',
  },
  created_at: '2026-02-20T00:00:00Z',
};

describe('useTwinData hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // AC-2.1: personality_results テーブルからユーザーのBig Fiveスコアを取得する
  it('fetches personality_results from Supabase on mount', async () => {
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPersonalityResult,
              error: null,
            }),
          }),
        }),
      }),
    });
    supabaseMock.from.mockReturnValue({ select: selectMock } as never);

    const { result } = renderHook(() => useTwinData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(supabaseMock.from).toHaveBeenCalledWith('personality_results');
    expect(result.current.personalityTraits).toEqual(mockPersonalityResult.personality_traits);
    expect(result.current.summary).toBe(mockPersonalityResult.summary);
  });

  // AC-2.2: データ未取得時はローディングスピナーを表示する
  it('returns loading state while fetching', () => {
    // Set up a promise that doesn't resolve immediately
    const neverResolve = new Promise(() => {});
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue(neverResolve),
          }),
        }),
      }),
    });
    supabaseMock.from.mockReturnValue({ select: selectMock } as never);

    const { result } = renderHook(() => useTwinData());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.personalityTraits).toBeNull();
  });

  // AC-2.3: personality_results が存在しない場合
  it('returns hasData=false when no personality_results exist', async () => {
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'not found' },
            }),
          }),
        }),
      }),
    });
    supabaseMock.from.mockReturnValue({ select: selectMock } as never);

    const { result } = renderHook(() => useTwinData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasData).toBe(false);
    expect(result.current.personalityTraits).toBeNull();
  });

  // AC-2.5: Big Fiveスコアは 0-100 の数値
  it('returns personality traits as 0-100 numeric values', async () => {
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPersonalityResult,
              error: null,
            }),
          }),
        }),
      }),
    });
    supabaseMock.from.mockReturnValue({ select: selectMock } as never);

    const { result } = renderHook(() => useTwinData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const traits = result.current.personalityTraits!;
    expect(traits.openness).toBeGreaterThanOrEqual(0);
    expect(traits.openness).toBeLessThanOrEqual(100);
    expect(traits.conscientiousness).toBeGreaterThanOrEqual(0);
    expect(traits.conscientiousness).toBeLessThanOrEqual(100);
    expect(traits.extraversion).toBeGreaterThanOrEqual(0);
    expect(traits.extraversion).toBeLessThanOrEqual(100);
    expect(traits.agreeableness).toBeGreaterThanOrEqual(0);
    expect(traits.agreeableness).toBeLessThanOrEqual(100);
    expect(traits.neuroticism).toBeGreaterThanOrEqual(0);
    expect(traits.neuroticism).toBeLessThanOrEqual(100);
  });

  // AC-2.4: SOUL.md 取得
  it('fetches soul_md from openclaw instance', async () => {
    // First setup personality_results fetch
    const personalitySelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPersonalityResult,
              error: null,
            }),
          }),
        }),
      }),
    });

    const openclawSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { soul_md: '# My SOUL.md\nI am creative and organized.' },
          error: null,
        }),
      }),
    });

    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'personality_results') {
        return { select: personalitySelect } as never;
      }
      if (table === 'openclaw_instances') {
        return { select: openclawSelect } as never;
      }
      return {} as never;
    });

    const { result } = renderHook(() => useTwinData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // fetchSoulMd should be callable
    expect(typeof result.current.fetchSoulMd).toBe('function');

    let soulMd: string | null = null;
    await act(async () => {
      soulMd = await result.current.fetchSoulMd();
    });

    expect(soulMd).toBe('# My SOUL.md\nI am creative and organized.');
  });

  it('handles fetch error gracefully', async () => {
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: '500', message: 'Internal server error' },
            }),
          }),
        }),
      }),
    });
    supabaseMock.from.mockReturnValue({ select: selectMock } as never);

    const { result } = renderHook(() => useTwinData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.personalityTraits).toBeNull();
  });

  // TDD RED: 性格トレイトデータを正しく返すこと（全5トレイトが存在する）
  it('returns all five personality traits with correct keys', async () => {
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPersonalityResult,
              error: null,
            }),
          }),
        }),
      }),
    });
    supabaseMock.from.mockReturnValue({ select: selectMock } as never);

    const { result } = renderHook(() => useTwinData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const traits = result.current.personalityTraits!;
    expect(traits).toHaveProperty('openness');
    expect(traits).toHaveProperty('conscientiousness');
    expect(traits).toHaveProperty('extraversion');
    expect(traits).toHaveProperty('agreeableness');
    expect(traits).toHaveProperty('neuroticism');
  });

  // TDD RED: fetchSoulMdがデータなし時にnullを返すこと
  it('fetchSoulMd returns null when no openclaw_instances record exists', async () => {
    const personalitySelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPersonalityResult,
              error: null,
            }),
          }),
        }),
      }),
    });

    const openclawSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'not found' },
        }),
      }),
    });

    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'personality_results') {
        return { select: personalitySelect } as never;
      }
      if (table === 'openclaw_instances') {
        return { select: openclawSelect } as never;
      }
      return {} as never;
    });

    const { result } = renderHook(() => useTwinData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let soulMd: string | null = 'not-null';
    await act(async () => {
      soulMd = await result.current.fetchSoulMd();
    });

    expect(soulMd).toBeNull();
  });

  // TDD RED: ローディング完了後にhasData=trueとなること
  it('sets hasData=true when personality_results exist', async () => {
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPersonalityResult,
              error: null,
            }),
          }),
        }),
      }),
    });
    supabaseMock.from.mockReturnValue({ select: selectMock } as never);

    const { result } = renderHook(() => useTwinData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasData).toBe(true);
    expect(result.current.summary).toBe(mockPersonalityResult.summary);
  });
});
