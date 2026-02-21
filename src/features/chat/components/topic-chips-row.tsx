import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fontFamily, spacing } from '@/src/config/theme';
import type { ChatTopicKey } from '@/src/shared/types/chat';

type TopicChip = {
  key: ChatTopicKey;
  name: string;
};

type TopicChipsRowProps = {
  topics: TopicChip[];
  activeTopic: ChatTopicKey;
  onSelect: (key: ChatTopicKey) => void;
  onAddPress?: () => void;
};

export function TopicChipsRow({ topics, activeTopic, onSelect, onAddPress }: TopicChipsRowProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {topics.map((topic) => {
          const isActive = topic.key === activeTopic;
          return (
            <Pressable
              key={topic.key}
              style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
              onPress={() => onSelect(topic.key)}
            >
              <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>
                {'#'}{topic.name}
              </Text>
            </Pressable>
          );
        })}

        {/* Add button */}
        {onAddPress ? (
          <Pressable style={styles.addButton} onPress={onAddPress}>
            <Feather name="plus" size={14} color="#FFFFFF60" />
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#0F172ABB',
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF08',
  },
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#7DD3FC20',
    borderColor: '#7DD3FC50',
  },
  chipInactive: {
    backgroundColor: '#FFFFFF10',
    borderColor: '#FFFFFF20',
  },
  chipText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
  },
  chipTextActive: {
    fontFamily: fontFamily.semiBold,
    color: '#7DD3FC',
  },
  chipTextInactive: {
    color: '#FFFFFF80',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#FFFFFF10',
    borderWidth: 1,
    borderColor: '#FFFFFF20',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
