import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { fontFamily } from '@/src/config/theme';

type ScrollToBottomFabProps = {
  visible: boolean;
  unreadCount: number;
  onPress: () => void;
};

const BADGE_MAX = 9;

export function ScrollToBottomFab({
  visible,
  unreadCount,
  onPress,
}: ScrollToBottomFabProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.9,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  // Hide from accessibility and pointer events when not visible
  const pointerEvents = visible ? 'auto' : 'none';

  const badgeLabel = unreadCount > BADGE_MAX ? `${BADGE_MAX}+` : String(unreadCount);

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ scale }] }]}
      pointerEvents={pointerEvents}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel="最新メッセージへスクロール"
        style={styles.fab}
      >
        <Feather name="chevron-down" size={24} color="#7DD3FC" />

        {unreadCount > 0 && (
          <View
            style={[
              styles.badge,
              badgeLabel.length > 1 && styles.badgeWide,
            ]}
          >
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 10,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeWide: {
    paddingHorizontal: 5,
    borderRadius: 9,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fontFamily.bold,
    lineHeight: 12,
  },
});
