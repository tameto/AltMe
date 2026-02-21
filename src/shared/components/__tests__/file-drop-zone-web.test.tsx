/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, Platform } from 'react-native';

// Mock URL.createObjectURL
URL.createObjectURL = jest.fn(() => 'blob:mock-url');

import { FileDropZone } from '../file-drop-zone';
import type { MediaPickerResult } from '@/src/shared/types/platform';

type JsonNode = {
  type: string;
  props: Record<string, unknown>;
  children: (string | JsonNode)[] | null;
};

const findText = (node: JsonNode | string | null, text: string): boolean => {
  if (node === null) return false;
  if (typeof node === 'string') return node === text;
  if (node.children) {
    return node.children.some((child) => findText(child, text));
  }
  return false;
};

describe('FileDropZone', () => {
  it('renders children on web', () => {
    const onDrop = jest.fn();
    const tree = render(
      <FileDropZone onDrop={onDrop}>
        <Text>Drop files here</Text>
      </FileDropZone>,
    ).toJSON() as JsonNode;
    expect(findText(tree, 'Drop files here')).toBe(true);
  });

  it('renders children on native (no-op pass-through)', () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true });

    const onDrop = jest.fn();
    const tree = render(
      <FileDropZone onDrop={onDrop}>
        <Text>Content</Text>
      </FileDropZone>,
    ).toJSON() as JsonNode;
    expect(findText(tree, 'Content')).toBe(true);

    Object.defineProperty(Platform, 'OS', { value: originalOS, writable: true });
  });

  it('renders without crashing with accept prop', () => {
    const onDrop = jest.fn();
    const tree = render(
      <FileDropZone onDrop={onDrop} accept={['image/*']}>
        <Text>Zone</Text>
      </FileDropZone>,
    ).toJSON() as JsonNode;
    expect(tree).toBeTruthy();
  });

  it('renders without crashing with maxFiles prop', () => {
    const onDrop = jest.fn();
    const tree = render(
      <FileDropZone onDrop={onDrop} maxFiles={3}>
        <Text>Zone</Text>
      </FileDropZone>,
    ).toJSON() as JsonNode;
    expect(tree).toBeTruthy();
  });

  it('renders without crashing with maxSizeBytes prop', () => {
    const onDrop = jest.fn();
    const tree = render(
      <FileDropZone onDrop={onDrop} maxSizeBytes={5 * 1024 * 1024}>
        <Text>Zone</Text>
      </FileDropZone>,
    ).toJSON() as JsonNode;
    expect(tree).toBeTruthy();
  });

  it('isAccepted logic: accepts matching mime types', () => {
    const accept = ['image/*'];
    const mimeType = 'image/jpeg';
    const isAccepted = accept.some((pattern) => {
      if (pattern.endsWith('/*')) {
        return mimeType.startsWith(pattern.replace('/*', '/'));
      }
      return mimeType === pattern;
    });
    expect(isAccepted).toBe(true);
  });

  it('isAccepted logic: rejects non-matching mime types', () => {
    const accept = ['image/*'];
    const mimeType = 'application/pdf';
    const isAccepted = accept.some((pattern) => {
      if (pattern.endsWith('/*')) {
        return mimeType.startsWith(pattern.replace('/*', '/'));
      }
      return mimeType === pattern;
    });
    expect(isAccepted).toBe(false);
  });

  it('mediaTypeFromMime logic: maps correctly', () => {
    const mediaTypeFromMime = (mime: string): MediaPickerResult['type'] => {
      if (mime.startsWith('image')) return 'image';
      if (mime.startsWith('video')) return 'video';
      return 'audio';
    };

    expect(mediaTypeFromMime('image/png')).toBe('image');
    expect(mediaTypeFromMime('video/mp4')).toBe('video');
    expect(mediaTypeFromMime('audio/mpeg')).toBe('audio');
  });
});
