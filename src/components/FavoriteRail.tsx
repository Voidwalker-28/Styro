import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStyro } from '@/lib/store';
import { scaled } from '@/lib/tokens';
import { AppRow } from './AppRow';
import { EmptyState } from './bits';

/**
 * Vertical favorite list for the home surface: one-thumb, large rows,
 * with accessible reorder (Move up / Move down) instead of drag only.
 */
export function FavoriteRail({
  editMode,
  onAppPress,
  onAppLongPress,
}: {
  editMode: boolean;
  onAppPress: (id: string) => void;
  onAppLongPress: (id: string) => void;
}) {
  const { theme, state, moveFavorite, toggleFavorite, setActivePage } = useStyro();
  const page = state.pages.find((p) => p.id === state.activePageId) ?? state.pages[0];
  const apps = page.pinnedIds
    .map((id) => state.apps.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => !!a && !a.isHidden);

  if (apps.length === 0) {
    return (
      <EmptyState
        title="Your surface is clear."
        message="Add the apps and cards you want close. Nothing is lost — everything lives in App Space."
        action={
          <>
            <RailButton label="Browse apps" onPress={() => onAppPress('__browse__')} primary />
            <RailButton label="Restore defaults" onPress={() => onAppPress('__restore__')} />
          </>
        }
      />
    );
  }

  return (
    <View accessibilityRole="list" accessibilityLabel={`Favorites on ${page.name}`}>
      {apps.map((app, i) => (
        <View key={app.id} style={editMode ? [styles.editRow, { borderColor: theme.edge }] : undefined}>
          <View style={{ flex: 1 }}>
            <AppRow app={app} onPress={() => onAppPress(app.id)} onLongPress={() => onAppLongPress(app.id)} />
          </View>
          {editMode && (
            <View style={styles.editActions}>
              <EditBtn label="Move up" glyph="↑" disabled={i === 0} onPress={() => moveFavorite(page.id, i, i - 1)} theme={theme} />
              <EditBtn label="Move down" glyph="↓" disabled={i === apps.length - 1} onPress={() => moveFavorite(page.id, i, i + 1)} theme={theme} />
              <EditBtn label="Remove" glyph="✕" onPress={() => toggleFavorite(app.id)} theme={theme} />
            </View>
          )}
        </View>
      ))}
      {state.pages.length > 1 && (
        <View style={[styles.pages, { marginTop: 12 }]}>
          {state.pages.map((p) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`Go to page ${p.name}`}
              accessibilityState={{ selected: p.id === page.id }}
              onPress={() => setActivePage(p.id)}
              style={[
                styles.dot,
                {
                  backgroundColor: p.id === page.id ? theme.accent : theme.surface2,
                  width: p.id === page.id ? 22 : 8,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function RailButton({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  const { theme } = useStyro();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.btn,
        {
          backgroundColor: primary ? theme.accent : theme.surface,
          borderRadius: theme.radiusSm,
          minHeight: 44,
          paddingHorizontal: 18,
        },
      ]}
    >
      <Text style={{ color: primary ? theme.accentText : theme.text, fontWeight: '700', fontSize: scaled(14, theme) }}>
        {label}
      </Text>
    </Pressable>
  );
}

function EditBtn({
  label,
  glyph,
  onPress,
  disabled,
  theme,
}: {
  label: string;
  glyph: string;
  onPress: () => void;
  disabled?: boolean;
  theme: ReturnType<typeof useStyro>['theme'];
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.editBtn, { backgroundColor: theme.surface, opacity: disabled ? 0.35 : 1 }]}
      hitSlop={6}
    >
      <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
  editRow: { borderTopWidth: 1 },
  editActions: { flexDirection: 'row', gap: 8, paddingVertical: 6, paddingHorizontal: 4 },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pages: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  dot: { height: 8, borderRadius: 4 },
});
