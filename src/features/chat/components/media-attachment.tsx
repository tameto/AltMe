import { useState, useCallback } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fontFamily, borderRadius } from '@/src/config/theme';
import { ImagePreviewModal } from './image-preview-modal';
import type { ChatAttachment } from '@/src/shared/types/chat';

type MediaAttachmentProps = {
  attachment: ChatAttachment;
  onPress?: () => void;
};

export function MediaAttachment({ attachment, onPress }: MediaAttachmentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  const handleLoad = useCallback(() => setIsLoading(false), []);
  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    } else {
      setPreviewVisible(true);
    }
  }, [onPress]);

  const handleClosePreview = useCallback(() => {
    setPreviewVisible(false);
  }, []);

  if (attachment.type !== 'image') {
    return null;
  }

  return (
    <>
      <Pressable onPress={handlePress} style={styles.container}>
        {hasError ? (
          <View style={styles.errorPlaceholder}>
            <Feather name="image" size={24} color="#FFFFFF40" />
            <Text style={styles.errorText}>画像を読み込めません</Text>
          </View>
        ) : (
          <>
            <Image
              source={{ uri: attachment.url }}
              style={styles.image}
              resizeMode="cover"
              onLoad={handleLoad}
              onError={handleError}
            />
            {isLoading ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#7DD3FC" />
              </View>
            ) : null}
          </>
        )}
      </Pressable>

      <ImagePreviewModal
        visible={previewVisible}
        imageUrl={attachment.url}
        onClose={handleClosePreview}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  image: {
    width: 220,
    height: 160,
    borderRadius: borderRadius.sm,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  errorPlaceholder: {
    width: 220,
    height: 120,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#FFFFFF40',
  },
});
