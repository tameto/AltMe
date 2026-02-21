import { useState, useCallback } from 'react';
import {
  View,
  Modal,
  Pressable,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fontFamily } from '@/src/config/theme';

type ImagePreviewModalProps = {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
};

export function ImagePreviewModal({ visible, imageUrl, onClose }: ImagePreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const imageElement = (
    <Image
      source={{ uri: imageUrl }}
      style={styles.image}
      resizeMode="contain"
      onLoad={handleLoad}
      onError={handleError}
    />
  );

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Close button */}
        <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
          <Feather name="x" size={24} color="#FFFFFF" />
        </Pressable>

        {/* Loading indicator */}
        {isLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#7DD3FC" />
          </View>
        ) : null}

        {/* Error state */}
        {hasError ? (
          <View style={styles.errorContainer}>
            <Feather name="image" size={48} color="#FFFFFF40" />
            <Text style={styles.errorText}>画像を読み込めませんでした</Text>
          </View>
        ) : null}

        {/* Image with pinch-to-zoom */}
        {Platform.OS !== 'web' ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            centerContent
          >
            {imageElement}
          </ScrollView>
        ) : (
          <View style={styles.webImageContainer}>
            {imageElement}
          </View>
        )}

        {/* Tap background to close */}
        <Pressable style={styles.backgroundPressable} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: '#FFFFFF60',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  webImageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundPressable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
});
