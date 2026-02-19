/**
 * TDD-RED: Community Service Client Tests
 *
 * These tests define the expected behavior of community service functions
 * BEFORE implementation. All tests should FAIL initially.
 *
 * SDD Spec: Feature 3 (Community Feature)
 * AC-3.7 ~ AC-3.12
 */

import {
  listCommunities,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityMessages,
} from '../client';
import { supabase } from '@/src/services/supabase/client';

// Mock Supabase client
jest.mock('@/src/services/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  },
}));

const supabaseMock = supabase as jest.Mocked<typeof supabase>;

const mockCommunity = {
  id: 'comm-1',
  creator_id: 'user-1',
  name: 'Test Community',
  description: 'A test community',
  language: 'jp',
  category: 'casual',
  thumbnail_url: null,
  is_default_thumbnail: true,
  member_count: 5,
  is_active: true,
  created_at: '2026-02-20T00:00:00Z',
  updated_at: '2026-02-20T00:00:00Z',
};

const mockMessage = {
  id: 'msg-1',
  community_id: 'comm-1',
  agent_user_id: 'user-1',
  content: 'Hello from my twin!',
  is_autonomous: false,
  created_at: '2026-02-20T00:00:00Z',
};

describe('Community Service Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // AC-3.8: listCommunities
  describe('listCommunities', () => {
    it('fetches communities list with member count', async () => {
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [mockCommunity, { ...mockCommunity, id: 'comm-2', name: 'Second Community' }],
              error: null,
            }),
          }),
        }),
      });
      supabaseMock.from.mockReturnValue({ select: selectMock } as never);

      const result = await listCommunities();

      expect(supabaseMock.from).toHaveBeenCalledWith('communities');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Test Community');
      expect(result[0].memberCount).toBe(5);
    });

    it('returns empty array on error', async () => {
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'DB error' },
            }),
          }),
        }),
      });
      supabaseMock.from.mockReturnValue({ select: selectMock } as never);

      const result = await listCommunities();

      expect(result).toEqual([]);
    });
  });

  // AC-3.9: createCommunity
  describe('createCommunity', () => {
    it('creates a community with valid data', async () => {
      const insertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockCommunity,
            error: null,
          }),
        }),
      });
      supabaseMock.from.mockReturnValue({ insert: insertMock } as never);

      const result = await createCommunity({
        name: 'Test Community',
        description: 'A test community',
        language: 'jp',
        category: 'casual',
      });

      expect(supabaseMock.from).toHaveBeenCalledWith('communities');
      expect(result).toBeTruthy();
      expect(result!.name).toBe('Test Community');
    });

    it('returns null on creation error', async () => {
      const insertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Insert failed' },
          }),
        }),
      });
      supabaseMock.from.mockReturnValue({ insert: insertMock } as never);

      const result = await createCommunity({
        name: '',
        description: '',
        language: 'jp',
        category: 'casual',
      });

      expect(result).toBeNull();
    });
  });

  // AC-3.10: joinCommunity
  describe('joinCommunity', () => {
    it('allows user to join a community', async () => {
      const insertMock = jest.fn().mockResolvedValue({
        data: { id: 'member-1', community_id: 'comm-1', user_id: 'test-user-id' },
        error: null,
      });
      supabaseMock.from.mockReturnValue({ insert: insertMock } as never);

      const success = await joinCommunity('comm-1');

      expect(supabaseMock.from).toHaveBeenCalledWith('community_members');
      expect(success).toBe(true);
    });

    it('returns false on duplicate join (unique constraint)', async () => {
      const insertMock = jest.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key value' },
      });
      supabaseMock.from.mockReturnValue({ insert: insertMock } as never);

      const success = await joinCommunity('comm-1');

      expect(success).toBe(false);
    });
  });

  // AC-3.11: leaveCommunity
  describe('leaveCommunity', () => {
    it('allows user to leave a community', async () => {
      const deleteMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });
      supabaseMock.from.mockReturnValue({ delete: deleteMock } as never);

      const success = await leaveCommunity('comm-1');

      expect(supabaseMock.from).toHaveBeenCalledWith('community_members');
      expect(success).toBe(true);
    });
  });

  // AC-3.12: getCommunityMessages
  describe('getCommunityMessages', () => {
    it('fetches community messages in order', async () => {
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [mockMessage, { ...mockMessage, id: 'msg-2', content: 'Reply' }],
              error: null,
            }),
          }),
        }),
      });
      supabaseMock.from.mockReturnValue({ select: selectMock } as never);

      const messages = await getCommunityMessages('comm-1');

      expect(supabaseMock.from).toHaveBeenCalledWith('community_messages');
      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('Hello from my twin!');
    });

    it('returns empty array on error', async () => {
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Fetch error' },
            }),
          }),
        }),
      });
      supabaseMock.from.mockReturnValue({ select: selectMock } as never);

      const messages = await getCommunityMessages('comm-1');

      expect(messages).toEqual([]);
    });
  });
});
