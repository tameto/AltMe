import React from 'react';
import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { MediaPickerResult } from '@/src/shared/types/platform';

type Props = {
  onPick: (result: MediaPickerResult) => void;
  accept?: string;
  maxSizeBytes?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
};

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

const mediaTypeFromAccept = (
  accept?: string,
): ImagePicker.MediaTypeOptions => {
  if (!accept) return ImagePicker.MediaTypeOptions.Images;
  if (accept.includes('video')) return ImagePicker.MediaTypeOptions.Videos;
  if (accept.includes('image')) return ImagePicker.MediaTypeOptions.Images;
  return ImagePicker.MediaTypeOptions.All;
};

export function MediaPicker({
  onPick,
  accept,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  style,
  children,
}: Props) {
  const handlePress = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaTypeFromAccept(accept),
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > maxSizeBytes) return;

    const picked: MediaPickerResult = {
      uri: asset.uri,
      type: asset.type === 'video' ? 'video' : 'image',
      fileName: asset.fileName ?? null,
      fileSize: asset.fileSize ?? null,
      mimeType: asset.mimeType ?? null,
      width: asset.width,
      height: asset.height,
      duration: asset.duration ?? undefined,
    };
    onPick(picked);
  };

  return (
    <Pressable
      testID="media-picker"
      onPress={handlePress}
      style={[styles.container, style]}
    >
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
