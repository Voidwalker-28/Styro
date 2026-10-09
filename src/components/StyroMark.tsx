import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TOKENS } from '@/lib/tokens';

/**
 * Original Styro mark: three offset rounded bars ("signal tiles")
 * forming a subtle S-like rhythm. Works at wordmark and app-mark sizes.
 */
export function StyroMark({ size = 28, color = TOKENS.lime }: { size?: number; color?: string }) {
  const barH = size / 4.6;
  const gap = size / 14;
  const widths = [size * 0.62, size, size * 0.62];
  const offsets = [size * 0.38, 0, size * 0.38];
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Styro logo"
      style={[styles.wrap, { width: size, height: size * 0.78 }]}
    >
      {widths.map((w, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            {
              width: w,
              height: barH,
              marginLeft: offsets[i],
              marginBottom: i < 2 ? gap : 0,
              borderRadius: barH / 2,
              backgroundColor: color,
              opacity: i === 1 ? 1 : 0.55,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'center' },
  bar: {},
});
