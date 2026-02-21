import { Platform } from 'react-native';

// Must be set before importing the hook
Object.defineProperty(Platform, 'OS', { value: 'web', writable: true, configurable: true });

import { renderHook } from '@testing-library/react-native';
import { usePageTitle } from '../use-page-title';

describe('usePageTitle', () => {
  const originalTitle = document.title;

  afterEach(() => {
    document.title = originalTitle;
  });

  it('sets document.title with app name suffix', () => {
    renderHook(() => usePageTitle('Chat'));
    expect(document.title).toBe('Chat | AltMe');
  });

  it('sets document.title to app name when no title provided', () => {
    renderHook(() => usePageTitle());
    expect(document.title).toBe('AltMe');
  });

  it('updates document.title when title changes', () => {
    const { rerender } = renderHook(
      ({ title }: { title: string }) => usePageTitle(title),
      { initialProps: { title: 'Chat' } },
    );
    expect(document.title).toBe('Chat | AltMe');

    rerender({ title: 'Journal' });
    expect(document.title).toBe('Journal | AltMe');
  });
});
