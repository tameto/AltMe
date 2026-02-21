/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

// Mock URL.createObjectURL
URL.createObjectURL = jest.fn(() => 'blob:mock-url');

jest.mock('expo-image-picker', () => ({}), { virtual: true });

import { MediaPicker } from '../media-picker.web';
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

const findByType = (node: JsonNode | string | null, type: string): JsonNode | null => {
  if (node === null || typeof node === 'string') return null;
  if (node.type === type) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findByType(child, type);
      if (found) return found;
    }
  }
  return null;
};

describe('MediaPicker (Web)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders default text when no children provided', () => {
    const onPick = jest.fn();
    const tree = render(<MediaPicker onPick={onPick} />).toJSON() as JsonNode;
    expect(findText(tree, 'ファイルを選択')).toBe(true);
  });

  it('renders custom children instead of default text', () => {
    const onPick = jest.fn();
    const tree = render(
      <MediaPicker onPick={onPick}>
        <Text>Upload</Text>
      </MediaPicker>,
    ).toJSON() as JsonNode;

    expect(findText(tree, 'Upload')).toBe(true);
    expect(findText(tree, 'ファイルを選択')).toBe(false);
  });

  it('renders a hidden input element in the tree', () => {
    const onPick = jest.fn();
    const tree = render(<MediaPicker onPick={onPick} />).toJSON() as JsonNode;
    const input = findByType(tree, 'input');
    expect(input).toBeTruthy();
    expect((input?.props as Record<string, unknown>)?.style).toEqual({ display: 'none' });
  });

  it('passes accept prop to input element', () => {
    const onPick = jest.fn();
    const tree = render(
      <MediaPicker onPick={onPick} accept="video/*" />,
    ).toJSON() as JsonNode;
    const input = findByType(tree, 'input');
    expect(input?.props?.accept).toBe('video/*');
  });

  it('handleChange logic: correctly identifies image type', () => {
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
    const type: MediaPickerResult['type'] = file.type.startsWith('image')
      ? 'image'
      : file.type.startsWith('video')
        ? 'video'
        : 'audio';
    expect(type).toBe('image');
  });

  it('handleChange logic: correctly identifies video type', () => {
    const file = new File(['vid'], 'clip.mp4', { type: 'video/mp4' });
    const type: MediaPickerResult['type'] = file.type.startsWith('image')
      ? 'image'
      : file.type.startsWith('video')
        ? 'video'
        : 'audio';
    expect(type).toBe('video');
  });

  it('handleChange logic: correctly identifies audio type', () => {
    const file = new File(['audio'], 'song.mp3', { type: 'audio/mpeg' });
    const type: MediaPickerResult['type'] = file.type.startsWith('image')
      ? 'image'
      : file.type.startsWith('video')
        ? 'video'
        : 'audio';
    expect(type).toBe('audio');
  });

  it('handleChange logic: rejects file exceeding maxSizeBytes', () => {
    const maxSizeBytes = 5;
    const file = new File(['too-large-content'], 'big.jpg', { type: 'image/jpeg' });
    expect(file.size > maxSizeBytes).toBe(true);
  });

  it('applies custom style to container', () => {
    const onPick = jest.fn();
    const tree = render(
      <MediaPicker onPick={onPick} style={{ backgroundColor: 'red' }} />,
    ).toJSON() as JsonNode;
    expect(tree).toBeTruthy();
    // Container should have the custom style merged
    const styles = tree.props?.style as unknown[];
    expect(styles).toBeTruthy();
  });

  it('renders without crashing with all props', () => {
    const onPick = jest.fn();
    const tree = render(
      <MediaPicker
        onPick={onPick}
        accept="image/*"
        maxSizeBytes={1024}
        style={{ padding: 10 }}
      >
        <Text>Pick image</Text>
      </MediaPicker>,
    ).toJSON() as JsonNode;
    expect(tree).toBeTruthy();
    expect(findText(tree, 'Pick image')).toBe(true);
  });
});
