import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import type { MediaPickerResult } from '@/src/shared/types/platform';

type ClipboardPasteCallback = (result: MediaPickerResult) => void;

/**
 * Listens for paste events and extracts image files from clipboard.
 * Web-only: on native this is a no-op.
 */
export const useClipboardPaste = (onPaste: ClipboardPasteCallback): void => {
  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.type.startsWith('image/')) continue;

        const file = item.getAsFile();
        if (!file) continue;

        const result: MediaPickerResult = {
          uri: URL.createObjectURL(file),
          type: 'image',
          fileName: file.name || 'pasted-image',
          fileSize: file.size,
          mimeType: file.type,
        };
        onPaste(result);
        return; // Only handle the first image
      }
    },
    [onPaste],
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);
};
