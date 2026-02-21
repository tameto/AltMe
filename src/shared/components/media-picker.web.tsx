import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import type { MediaPickerResult } from '@/src/shared/types/platform';

type Props = {
  onPick: (result: MediaPickerResult) => void;
  accept?: string;
  maxSizeBytes?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
};

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function MediaPicker({
  onPick,
  accept = 'image/*',
  maxSizeBytes = DEFAULT_MAX_SIZE,
  style,
  children,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > maxSizeBytes) return;

    const result: MediaPickerResult = {
      uri: URL.createObjectURL(file),
      type: file.type.startsWith('image')
        ? 'image'
        : file.type.startsWith('video')
          ? 'video'
          : 'audio',
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    };
    onPick(result);

    // Reset input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Pressable
      testID="media-picker"
      onPress={() => inputRef.current?.click()}
      style={[styles.container, style]}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
        data-testid="media-picker-input"
      />
      {children || <Text style={styles.text}>ファイルを選択</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  text: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
});
