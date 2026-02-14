import { useUser } from '../use-user';
import type { UserProfile } from '../../types/user';

const mockUser: UserProfile = {
  id: 'user-123',
  displayName: 'Test User',
  ageRange: '25-34',
  locale: 'ja',
  timezone: 'Asia/Tokyo',
  onboardingCompleted: false,
  twinName: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('useUser store', () => {
  beforeEach(() => {
    useUser.getState().reset();
  });

  it('starts with null user and loading true', () => {
    const state = useUser.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(true);
  });

  it('setUser sets user and stops loading', () => {
    useUser.getState().setUser(mockUser);
    const state = useUser.getState();

    expect(state.user).toEqual(mockUser);
    expect(state.isLoading).toBe(false);
  });

  it('updateUser merges partial updates', () => {
    useUser.getState().setUser(mockUser);
    useUser.getState().updateUser({ displayName: 'New Name', twinName: 'MyTwin' });

    const state = useUser.getState();
    expect(state.user?.displayName).toBe('New Name');
    expect(state.user?.twinName).toBe('MyTwin');
    expect(state.user?.id).toBe('user-123');
  });

  it('updateUser does nothing when user is null', () => {
    useUser.getState().updateUser({ displayName: 'New Name' });
    expect(useUser.getState().user).toBeNull();
  });

  it('reset clears user and sets loading', () => {
    useUser.getState().setUser(mockUser);
    useUser.getState().reset();

    const state = useUser.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(true);
  });

  it('setUser with null clears the user', () => {
    useUser.getState().setUser(mockUser);
    useUser.getState().setUser(null);

    expect(useUser.getState().user).toBeNull();
  });
});
