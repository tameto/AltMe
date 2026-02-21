// Platform types for Web/Native cross-platform support

export type PlatformType = 'web' | 'ios' | 'android';

// Responsive breakpoints
export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

export type ResponsiveInfo = {
  breakpoint: Breakpoint;
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
};

// Network state (platform-agnostic)
export type NetworkState = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown' | 'none';
};

// Media picker (platform-agnostic)
export type MediaPickerResult = {
  uri: string;
  type: 'image' | 'video' | 'audio';
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  width?: number;
  height?: number;
  duration?: number;
};

// Web-specific file drop
export type FileDropEvent = {
  files: MediaPickerResult[];
  position: { x: number; y: number };
};

// Keyboard shortcuts (Web-specific)
export type WebKeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
};
