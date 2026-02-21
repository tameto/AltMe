import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Feather from '@expo/vector-icons/Feather';
import { Ionicons } from '@expo/vector-icons';

import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GlassCard } from '@/src/shared/components/glass-card';
import { MessageItem } from '@/src/features/community/components/message-item';
import { JoinButton } from '@/src/features/community/components/join-button';
import { useCommunityDetail } from '@/src/features/community/hooks/use-community-detail';
import { useCommunityMembership } from '@/src/features/community/hooks/use-community-membership';
import { colors, spacing, fontSize, fontFamily, borderRadius, glassmorphism } from '@/src/config/theme';
import type { CommunityMessage, CommunityMember } from '@/src/services/community/client';
import { getThumbnailSource } from '@/src/config/thumbnail-map';

const MAX_AVATAR_DISPLAY = 5;

function MemberAvatarList({ members }: { members: CommunityMember[] }) {
  const { t } = useTranslation();
  const displayed = members.slice(0, MAX_AVATAR_DISPLAY);
  const remaining = members.length - MAX_AVATAR_DISPLAY;

  return (
    <View style={styles.avatarRow}>
      {displayed.map((member, index) => (
        <View key={member.id} style={[styles.avatarItem, { marginLeft: index === 0 ? 0 : -8 }]}>
          <Text style={styles.avatarEmoji}>{member.avatarIcon ?? '🤖'}</Text>
        </View>
      ))}
      {remaining > 0 ? (
        <View style={[styles.avatarItem, styles.avatarMore, { marginLeft: -8 }]}>
          <Text style={styles.avatarMoreText}>
            {t('community.detail.memberCount', { count: remaining })}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const {
    community,
    members,
    messages,
    loading,
    error,
    loadMoreMessages,
    hasMoreMessages,
    refreshCommunity,
  } = useCommunityDetail(id ?? '');

  const { isMember, loading: membershipLoading, join, leave } = useCommunityMembership(id ?? '');

  const renderMessage = useCallback(
    ({ item }: { item: CommunityMessage }) => <MessageItem message={item} />,
    [],
  );

  const keyExtractor = useCallback((item: CommunityMessage) => item.id, []);

  const ListHeaderComponent = useCallback(() => {
    if (!hasMoreMessages) return null;
    return (
      <Pressable style={styles.loadMoreButton} onPress={loadMoreMessages}>
        <Text style={styles.loadMoreText}>{t('community.detail.loadMore')}</Text>
      </Pressable>
    );
  }, [hasMoreMessages, loadMoreMessages, t]);

  const ListEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('community.detail.noMessages')}</Text>
      </View>
    ),
    [t],
  );

  if (loading) {
    return (
      <CosmicBackground>
        <SafeAreaView style={styles.flex}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </CosmicBackground>
    );
  }

  if (error) {
    return (
      <CosmicBackground>
        <SafeAreaView style={styles.flex}>
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={refreshCommunity}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </CosmicBackground>
    );
  }

  if (!community) {
    return (
      <CosmicBackground>
        <SafeAreaView style={styles.flex}>
          <View style={styles.centered}>
            <Text style={styles.errorText}>Not found</Text>
            <Pressable style={styles.retryButton} onPress={() => router.back()}>
              <Text style={styles.retryText}>{t('common.back')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </CosmicBackground>
    );
  }

  return (
    <CosmicBackground>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {community.name}
          </Text>
          <JoinButton
            isMember={isMember}
            isLoading={membershipLoading}
            onJoin={join}
            onLeave={leave}
          />
        </View>

        {/* コミュニティ情報 */}
        <GlassCard style={styles.infoCard}>
          <View style={styles.infoCardContent}>
            {getThumbnailSource(community.thumbnailUrl) !== null ? (
              <Image
                source={getThumbnailSource(community.thumbnailUrl)!}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : null}

            {community.description ? (
              <Text style={styles.description}>{community.description}</Text>
            ) : null}

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={16} color={colors.primary} />
                <Text style={styles.statText}>
                  {t('community.detail.memberCount', { count: community.memberCount })}
                </Text>
                <Text style={styles.statLabel}>{t('community.detail.members')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="globe-outline" size={16} color={colors.primary} />
                <Text style={styles.statText}>{community.language}</Text>
                <Text style={styles.statLabel}>{t('community.detail.language', { defaultValue: 'Language' })}</Text>
              </View>
            </View>

            {members.length > 0 ? (
              <MemberAvatarList members={members} />
            ) : null}
          </View>
        </GlassCard>

        {/* メッセージエリア */}
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refreshCommunity}
              tintColor={colors.primary}
            />
          }
        />
      </SafeAreaView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
  infoCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  infoCardContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  thumbnail: {
    width: '100%',
    height: 140,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  description: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textTertiary,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  avatarItem: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: glassmorphism.card.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarEmoji: {
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'center',
  },
  avatarMore: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.xs,
    width: 'auto',
  },
  avatarMoreText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingBottom: spacing.lg,
  },
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  loadMoreText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.textTertiary,
  },
  errorText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.error,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.text,
  },
});
