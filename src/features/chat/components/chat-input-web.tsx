import React, { useRef, useState, useCallback } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { colors, fontFamily, sendGradient } from '@/src/config/theme';
import { CHAT } from '@/src/config/constants';

type ChatInputWebProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  maxLength?: number;
  placeholder?: string;
};

export function ChatInputWeb({
  value,
  onChangeText,
  onSend,
  disabled = false,
  isLoading = false,
  maxLength = CHAT.maxMessageLength,
  placeholder,
}: ChatInputWebProps) {
  const { t } = useTranslation();
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const canSend = value.trim().length > 0 && !isLoading && !disabled;
  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.9;

  const handleKeyPress = useCallback(
    (e: { nativeEvent: { key: string; shiftKey?: boolean } }) => {
      if (Platform.OS !== 'web') return;
      if (isComposing) return;

      const { key, shiftKey } = e.nativeEvent;
      if (key === 'Enter' && !shiftKey) {
        // Prevent default newline insertion on web
        if ('preventDefault' in e) {
          (e as unknown as Event).preventDefault();
        }
        if (canSend) {
          onSend();
        }
      }
    },
    [isComposing, canSend, onSend],
  );

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false);
  }, []);

  // Attach compositionstart/end listeners on web
  const setWebRef = useCallback(
    (node: TextInput | null) => {
      inputRef.current = node;
      if (Platform.OS === 'web' && node) {
        const el = node as unknown as HTMLElement;
        el.addEventListener('compositionstart', handleCompositionStart);
        el.addEventListener('compositionend', handleCompositionEnd);
      }
    },
    [handleCompositionStart, handleCompositionEnd],
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        {/* Plus button */}
        <Pressable style={styles.plusButton} testID="chat-input-plus">
          <Feather name="plus" size={18} color="#FFFFFF70" />
        </Pressable>

        {/* Input */}
        <TextInput
          ref={setWebRef}
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          onKeyPress={handleKeyPress}
          placeholder={placeholder ?? t('chat.inputPlaceholder')}
          placeholderTextColor="#FFFFFF50"
          multiline
          maxLength={maxLength}
          editable={!disabled}
          testID="chat-input-field"
        />

        {/* Send button */}
        {canSend ? (
          <Pressable style={styles.sendButton} onPress={onSend} testID="chat-send-button">
            <LinearGradient
              colors={sendGradient.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendGradient}
            >
              <Feather name="send" size={18} color="#0F172A" />
            </LinearGradient>
          </Pressable>
        ) : null}
      </View>

      {/* Character counter */}
      {charCount > 0 && (
        <View style={styles.counterRow}>
          <Text
            style={[styles.counterText, isNearLimit && styles.counterTextWarning]}
            testID="chat-char-counter"
          >
            {charCount}/{maxLength}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172ADD',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF10',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  plusButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF10',
    borderWidth: 1,
    borderColor: '#FFFFFF20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    borderRadius: 18,
    backgroundColor: '#FFFFFF08',
    borderWidth: 1,
    borderColor: '#FFFFFF12',
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.text,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  sendGradient: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterRow: {
    paddingHorizontal: 14,
    paddingBottom: 4,
    alignItems: 'flex-end',
  },
  counterText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#FFFFFF40',
  },
  counterTextWarning: {
    color: '#F87171',
  },
});
