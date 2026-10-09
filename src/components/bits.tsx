import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useStyro } from '@/lib/store';
import { scaled } from '@/lib/tokens';
import { StyroMark } from './StyroMark';

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  const { theme } = useStyro();
  return (
    <View style={[styles.wrap, { padding: theme.densityPad * 2 }]}>
      <StyroMark size={40} color={theme.textMuted} />
      <Text style={[styles.title, { color: theme.text, fontSize: scaled(17, theme) }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.textSecondary, fontSize: scaled(14, theme) }]}>{message}</Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

/** Honest native-boundary notice: marks a capability as preview-only. */
export function PermissionNotice({ text }: { text: string }) {
  const { theme } = useStyro();
  return (
    <View
      accessibilityRole="text"
      style={[
        styles.notice,
        { backgroundColor: theme.accentSoft, borderColor: theme.accent, borderRadius: theme.radiusSm },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: theme.accent }]} />
      <Text style={[styles.noticeText, { color: theme.text, fontSize: scaled(12.5, theme) }]}>{text}</Text>
    </View>
  );
}

/** Screen-reader live region for confirmations and result counts. */
export function Announcer() {
  const { announceMsg } = useStyro();
  if (!announceMsg) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={styles.announcer}
      pointerEvents="none"
    >
      <Text>{announceMsg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '700', marginTop: 16, textAlign: 'center' },
  message: { marginTop: 8, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  action: { marginTop: 16, flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderWidth: 1,
    gap: 10,
    marginVertical: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  noticeText: { flex: 1, lineHeight: 18 },
  announcer: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
