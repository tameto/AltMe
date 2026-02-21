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

// Mock URL.createObjectURL
URL.createObjectURL = jest.fn(() => 'blob:clipboard-url');

import { useClipboardPaste } from '../use-clipboard-paste';

describe('useClipboardPaste (Web)', () => {
  it('calls onPaste when an image is pasted', () => {
    const onPaste = jest.fn();
    renderHook(() => useClipboardPaste(onPaste));

    const file = new File(['img'], 'pasted.png', { type: 'image/png' });
    const pasteEvent = new Event('paste', { bubbles: true }) as ClipboardEvent;
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        items: [
          {
            type: 'image/png',
            getAsFile: () => file,
          },
        ],
      },
    });

    document.dispatchEvent(pasteEvent);

    expect(onPaste).toHaveBeenCalledWith({
      uri: 'blob:clipboard-url',
      type: 'image',
      fileName: 'pasted.png',
      fileSize: 3,
      mimeType: 'image/png',
    });
  });

  it('ignores text-only paste events', () => {
    const onPaste = jest.fn();
    renderHook(() => useClipboardPaste(onPaste));

    const pasteEvent = new Event('paste', { bubbles: true }) as ClipboardEvent;
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        items: [
          {
            type: 'text/plain',
            getAsFile: () => null,
          },
        ],
      },
    });

    document.dispatchEvent(pasteEvent);

    expect(onPaste).not.toHaveBeenCalled();
  });

  it('is a no-op on native (no listener added)', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true });

    const addSpy = jest.spyOn(document, 'addEventListener');
    const onPaste = jest.fn();
    renderHook(() => useClipboardPaste(onPaste));

    // Should not add event listener on native
    const pasteListeners = addSpy.mock.calls.filter(
      ([event]) => event === 'paste',
    );
    expect(pasteListeners).toHaveLength(0);

    addSpy.mockRestore();
    Object.defineProperty(Platform, 'OS', { value: 'web', writable: true });
  });
});
