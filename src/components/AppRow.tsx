import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStyro } from '@/lib/store';
import type { AppItem } from '@/lib/types';
import { displayName } from '@/lib/demoApps';
import { scaled } from '@/lib/tokens';
import { AppIcon } from './AppIcon';

export function AppRow({
  app,
  onPress,
  onLongPress,
  showCategory,
  compact,
  selected,
}: {
  app: AppItem;
  onPress: () => void;
  onLongPress?: () => void;
  showCategory?: boolean;
  compact?: boolean;
  selected?: boolean;
}) {
  const { theme, state } = useStyro();
  const name = displayName(app);
  const category = state.categories.find((c) => c.id === app.category);
  const badgeStyle = state.settings.badgeStyle;

  return (
    <Pressable
      accessibilityLabel={`${name}${app.isFavorite ? ', favorite' : ''}${category ? `, ${category.name}` : ''}`}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={450}
      style={({ pressed }) => [
        styles.row,
        {
          minHeight: compact ? 52 : theme.rowHeight,
          backgroundColor: selected ? theme.accentSoft : pressed ? theme.surface : 'transparent',
          borderRadius: theme.radiusSm,
          borderWidth: selected ? 1.5 : 0,
          borderColor: selected ? theme.accent : 'transparent',
          paddingHorizontal: theme.densityPad,
          paddingVertical: compact ? 6 : 8,
        },
      ]}
    >
      <AppIcon
        name={name}
        tint={app.iconTint}
        style={app.iconStyle ?? state.settings.iconStyle}
        size={compact ? 40 : theme.iconSize}
        theme={theme}
      />
      <View style={styles.texts}>
        {state.settings.showLabels !== false && (
          <Text style={[styles.name, { color: theme.text, fontSize: scaled(compact ? 14 : 15.5, theme) }]} numberOfLines={1}>
            {name}
          </Text>
        )}
        {showCategory && category ? (
          <Text style={[styles.sub, { color: theme.textMuted, fontSize: scaled(12, theme) }]} numberOfLines={1}>
            {category.name}
          </Text>
        ) : null}
      </View>
      {app.demoBadge != null && badgeStyle !== 'off' && (
        <View
          accessibilityLabel={`${app.demoBadge} notifications`}
          style={[
            styles.badge,
            {
              backgroundColor: badgeStyle === 'dot' ? theme.accent : theme.danger,
              minWidth: badgeStyle === 'dot' ? 10 : 22,
              height: badgeStyle === 'dot' ? 10 : 22,
              borderRadius: badgeStyle === 'dot' ? 5 : 11,
            },
          ]}
        >
          {badgeStyle === 'count' && (
            <Text style={[styles.badgeText, { color: theme.accentText, fontSize: scaled(11, theme) }]}>
              {app.demoBadge}
            </Text>
          )}
        </View>
      )}
      {app.isFavorite && (
        <View style={[styles.favDot, { backgroundColor: theme.accent }]} accessibilityLabel="Favorite" />
      )}
    </Pressable>
  );
}

export function AppGridCell({
  app,
  onPress,
  onLongPress,
}: {
  app: AppItem;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const { theme, state } = useStyro();
  const name = displayName(app);
  return (
    <Pressable
      accessibilityLabel={name}
      accessibilityRole="button"
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={450}
      style={({ pressed }) => [
        styles.cell,
        { backgroundColor: pressed ? theme.surface : 'transparent', borderRadius: theme.radiusSm, padding: 8 },
      ]}
    >
      <AppIcon
        name={name}
        tint={app.iconTint}
        style={app.iconStyle ?? state.settings.iconStyle}
        size={theme.iconSize}
        theme={theme}
      />
      {state.settings.showLabels && (
        <Text
          style={[styles.cellLabel, { color: theme.text, fontSize: scaled(12, theme) }]}
          numberOfLines={state.settings.density === 'dense' ? 1 : 2}
        >
          {name}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  texts: { flex: 1 },
  name: { fontWeight: '600' },
  sub: { marginTop: 2 },
  badge: { alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  badgeText: { fontWeight: '700' },
  favDot: { width: 8, height: 8, borderRadius: 4 },
  cell: { alignItems: 'center', justifyContent: 'flex-start', gap: 6 },
  cellLabel: { textAlign: 'center', fontWeight: '500' },
});
