import { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { colors, fontFamily, spacing } from '@/src/config/theme';
import { validateFileSize } from '../services/media-upload';

type ImagePickerAsset = ImagePicker.ImagePickerAsset;

type MediaPickerProps = {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (asset: ImagePickerAsset) => void;
};

const MAX_FILE_SIZE_MB = 10;

export function MediaPicker({ visible, onClose, onImageSelected }: MediaPickerProps) {
  const handlePickFromLibrary = useCallback(async () => {
    onClose();

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', 'フォトライブラリへのアクセス権限が必要です。');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.fileSize !== undefined && !validateFileSize(asset.fileSize)) {
        Alert.alert(
          'ファイルサイズ超過',
          `画像のサイズが${MAX_FILE_SIZE_MB}MBを超えています。より小さい画像を選択してください。`,
        );
        return;
      }
      onImageSelected(asset);
    }
  }, [onClose, onImageSelected]);

  const handleTakePhoto = useCallback(async () => {
    onClose();

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', 'カメラへのアクセス権限が必要です。');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.fileSize !== undefined && !validateFileSize(asset.fileSize)) {
        Alert.alert(
          'ファイルサイズ超過',
          `画像のサイズが${MAX_FILE_SIZE_MB}MBを超えています。`,
        );
        return;
      }
      onImageSelected(asset);
    }
  }, [onClose, onImageSelected]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Pressable style={styles.option} onPress={handlePickFromLibrary}>
            <Feather name="image" size={20} color={colors.primary} />
            <Text style={styles.optionText}>写真を選択</Text>
          </Pressable>

          {Platform.OS !== 'web' ? (
            <Pressable style={styles.option} onPress={handleTakePhoto}>
              <Feather name="camera" size={20} color={colors.primary} />
              <Text style={styles.optionText}>写真を撮影</Text>
            </Pressable>
          ) : null}

          <View style={styles.divider} />

          <Pressable style={styles.cancelOption} onPress={onClose}>
            <Text style={styles.cancelText}>キャンセル</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingBottom: 34,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  optionText: {
    fontSize: 16,
    fontFamily: fontFamily.medium,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  cancelOption: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
});
