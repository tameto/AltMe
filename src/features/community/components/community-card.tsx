import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontFamily } from '@/src/config/theme';
import type { Community } from '@/src/services/community/client';
import { getThumbnailSource } from '@/src/config/thumbnail-map';

type CommunityCardProps = {
  community: Community;
  onPress: (id: string) => void;
};

export function CommunityCard({ community, onPress }: CommunityCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(community.id)}
    >
      {getThumbnailSource(community.thumbnailUrl) !== null ? (
        <Image source={getThumbnailSource(community.thumbnailUrl)!} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Feather name="users" size={32} color={colors.textTertiary} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {community.name}
        </Text>
        {community.description !== null ? (
          <Text style={styles.description} numberOfLines={2}>
            {community.description}
          </Text>
        ) : null}

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Feather name="users" size={12} color={colors.textTertiary} />
            <Text style={styles.metaText}>{community.memberCount}人参加中</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="globe" size={12} color={colors.textTertiary} />
            <Text style={styles.metaText}>{community.language}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#7DD3FC40',
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  cardPressed: {
    opacity: 0.75,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
  },
  thumbnailPlaceholder: {
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  name: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  description: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textTertiary,
  },
});
