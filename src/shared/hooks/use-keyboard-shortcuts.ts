import { useEffect } from 'react';
import { Platform } from 'react-native';
import type { WebKeyboardShortcut } from '@/src/shared/types/platform';

/**
 * Registers keyboard shortcuts for web.
 * On native this is a no-op.
 * Ignores events during IME composition.
 */
export const useKeyboardShortcuts = (shortcuts: WebKeyboardShortcut[]): void => {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore IME composition
      if (event.isComposing || event.keyCode === 229) return;

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift
          ? event.shiftKey
          : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (
          event.key === shortcut.key &&
          ctrlMatch &&
          shiftMatch &&
          altMatch
        ) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
