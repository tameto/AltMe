import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, type ViewStyle } from 'react-native';
import type { MediaPickerResult } from '@/src/shared/types/platform';

type Props = {
  onDrop: (files: MediaPickerResult[]) => void;
  accept?: string[];
  maxFiles?: number;
  maxSizeBytes?: number;
  style?: ViewStyle;
  activeStyle?: ViewStyle;
  children: React.ReactNode;
};

const DEFAULT_MAX_FILES = 5;
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

const mediaTypeFromMime = (
  mime: string,
): 'image' | 'video' | 'audio' => {
  if (mime.startsWith('image')) return 'image';
  if (mime.startsWith('video')) return 'video';
  return 'audio';
};

const isAccepted = (mimeType: string, accept?: string[]): boolean => {
  if (!accept || accept.length === 0) return true;
  return accept.some((pattern) => {
    if (pattern.endsWith('/*')) {
      return mimeType.startsWith(pattern.replace('/*', '/'));
    }
    return mimeType === pattern;
  });
};

export function FileDropZone({
  onDrop,
  accept,
  maxFiles = DEFAULT_MAX_FILES,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  style,
  activeStyle,
  children,
}: Props) {
  // On native, just render children
  if (Platform.OS !== 'web') {
    return <View style={style}>{children}</View>;
  }

  return (
    <FileDropZoneWeb
      onDrop={onDrop}
      accept={accept}
      maxFiles={maxFiles}
      maxSizeBytes={maxSizeBytes}
      style={style}
      activeStyle={activeStyle}
    >
      {children}
    </FileDropZoneWeb>
  );
}

// Separated to avoid conditional hooks
function FileDropZoneWeb({
  onDrop,
  accept,
  maxFiles,
  maxSizeBytes,
  style,
  activeStyle,
  children,
}: Omit<Props, 'maxFiles' | 'maxSizeBytes'> & {
  maxFiles: number;
  maxSizeBytes: number;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const dropRef = useRef<View>(null);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      const dt = e.dataTransfer;
      if (!dt?.files) return;

      const results: MediaPickerResult[] = [];
      const fileList = Array.from(dt.files).slice(0, maxFiles);

      for (const file of fileList) {
        if (file.size > maxSizeBytes) continue;
        if (!isAccepted(file.type, accept)) continue;

        results.push({
          uri: URL.createObjectURL(file),
          type: mediaTypeFromMime(file.type),
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });
      }

      if (results.length > 0) {
        onDrop(results);
      }
    },
    [onDrop, accept, maxFiles, maxSizeBytes],
  );

  useEffect(() => {
    // Access the underlying DOM element via the ref
    const node = (dropRef.current as unknown as { _nativeTag?: HTMLElement })
      ?._nativeTag;
    // For react-native-web, the ref might expose the DOM element directly
    const element =
      node ??
      (dropRef.current as unknown as HTMLElement | null);
    if (!element?.addEventListener) return;

    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDrop);

    return () => {
      element.removeEventListener('dragenter', handleDragEnter);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return (
    <View
      ref={dropRef}
      testID="file-drop-zone"
      style={[
        styles.zone,
        style,
        isDragging && styles.active,
        isDragging && activeStyle,
      ]}
    >
      {children}
      {isDragging && (
        <View style={styles.overlay} testID="file-drop-zone-overlay">
          <Text style={styles.overlayText}>ここにドロップ</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    position: 'relative',
  },
  active: {
    borderColor: '#8B5CF6',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  overlayText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
});
