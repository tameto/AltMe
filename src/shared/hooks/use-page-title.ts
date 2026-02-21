import { useEffect } from 'react';
import { Platform } from 'react-native';

const APP_NAME = 'AltMe';

export const usePageTitle = (title?: string): void => {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;
  }, [title]);
};
