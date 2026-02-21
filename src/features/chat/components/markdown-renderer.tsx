import { FC, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Linking } from 'react-native';
import Markdown, { RenderRules, ASTNode } from '@ronradtke/react-native-markdown-display';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { fontFamily } from '@/src/config/theme';

type MarkdownRendererProps = {
  content: string;
  isUserMessage?: boolean;
};

const sanitizeContent = (content: string): string =>
  content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+=['"][^'"]*['"]/gi, '')
    .replace(/javascript:/gi, '');

const openLink = (url: string) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    Linking.openURL(url);
  }
};

function CodeBlockWithCopy({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  return (
    <View style={codeBlockStyles.wrapper}>
      <Pressable style={codeBlockStyles.copyButton} onPress={handleCopy} accessibilityLabel="コピー">
        <Feather name={copied ? 'check' : 'copy'} size={14} color={copied ? '#34D399' : '#94A3B8'} />
      </Pressable>
      <Text style={codeBlockStyles.code}>{children}</Text>
    </View>
  );
}

const codeBlockStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  copyButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    padding: 4,
  },
  code: {
    color: '#E2E8F0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    lineHeight: 20,
    paddingRight: 24,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    color: '#F8FAFC',
    fontFamily: fontFamily.regular,
    fontSize: 14,
  } as Record<string, unknown>,
  heading1: {
    color: '#F8FAFC',
    fontFamily: fontFamily.bold,
    fontSize: 22,
    marginVertical: 8,
  } as Record<string, unknown>,
  heading2: {
    color: '#F8FAFC',
    fontFamily: fontFamily.bold,
    fontSize: 18,
    marginVertical: 6,
  } as Record<string, unknown>,
  heading3: {
    color: '#F8FAFC',
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    marginVertical: 4,
  } as Record<string, unknown>,
  strong: {
    fontFamily: fontFamily.bold,
  } as Record<string, unknown>,
  em: {
    fontStyle: 'italic' as const,
  } as Record<string, unknown>,
  code_inline: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    color: '#7DD3FC',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  } as Record<string, unknown>,
  fence: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  } as Record<string, unknown>,
  code_block: {
    color: '#E2E8F0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
  } as Record<string, unknown>,
  link: {
    color: '#7DD3FC',
    textDecorationLine: 'none' as const,
  } as Record<string, unknown>,
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: '#7DD3FC',
    paddingLeft: 12,
    backgroundColor: 'rgba(125, 211, 252, 0.05)',
    marginVertical: 4,
  } as Record<string, unknown>,
  list_item: {
    color: '#F8FAFC',
    marginVertical: 2,
  } as Record<string, unknown>,
  bullet_list_icon: {
    color: '#7DD3FC',
  } as Record<string, unknown>,
  ordered_list_icon: {
    color: '#7DD3FC',
  } as Record<string, unknown>,
  hr: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    height: 1,
  } as Record<string, unknown>,
  paragraph: {
    marginVertical: 4,
    color: '#F8FAFC',
  } as Record<string, unknown>,
  text: {
    color: '#F8FAFC',
    fontFamily: fontFamily.regular,
    fontSize: 14,
  } as Record<string, unknown>,
});

export const MarkdownRenderer: FC<MarkdownRendererProps> = ({ content }) => {
  const sanitized = sanitizeContent(content);

  const rules: RenderRules = {
    fence: (node: ASTNode) => {
      const codeContent = node.content ?? '';
      return (
        <CodeBlockWithCopy key={node.key}>{codeContent}</CodeBlockWithCopy>
      );
    },
    code_block: (node: ASTNode) => {
      const codeContent = node.content ?? '';
      return (
        <CodeBlockWithCopy key={node.key}>{codeContent}</CodeBlockWithCopy>
      );
    },
    link: (node: ASTNode, children) => {
      const href = (node.attributes?.href as string) ?? '';
      return (
        <Text
          key={node.key}
          style={markdownStyles.link}
          onPress={() => openLink(href)}
          accessibilityRole="link"
        >
          {children}
        </Text>
      );
    },
  };

  return (
    <Markdown style={markdownStyles as never} rules={rules}>
      {sanitized}
    </Markdown>
  );
};
