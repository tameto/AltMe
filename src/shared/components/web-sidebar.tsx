import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';

import { colors, fontFamily, fontSize, spacing, borderRadius } from '@/src/config/theme';
import { useResponsive } from '@/src/shared/hooks/use-responsive';
import { useUser } from '@/src/shared/hooks/use-user';
import { useIsPro } from '@/src/shared/hooks/use-platform-subscription';
import { useChatStore } from '@/src/features/chat/stores/chat-store';

type NavItem = {
  key: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  labelKey: string;
  route: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'chat', icon: 'message-circle', labelKey: 'tabs.chat', route: '/(tabs)' },
  { key: 'community', icon: 'users', labelKey: 'tabs.community', route: '/(tabs)/community' },
  { key: 'twin', icon: 'cpu', labelKey: 'tabs.myAgent', route: '/(tabs)/twin' },
  { key: 'settings', icon: 'user', labelKey: 'tabs.myPage', route: '/(tabs)/settings' },
];

type WebSidebarProps = {
  collapsed?: boolean;
};

const isActiveRoute = (pathname: string, route: string): boolean => {
  // Chat tab: index route
  if (route === '/(tabs)') {
    return pathname === '/(tabs)' || pathname === '/(tabs)/index' || pathname === '/';
  }
  return pathname.startsWith(route);
};

export const WebSidebar = ({ collapsed: collapsedProp }: WebSidebarProps) => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { isTablet, isDesktop, isWide } = useResponsive();
  const user = useUser((s) => s.user);
  const isPro = useIsPro();
  const unreadCount = useChatStore((s) => s.unreadCount);
  const chatBadgeLabel = unreadCount > 9 ? '9+' : unreadCount > 0 ? String(unreadCount) : null;

  // Auto-collapse on tablet unless explicitly set
  const collapsed = collapsedProp ?? isTablet;
  const isExpanded = !collapsed && (isDesktop || isWide);

  const handleNavPress = (route: string) => {
    router.push(route as '/(tabs)');
  };

  const displayName = user?.displayName || user?.twinName || t('settings.guest');

  return (
    <View
      style={[styles.container, isExpanded ? styles.expanded : styles.collapsedContainer]}
      testID="web-sidebar"
    >
      {/* Logo / Brand */}
      <View style={styles.brandSection}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>A</Text>
        </View>
        {isExpanded && <Text style={styles.brandName}>AltMe</Text>}
      </View>

      {/* Navigation */}
      <View style={styles.navSection}>
        {NAV_ITEMS.map((item) => {
          const active = isActiveRoute(pathname, item.route);
          return (
            <Pressable
              key={item.key}
              style={[
                styles.navItem,
                active && styles.navItemActive,
                !isExpanded && styles.navItemCollapsed,
              ]}
              onPress={() => handleNavPress(item.route)}
              testID={`sidebar-nav-${item.key}`}
              accessibilityRole="button"
              accessibilityLabel={t(item.labelKey)}
              accessibilityState={{ selected: active }}
            >
              <View style={styles.iconWrapper}>
                <Feather
                  name={item.icon}
                  size={20}
                  color={active ? colors.secondary : colors.textSecondary}
                />
                {item.key === 'chat' && chatBadgeLabel !== null && !isExpanded && (
                  <View style={styles.badge} testID="sidebar-chat-unread-badge">
                    <Text style={styles.badgeText}>{chatBadgeLabel}</Text>
                  </View>
                )}
              </View>
              {isExpanded && (
                <View style={styles.navLabelRow}>
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                    {t(item.labelKey)}
                  </Text>
                  {item.key === 'chat' && chatBadgeLabel !== null && (
                    <View style={styles.badgeInline} testID="sidebar-chat-unread-badge-expanded">
                      <Text style={styles.badgeText}>{chatBadgeLabel}</Text>
                    </View>
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* User Section */}
      <View style={styles.userSection}>
        <View style={[styles.avatarCircle, isPro && styles.avatarCirclePro]}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        {isExpanded && (
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={[styles.planBadge, isPro ? styles.planBadgePro : styles.planBadgeFree]}>
              <Text style={[styles.planBadgeText, isPro ? styles.planBadgeTextPro : styles.planBadgeTextFree]}>
                {isPro ? 'Pro' : 'Free'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const SIDEBAR_WIDTH_EXPANDED = 240;
const SIDEBAR_WIDTH_COLLAPSED = 64;

export { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED };

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundSecondary,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: spacing.lg,
    justifyContent: 'space-between',
  },
  expanded: {
    width: SIDEBAR_WIDTH_EXPANDED,
    paddingHorizontal: spacing.md,
  },
  collapsedContainer: {
    width: SIDEBAR_WIDTH_COLLAPSED,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: colors.textInverse,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
  },
  brandName: {
    color: colors.text,
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
  },
  navSection: {
    flex: 1,
    gap: spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  navItemActive: {
    backgroundColor: `${colors.secondary}15`,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  navLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  navLabelActive: {
    color: colors.secondary,
    fontFamily: fontFamily.semiBold,
  },
  iconWrapper: {
    position: 'relative',
  },
  navLabelRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  badgeInline: {
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
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarCirclePro: {
    borderColor: colors.accent,
  },
  avatarText: {
    color: colors.text,
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    color: colors.text,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  planBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  planBadgePro: {
    backgroundColor: `${colors.accent}30`,
  },
  planBadgeFree: {
    backgroundColor: `${colors.textTertiary}30`,
  },
  planBadgeText: {
    fontSize: fontSize.xs - 1,
    fontFamily: fontFamily.semiBold,
  },
  planBadgeTextPro: {
    color: colors.accent,
  },
  planBadgeTextFree: {
    color: colors.textTertiary,
  },
});
