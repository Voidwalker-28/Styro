import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { IconStyleId } from '@/lib/types';
import { TOKENS, type Theme } from '@/lib/tokens';

/**
 * Original geometric app marks. Six Styro icon styles, each an abstract
 * composition drawn from tint + glyph letter — no third-party artwork.
 */
export function AppIcon({
  name,
  tint = '#AAB8B7',
  style = 'signal',
  size = 48,
  theme,
  showRing = false,
}: {
  name: string;
  tint?: string;
  style?: IconStyleId;
  size?: number;
  theme: Theme;
  showRing?: boolean;
}) {
  const glyph = useMemo(() => (name.trim().charAt(0) || '·').toUpperCase(), [name]);
  const r = Math.min(theme.radius, size / 3.2);
  const fontSize = size * 0.42;

  const body = (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: r, backgroundColor: tileBg(style, theme, tint) },
        style === 'outline' && { borderWidth: 1.5, borderColor: tint },
        style === 'mono' && { backgroundColor: theme.dark ? '#1B232E' : '#E2E7E1' },
      ]}
    >
      <InnerMark glyph={glyph} tint={tint} style={style} size={size} theme={theme} fontSize={fontSize} />
      {style === 'signal' && (
        <View style={[styles.signalDot, { width: size * 0.16, height: size * 0.16, borderRadius: size * 0.08, right: size * 0.12, top: size * 0.12 }]} />
      )}
      {style === 'orbit' && (
        <View
          style={[
            styles.orbitRing,
            {
              width: size * 0.86,
              height: size * 0.86,
              borderRadius: size * 0.43,
              borderColor: withAlpha(tint, 0.55),
            },
          ]}
        />
      )}
    </View>
  );

  if (showRing) {
    return (
      <View style={[styles.ringWrap, { borderColor: theme.accent, borderRadius: r + 6, padding: 3 }]}>
        {body}
      </View>
    );
  }
  return body;
}

function tileBg(style: IconStyleId, theme: Theme, tint: string): string {
  switch (style) {
    case 'signal':
      return withAlpha(tint, theme.dark ? 0.22 : 0.28);
    case 'prism':
      return withAlpha(tint, theme.dark ? 0.3 : 0.34);
    case 'mineral':
      return theme.dark ? withAlpha(tint, 0.2) : '#FFFFFF';
    case 'orbit':
    case 'outline':
    case 'mono':
    default:
      return theme.dark ? withAlpha(tint, 0.14) : withAlpha(tint, 0.18);
  }
}

function InnerMark({
  glyph,
  tint,
  style,
  size,
  theme,
  fontSize,
}: {
  glyph: string;
  tint: string;
  style: IconStyleId;
  size: number;
  theme: Theme;
  fontSize: number;
}) {
  if (style === 'mono') {
    return (
      <Text style={[styles.glyph, { fontSize, color: theme.text, fontWeight: '700' }]}>{glyph}</Text>
    );
  }
  if (style === 'outline') {
    return (
      <Text style={[styles.glyph, { fontSize, color: tint, fontWeight: '500' }]}>{glyph}</Text>
    );
  }
  if (style === 'prism') {
    return (
      <View style={styles.prismWrap}>
        <View
          style={{
            width: size * 0.34,
            height: size * 0.34,
            backgroundColor: tint,
            transform: [{ rotate: '45deg' }],
            borderRadius: 3,
          }}
        />
      </View>
    );
  }
  if (style === 'mineral') {
    return (
      <View
        style={{
          width: size * 0.52,
          height: size * 0.52,
          borderRadius: size * 0.26,
          backgroundColor: withAlpha(tint, 0.85),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={[styles.glyph, { fontSize: fontSize * 0.8, color: theme.dark ? '#0D1219' : '#111817', fontWeight: '700' }]}>
          {glyph}
        </Text>
      </View>
    );
  }
  // signal + orbit: bold glyph with tint
  return (
    <Text style={[styles.glyph, { fontSize, color: style === 'signal' ? tint : withAlpha(tint, 0.95), fontWeight: '700' }]}>
      {glyph}
    </Text>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  glyph: { includeFontPadding: false, textAlignVertical: 'center' } as object,
  signalDot: { position: 'absolute', backgroundColor: TOKENS.lime },
  orbitRing: { position: 'absolute', borderWidth: 1.5 },
  ringWrap: { borderWidth: 1.5 },
  prismWrap: { alignItems: 'center', justifyContent: 'center' },
});
