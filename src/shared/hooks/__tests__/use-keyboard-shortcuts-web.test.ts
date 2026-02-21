/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';

// Force web platform
const originalOS = Platform.OS;
beforeAll(() => {
  Object.defineProperty(Platform, 'OS', { value: 'web', writable: true });
});
afterAll(() => {
  Object.defineProperty(Platform, 'OS', { value: originalOS, writable: true });
});

import { useKeyboardShortcuts } from '../use-keyboard-shortcuts';
import type { WebKeyboardShortcut } from '@/src/shared/types/platform';

const fireKeyDown = (props: Partial<KeyboardEventInit>) => {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    ...props,
  });
  document.dispatchEvent(event);
  return event;
};

describe('useKeyboardShortcuts (Web)', () => {
  it('fires action on Enter key press', () => {
    const action = jest.fn();
    const shortcuts: WebKeyboardShortcut[] = [
      { key: 'Enter', action, description: 'Send message' },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));
    fireKeyDown({ key: 'Enter' });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('does not fire action on Shift+Enter', () => {
    const action = jest.fn();
    const shortcuts: WebKeyboardShortcut[] = [
      { key: 'Enter', action, description: 'Send message' },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));
    fireKeyDown({ key: 'Enter', shiftKey: true });

    expect(action).not.toHaveBeenCalled();
  });

  it('ignores keydown during IME composition', () => {
    const action = jest.fn();
    const shortcuts: WebKeyboardShortcut[] = [
      { key: 'Enter', action, description: 'Send message' },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate IME composition
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    // isComposing is read-only so we use defineProperty
    Object.defineProperty(event, 'isComposing', { value: true });
    document.dispatchEvent(event);

    expect(action).not.toHaveBeenCalled();
  });

  it('fires action on Escape key press', () => {
    const action = jest.fn();
    const shortcuts: WebKeyboardShortcut[] = [
      { key: 'Escape', action, description: 'Close modal' },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));
    fireKeyDown({ key: 'Escape' });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('matches Ctrl modifier correctly', () => {
    const action = jest.fn();
    const shortcuts: WebKeyboardShortcut[] = [
      { key: 's', ctrl: true, action, description: 'Save' },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Without ctrl — should not fire
    fireKeyDown({ key: 's' });
    expect(action).not.toHaveBeenCalled();

    // With ctrl — should fire
    fireKeyDown({ key: 's', ctrlKey: true });
    expect(action).toHaveBeenCalledTimes(1);
  });
});
