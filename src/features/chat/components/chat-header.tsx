import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { spacing, fontFamily } from '@/src/config/theme';
import type { ConnectionMode, WsConnectionStatus } from '@/src/shared/types/openclaw';

type ChatHeaderProps = {
  twinName: string;
  isOnline: boolean;
  isPro: boolean;
  todayUserCount: number;
  freeLimit: number;
  connectionMode: ConnectionMode;
  wsStatus: WsConnectionStatus;
};

export function ChatHeader({
  twinName,
  isOnline,
  isPro,
  todayUserCount,
  freeLimit,
  connectionMode,
  wsStatus,
}: ChatHeaderProps) {
  const { t } = useTranslation();

  const isWsConnected = connectionMode === 'websocket' && wsStatus === 'connected';
  const showOnline = isOnline && (isPro ? isWsConnected : true);
  const remaining = Math.max(0, freeLimit - todayUserCount);

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {/* Avatar 44x44 */}
        <View style={styles.avatarWrapper}>
          <MaterialCommunityIcons name="robot-outline" size={24} color="#7DD3FC" />
        </View>
        <View style={styles.headerTextGroup}>
          {/* Name + green dot */}
          <View style={styles.nameRow}>
            <Text style={styles.headerTitle}>{twinName}</Text>
            <Text style={styles.nameDot}>{'●'}</Text>
          </View>
          {/* Status row */}
          <Text style={styles.statusText}>
            {'● '}{showOnline ? t('chat.statusOnline') : t('chat.statusOffline')}
          </Text>
        </View>
      </View>

      {isPro ? null : (
        <View style={styles.freeBadge}>
          <Text style={styles.freeBadgeText}>
            {remaining}/{freeLimit}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: '#0F172AEE',
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF10',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF15',
    borderWidth: 1.5,
    borderColor: '#7DD3FC40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextGroup: {
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fontFamily.semiBold,
    color: '#F8FAFC',
  },
  nameDot: {
    fontSize: 8,
    color: '#34D399',
  },
  statusText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#7DD3FC',
  },
  freeBadge: {
    borderRadius: 999,
    backgroundColor: '#FEF3C720',
    borderWidth: 1,
    borderColor: '#FEF3C740',
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  freeBadgeText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: '#D4A853',
  },
});
