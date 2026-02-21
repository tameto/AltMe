import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { MediaPicker } from '../media-picker.native';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    All: 'All',
    Videos: 'Videos',
    Images: 'Images',
  },
}), { virtual: true });

const mockRequestPermissions = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const mockLaunchLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;

describe('MediaPicker (Native)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestPermissions.mockResolvedValue({ status: 'granted', granted: true });
  });

  it('renders default text when no children provided', () => {
    const onPick = jest.fn();
    const { getByText } = render(<MediaPicker onPick={onPick} />);
    expect(getByText('ファイルを選択')).toBeTruthy();
  });

  it('renders custom children', () => {
    const onPick = jest.fn();
    const { getByText } = render(
      <MediaPicker onPick={onPick}>
        <Text>Choose Photo</Text>
      </MediaPicker>,
    );
    expect(getByText('Choose Photo')).toBeTruthy();
  });

  it('calls onPick with image asset on successful pick', async () => {
    const onPick = jest.fn();
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file:///photo.jpg',
          type: 'image',
          fileName: 'photo.jpg',
          fileSize: 1024,
          mimeType: 'image/jpeg',
          width: 800,
          height: 600,
          duration: null,
        },
      ],
    });

    const { getByTestId } = render(<MediaPicker onPick={onPick} />);
    fireEvent.press(getByTestId('media-picker'));

    await waitFor(() => {
      expect(onPick).toHaveBeenCalledWith({
        uri: 'file:///photo.jpg',
        type: 'image',
        fileName: 'photo.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
        duration: undefined,
      });
    });
  });

  it('does not call onPick when user cancels', async () => {
    const onPick = jest.fn();
    mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: [] });

    const { getByTestId } = render(<MediaPicker onPick={onPick} />);
    fireEvent.press(getByTestId('media-picker'));

    await waitFor(() => {
      expect(mockLaunchLibrary).toHaveBeenCalled();
    });
    expect(onPick).not.toHaveBeenCalled();
  });

  it('does not call onPick when permission is denied', async () => {
    const onPick = jest.fn();
    mockRequestPermissions.mockResolvedValue({ status: 'denied', granted: false });

    const { getByTestId } = render(<MediaPicker onPick={onPick} />);
    fireEvent.press(getByTestId('media-picker'));

    await waitFor(() => {
      expect(mockRequestPermissions).toHaveBeenCalled();
    });
    expect(mockLaunchLibrary).not.toHaveBeenCalled();
    expect(onPick).not.toHaveBeenCalled();
  });

  it('rejects files exceeding maxSizeBytes', async () => {
    const onPick = jest.fn();
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file:///big.jpg',
          type: 'image',
          fileName: 'big.jpg',
          fileSize: 20 * 1024 * 1024, // 20MB
          mimeType: 'image/jpeg',
          width: 4000,
          height: 3000,
        },
      ],
    });

    const { getByTestId } = render(
      <MediaPicker onPick={onPick} maxSizeBytes={10 * 1024 * 1024} />,
    );
    fireEvent.press(getByTestId('media-picker'));

    await waitFor(() => {
      expect(mockLaunchLibrary).toHaveBeenCalled();
    });
    expect(onPick).not.toHaveBeenCalled();
  });

  it('maps video type correctly', async () => {
    const onPick = jest.fn();
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file:///clip.mp4',
          type: 'video',
          fileName: 'clip.mp4',
          fileSize: 5000,
          mimeType: 'video/mp4',
          width: 1920,
          height: 1080,
          duration: 30,
        },
      ],
    });

    const { getByTestId } = render(
      <MediaPicker onPick={onPick} accept="video/*" />,
    );
    fireEvent.press(getByTestId('media-picker'));

    await waitFor(() => {
      expect(onPick).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'video', duration: 30 }),
      );
    });
  });

  it('uses correct MediaTypeOptions based on accept prop', async () => {
    const onPick = jest.fn();
    mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: [] });

    const { getByTestId } = render(
      <MediaPicker onPick={onPick} accept="video/*" />,
    );
    fireEvent.press(getByTestId('media-picker'));

    await waitFor(() => {
      expect(mockLaunchLibrary).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        }),
      );
    });
  });
});
