import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStyro } from '@/lib/store';
import { scaled } from '@/lib/tokens';

/**
 * Applies the form-factor preview frame (when the user picks a fixed
 * phone/tablet composition) and safe-area background.
 */
export function ResponsiveShell({ children }: { children: React.ReactNode }) {
  const { theme, framed, frameLabel } = useStyro();

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.bg }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      {framed && frameLabel ? (
        <View style={[styles.frameBar, { backgroundColor: theme.surface, borderColor: theme.edge }]}>
          <View style={[styles.frameDot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.frameLabel, { color: theme.textSecondary, fontSize: scaled(11.5, theme) }]}>
            Composition preview · {frameLabel} · not a full OS emulator
          </Text>
        </View>
      ) : null}
      <View style={[styles.body, framed && styles.framed]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  frameBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  frameDot: { width: 8, height: 8, borderRadius: 4 },
  frameLabel: { fontWeight: '600' },
  body: { flex: 1 },
  framed: { paddingHorizontal: 6 },
});
