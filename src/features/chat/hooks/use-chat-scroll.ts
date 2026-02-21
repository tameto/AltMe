import { useRef, useEffect, useState, useCallback } from 'react';
import { FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

export type UseChatScrollReturn = {
  flatListRef: React.RefObject<FlatList | null>;
  showScrollToBottom: boolean;
  scrollToBottom: () => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const NEAR_BOTTOM_THRESHOLD = 500; // pixels from bottom

export function useChatScroll(
  deps: { messageCount: number; streamingText: string },
): UseChatScrollReturn {
  const flatListRef = useRef<FlatList>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const isNearBottom = useRef(true);

  // Auto-scroll to bottom when new messages arrive (only if already near bottom)
  useEffect(() => {
    if (isNearBottom.current && (deps.messageCount > 0 || deps.streamingText)) {
      const id = setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      return () => clearTimeout(id);
    }
  }, [deps.messageCount, deps.streamingText]);

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowScrollToBottom(false);
    isNearBottom.current = true;
  }, []);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - contentOffset.y - layoutMeasurement.height;

    const nearBottom = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;
    isNearBottom.current = nearBottom;
    setShowScrollToBottom(!nearBottom);
  }, []);

  return { flatListRef, showScrollToBottom, scrollToBottom, onScroll };
}
