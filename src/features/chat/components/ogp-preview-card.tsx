import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fontFamily } from '@/src/config/theme';
import { extractUrls, fetchOGP } from '../services/ogp-fetcher';
import type { OGPData } from '@/src/shared/types/chat';

type OGPPreviewCardProps = {
  content: string;
  cachedOgp?: OGPData[];
};

const openLink = (url: string) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    Linking.openURL(url);
  }
};

const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export function OGPPreviewCard({ content, cachedOgp }: OGPPreviewCardProps) {
  const [ogpList, setOgpList] = useState<OGPData[]>(cachedOgp ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cachedOgp && cachedOgp.length > 0) {
      setOgpList(cachedOgp);
      return;
    }

    const urls = extractUrls(content);
    if (urls.length === 0) return;

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      const results: OGPData[] = [];
      // Fetch only the first URL to avoid excessive requests
      const ogp = await fetchOGP(urls[0]);
      if (ogp && !cancelled) {
        results.push(ogp);
      }
      if (!cancelled) {
        setOgpList(results);
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [content, cachedOgp]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#7DD3FC" />
      </View>
    );
  }

  if (ogpList.length === 0) return null;

  return (
    <View style={styles.container}>
      {ogpList.map((ogp, index) => (
        <Pressable
          key={`${ogp.url}-${index}`}
          style={styles.card}
          onPress={() => openLink(ogp.url)}
          accessibilityRole="link"
          accessibilityLabel={ogp.title ?? ogp.url}
        >
          {ogp.image ? (
            <Image
              source={{ uri: ogp.image }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : null}
          <View style={styles.textContainer}>
            {ogp.title ? (
              <Text style={styles.title} numberOfLines={2}>
                {ogp.title}
              </Text>
            ) : null}
            {ogp.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {ogp.description}
              </Text>
            ) : null}
            <View style={styles.domainRow}>
              <Feather name="link" size={10} color="#64748B" />
              <Text style={styles.domain} numberOfLines={1}>
                {getDomain(ogp.url)}
              </Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 8,
  },
  loadingContainer: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  textContainer: {
    padding: 10,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  description: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
    lineHeight: 17,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  domain: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#64748B',
  },
});
