import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useStyro } from '@/lib/store';
import { scaled } from '@/lib/tokens';
import { ResponsiveShell } from '@/components/ResponsiveShell';
import { SectionHeader } from '@/components/SettingRow';
import { PermissionNotice } from '@/components/bits';
import { SetHomeAppCard } from '@/components/SetHomeAppCard';

type Status = 'available' | 'preview' | 'native' | 'permission';

const STATUS_META: Record<Status, { label: string; colorKey: 'success' | 'accent' | 'info' | 'warning' }> = {
  available: { label: 'Available in this build', colorKey: 'success' },
  preview: { label: 'Preview simulation only', colorKey: 'accent' },
  native: { label: 'Requires native Android integration', colorKey: 'info' },
  permission: { label: 'Permission required', colorKey: 'warning' },
};

const GROUPS: { title: string; items: { name: string; desc: string; status: Status }[] }[] = [
  {
    title: 'Working now',
    items: [
      { name: 'Local configuration', desc: 'Themes, favorites, folders, widgets, and pages persist on this device.', status: 'available' },
      { name: 'Local backup export / import', desc: 'JSON you can copy, review, apply, and undo. No cloud.', status: 'available' },
      { name: 'Reduced motion & large text', desc: 'Respected across every surface.', status: 'available' },
      { name: 'Keyboard navigation', desc: 'Web preview: / focuses search, arrows move, Escape backs out.', status: 'available' },
      { name: 'Haptic feedback', desc: 'Uses the native haptics API where the platform supports it.', status: 'available' },
      { name: 'Set as default launcher', desc: 'Android build: Styro can be set as the home app via the system role request.', status: 'available' },
      { name: 'Read installed apps', desc: 'Android build: real app list via PackageManager. Web preview still uses demo data.', status: 'available' },
      { name: 'Launch installed packages', desc: 'Android build: taps open the real app. Web preview stays simulated.', status: 'available' },
    ],
  },
  {
    title: 'Simulated in preview',
    items: [
      { name: 'App launching (web)', desc: 'On web, tapping an app shows what would happen. Nothing is actually launched.', status: 'preview' },
      { name: 'Notification badges', desc: 'Demo counts on fictional apps. Never read from real notifications.', status: 'preview' },
      { name: 'Widget data', desc: 'Weather, battery, calendar, and media cards show static demo content.', status: 'preview' },
      { name: 'App hiding', desc: 'Hides from App Space in preview. Does not uninstall, secure, or lock anything.', status: 'preview' },
      { name: 'Search across settings', desc: 'Local index of Styro actions. No web search, no ads.', status: 'preview' },
    ],
  },
  {
    title: 'Needs a native Android build',
    items: [
      { name: 'Notification access', desc: 'Can expose sensitive content. Off by default; requested only for a visible feature.', status: 'permission' },
      { name: 'Real notification badges', desc: 'Badge counts need permission-backed integration.', status: 'permission' },
      { name: 'Wallpaper & live wallpaper', desc: 'Reading wallpaper and extracting colors needs native access.', status: 'permission' },
      { name: 'Native widgets', desc: 'Binding real Android widgets requires the native widget host.', status: 'native' },
      { name: 'Calendar & battery data', desc: 'Live data only with explicit permission, kept on-device.', status: 'permission' },
      { name: 'Accessibility-service actions', desc: 'Sensitive. Requested only for a specific user-visible function.', status: 'permission' },
      { name: 'Secure app hiding (PIN/biometric)', desc: 'A future native boundary — never simulated as secure in preview.', status: 'native' },
    ],
  },
];

export default function NativeCapabilities() {
  const { theme } = useStyro();
  const router = useRouter();

  return (
    <ResponsiveShell>
      <ScrollView contentContainerStyle={[styles.body, { paddingHorizontal: 18, paddingBottom: 48 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={() => router.back()} style={styles.back} hitSlop={8}>
            <Text style={{ color: theme.text, fontSize: 24 }}>‹</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text, fontSize: scaled(22, theme) }]}>Native capabilities</Text>
        </View>
        <PermissionNotice text="Styro never shows a fake “permission granted” state. If this preview can't do it, it says so." />
        <SetHomeAppCard />
        {GROUPS.map((g) => (
          <View key={g.title}>
            <SectionHeader title={g.title} />
            {g.items.map((item) => {
              const meta = STATUS_META[item.status];
              const color =
                meta.colorKey === 'success' ? theme.success
                : meta.colorKey === 'accent' ? theme.accent
                : meta.colorKey === 'info' ? theme.info
                : theme.warning;
              return (
                <View key={item.name} style={[styles.row, { borderColor: theme.edge }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: theme.text, fontSize: scaled(15, theme) }]}>{item.name}</Text>
                    <Text style={[styles.desc, { color: theme.textSecondary, fontSize: scaled(13, theme) }]}>{item.desc}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: theme.surface, borderColor: color, borderRadius: 8 }]}>
                    <View style={[styles.dot, { backgroundColor: color }]} />
                    <Text style={[styles.badgeText, { color: theme.textSecondary, fontSize: scaled(10.5, theme) }]}>
                      {meta.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
        <Text style={[styles.foot, { color: theme.textMuted, fontSize: scaled(12, theme) }]}>
          Future native modules follow least privilege: explain before asking, keep data on-device, and always offer an
          off switch.
        </Text>
      </ScrollView>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  body: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '800' },
  row: { borderTopWidth: 1, paddingVertical: 12, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  name: { fontWeight: '600' },
  desc: { marginTop: 4, lineHeight: 18 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 6, maxWidth: 190 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontWeight: '600', flexShrink: 1 },
  foot: { marginTop: 20, lineHeight: 18 },
});
