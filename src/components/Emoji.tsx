import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { charToIcon, emojiImage } from '../assets/twemoji';

interface Props {
  char: string;
  size?: number;
  style?: ViewStyle | ViewStyle[];
}

/** 渲染 Twemoji 图片；未收录的字符回退为系统 emoji 文字，保证不崩溃。 */
export function Emoji({ char, size = 24, style }: Props) {
  const icon = char ? charToIcon[char] : undefined;
  const source = icon ? emojiImage[icon] : undefined;
  if (source) {
    const imageStyle = [{ width: size, height: size }, style] as unknown as StyleProp<ImageStyle>;
    return <Image source={source} style={imageStyle} resizeMode="contain" />;
  }
  return (
    <Text style={[styles.fallback, { fontSize: size * 0.82, lineHeight: size * 1.05 }, style]}>{char}</Text>
  );
}

const styles = StyleSheet.create({
  fallback: { includeFontPadding: false, textAlign: 'center' },
});
