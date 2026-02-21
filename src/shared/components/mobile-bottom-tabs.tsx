import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';

import { colors, fontFamily, fontSize, spacing, tabBarColors } from '@/src/config/theme';
import { useChatStore } from '@/src/features/chat/stores/chat-store';

type TabItem = {
  key: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  labelKey: string;
  route: string;
};

const TAB_ITEMS: TabItem[] = [
  { key: 'chat', icon: 'message-circle', labelKey: 'tabs.chat', route: '/(tabs)' },
  { key: 'community', icon: 'users', labelKey: 'tabs.community', route: '/(tabs)/community' },
  { key: 'twin', icon: 'cpu', labelKey: 'tabs.myAgent', route: '/(tabs)/twin' },
  { key: 'settings', icon: 'user', labelKey: 'tabs.myPage', route: '/(tabs)/settings' },
];

const isActiveRoute = (pathname: string, route: string): boolean => {
  if (route === '/(tabs)') {
    return pathname === '/(tabs)' || pathname === '/(tabs)/index' || pathname === '/';
  }
  return pathname.startsWith(route);
};

export const MobileBottomTabs = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const unreadCount = useChatStore((s) => s.unreadCount);

  const getBadgeLabel = (key: string): string | null => {
    if (key !== 'chat' || unreadCount === 0) return null;
    return unreadCount > 9 ? '9+' : String(unreadCount);
  };

  return (
    <View style={styles.container} testID="mobile-bottom-tabs">
      {TAB_ITEMS.map((item) => {
        const active = isActiveRoute(pathname, item.route);
        const badgeLabel = getBadgeLabel(item.key);
        return (
          <Pressable
            key={item.key}
            style={styles.tabItem}
            onPress={() => router.push(item.route as '/(tabs)')}
            testID={`tab-${item.key}`}
            accessibilityRole="tab"
            accessibilityLabel={t(item.labelKey)}
            accessibilityState={{ selected: active }}
          >
            <View style={styles.iconWrapper}>
              <Feather
                name={item.icon}
                size={22}
                color={active ? tabBarColors.active : tabBarColors.inactive}
              />
              {badgeLabel !== null && (
                <View style={styles.badge} testID="chat-unread-badge">
                  <Text style={styles.badgeText}>{badgeLabel}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: active ? tabBarColors.active : tabBarColors.inactive },
              ]}
            >
              {t(item.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: tabBarColors.background,
    borderTopWidth: 1,
    borderTopColor: tabBarColors.border,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: 2,
  },
  tabLabel: {
    fontSize: fontSize.xs - 1,
    fontFamily: fontFamily.medium,
  },
  iconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fontFamily.bold,
    lineHeight: 14,
  },
});
