import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fontFamily } from '@/src/config/theme';

export type ContextMenuAction = 'copy' | 'reply' | 'translate';

type MessageContextMenuProps = {
  visible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAction: (action: ContextMenuAction) => void;
  messageContent: string;
};

type MenuItem = {
  action: ContextMenuAction;
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
};

const MENU_WIDTH = 160;
const MENU_HEIGHT = 148; // 3 items × ~48px + borders
const SCREEN_PADDING = 8;

const MENU_ITEMS: MenuItem[] = [
  { action: 'copy', icon: 'copy', label: 'コピー' },
  { action: 'reply', icon: 'corner-up-left', label: '返信' },
  { action: 'translate', icon: 'globe', label: '翻訳' },
];

export function MessageContextMenu({
  visible,
  position,
  onClose,
  onAction,
}: MessageContextMenuProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 300,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  // メニューが画面内に収まるよう座標を調整
  const adjustedX = Math.min(
    Math.max(SCREEN_PADDING, position.x - MENU_WIDTH / 2),
    screenWidth - MENU_WIDTH - SCREEN_PADDING
  );
  const adjustedY =
    position.y + MENU_HEIGHT > screenHeight - SCREEN_PADDING
      ? position.y - MENU_HEIGHT - 8
      : position.y + 8;

  const handleAction = (action: ContextMenuAction) => {
    onAction(action);
    onClose();
  };

  // web 側は backdropFilter をスタイルオブジェクトで付与
  const menuContainerStyle =
    Platform.OS === 'web'
      ? ([styles.menuContainer, { backdropFilter: 'blur(12px)' }] as object)
      : styles.menuContainer;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* 背景タップで閉じる */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* メニュー本体 — 内部タップはバブリング停止 */}
        <Pressable
          style={[styles.menuWrapper, { left: adjustedX, top: adjustedY }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Animated.View style={[menuContainerStyle, { transform: [{ scale: scaleAnim }] }]}>
            {MENU_ITEMS.map((item, index) => (
              <View key={item.action}>
                {index > 0 && <View style={styles.separator} />}
                <Pressable
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed,
                  ]}
                  onPress={() => handleAction(item.action)}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <Feather name={item.icon} size={16} color="#F0F0F0" style={styles.menuIcon} />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </Pressable>
              </View>
            ))}
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuWrapper: {
    position: 'absolute',
    width: MENU_WIDTH,
  },
  menuContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    // Android elevation
    elevation: 12,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuIcon: {
    marginRight: 10,
  },
  menuLabel: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: '#F0F0F0',
  },
});
