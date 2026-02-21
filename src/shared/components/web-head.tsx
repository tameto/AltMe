import { Platform } from 'react-native';
import { useEffect } from 'react';

type Props = {
  title?: string;
  themeColor?: string;
  faviconUrl?: string;
};

const setMetaTag = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
  if (typeof document === 'undefined') return;

  let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, name);
    document.head.appendChild(meta);
  }
  meta.content = content;
};

const setFavicon = (url: string) => {
  if (typeof document === 'undefined') return;

  let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = url;
};

export function WebHead({ title, themeColor, faviconUrl }: Props) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    if (title) {
      document.title = title;
    }

    if (themeColor) {
      setMetaTag('theme-color', themeColor);
    }

    if (faviconUrl) {
      setFavicon(faviconUrl);
    }
  }, [title, themeColor, faviconUrl]);

  return null;
}
