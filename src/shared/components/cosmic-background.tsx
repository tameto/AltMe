import React from 'react';
import { ImageBackground, StyleSheet, View, type ViewStyle } from 'react-native';

type Props = {
  children: React.ReactNode;
  overlayOpacity?: number;
  style?: ViewStyle;
};

export const CosmicBackground = React.memo(function CosmicBackground({
  children,
  overlayOpacity = 0.8,
  style,
}: Props) {
  return (
    <ImageBackground
      source={require('@/assets/images/cosmic-bg.png')}
      style={[styles.container, style]}
      resizeMode="cover"
    >
      <View style={[styles.overlay, { opacity: overlayOpacity }]} />
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
  },
});
