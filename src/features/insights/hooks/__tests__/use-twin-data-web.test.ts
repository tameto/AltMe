/**
 * useTwinData hook — Web テスト（M121）
 *
 * Web プラットフォームでの動作確認。
 * Supabase クライアントは Web でも同じ実装を使用するため、
 * hook の API サーフェスと基本動作を検証する。
 *
 * jest.config.ts の "web" project にマッチ: *-web.test.ts
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useTwinData } from '../use-twin-data';
import { supabase } from '@/src/services/supabase/client';

jest.mock('@/src/services/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/src/shared/hooks/use-user', () => ({
  useUser: jest.fn(() => ({ id: 'web-user-id' })),
}));

const supabaseMock = supabase as jest.Mocked<typeof supabase>;

const mockPersonalityResult = {
  personality_traits: {
    openness: 80,
    conscientiousness: 70,
    extraversion: 60,
    agreeableness: 90,
    neuroticism: 25,
  },
  summary: 'Web user personality summary.',
};

function mockPersonalityFetch(data: unknown | null, errorCode?: string) {
  supabaseMock.from.mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: errorCode ? null : data,
              error: errorCode ? { code: errorCode, message: 'error' } : null,
            }),
          }),
        }),
      }),
    }),
  } as never);
}

describe('useTwinData — Web', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // M121: hook API サーフェス確認
  it('必要な全プロパティを返す', async () => {
    mockPersonalityFetch(mockPersonalityResult);
    const { result } = renderHook(() => useTwinData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('personalityTraits');
    expect(result.current).toHaveProperty('summary');
    expect(result.current).toHaveProperty('hasData');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('fetchSoulMd');
    expect(typeof result.current.fetchSoulMd).toBe('function');
  });

  // M121: Web でも Supabase からデータを正しく取得する
  it('personality_results を正しく取得する', async () => {
    mockPersonalityFetch(mockPersonalityResult);
    const { result } = renderHook(() => useTwinData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasData).toBe(true);
    expect(result.current.personalityTraits).toEqual(mockPersonalityResult.personality_traits);
    expect(result.current.summary).toBe(mockPersonalityResult.summary);
  });

  // M121: データなし時の動作
  it('データなし（PGRST116）時に hasData=false を返す', async () => {
    mockPersonalityFetch(null, 'PGRST116');
    const { result } = renderHook(() => useTwinData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasData).toBe(false);
    expect(result.current.personalityTraits).toBeNull();
    expect(result.current.error).toBeNull();
  });

  // M121: OpenClaw ステータス — SOUL.md 取得
  it('fetchSoulMd は openclaw_instances から soul_md を取得する', async () => {
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
          data: { soul_md: '# SOUL.md Web version' },
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

    let soulMd: string | null = null;
    await act(async () => {
      soulMd = await result.current.fetchSoulMd();
    });

    expect(soulMd).toBe('# SOUL.md Web version');
  });

  // M121: エラー時の graceful 処理
  it('Supabase エラー時に error を設定する', async () => {
    supabaseMock.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
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
      }),
    } as never);

    const { result } = renderHook(() => useTwinData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Internal server error');
    expect(result.current.personalityTraits).toBeNull();
  });
});
