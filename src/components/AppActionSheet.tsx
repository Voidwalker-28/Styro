import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStyro } from '@/lib/store';
import type { AppItem, IconStyleId } from '@/lib/types';
import { displayName } from '@/lib/demoApps';
import { scaled } from '@/lib/tokens';
import { Sheet } from './Sheet';
import { AppIcon } from './AppIcon';
import { PermissionNotice } from './bits';

const ICON_STYLES: IconStyleId[] = ['signal', 'orbit', 'prism', 'mono', 'outline', 'mineral'];

/** Long-press action sheet for an app: pin, folder, rename, icon, hide, native note. */
export function AppActionSheet({
  app,
  onClose,
  onOpenFolder,
}: {
  app: AppItem | null;
  onClose: () => void;
  onOpenFolder?: (folderId: string) => void;
}) {
  const {
    theme,
    state,
    toggleFavorite,
    hideApp,
    renameApp,
    setAppIcon,
    moveAppCategory,
    addFolder,
    addAppToFolder,
    setPinned,
    announce,
  } = useStyro();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState('');
  const [pickingFolder, setPickingFolder] = useState(false);
  const [pickingIcon, setPickingIcon] = useState(false);
  const [pickingCategory, setPickingCategory] = useState(false);

  React.useEffect(() => {
    setRenaming(false);
    setPickingFolder(false);
    setPickingIcon(false);
    setPickingCategory(false);
    setDraft(app ? displayName(app) : '');
  }, [app?.id]);

  if (!app) return <Sheet visible={false} onClose={onClose} label="App actions" />;

  const name = displayName(app);
  const activePage = state.pages.find((p) => p.id === state.activePageId) ?? state.pages[0];
  const inFolder = state.folders.find((f) => f.id === app.folderId);

  const addToHome = () => {
    if (!activePage.pinnedIds.includes(app.id)) {
      setPinned(activePage.id, [...activePage.pinnedIds, app.id]);
      announce(`${name} added to ${activePage.name}.`);
    }
    onClose();
  };

  const rows: { label: string; hint?: string; danger?: boolean; run: () => void }[] = [
    { label: app.isFavorite ? 'Remove from Favorites' : 'Add to Favorites', run: () => { toggleFavorite(app.id); onClose(); } },
    { label: 'Add to Home page', hint: activePage.name, run: addToHome },
    {
      label: inFolder ? `In folder “${inFolder.name}” — change` : 'Add to Folder',
      run: () => setPickingFolder(true),
    },
    { label: 'Rename in Styro', hint: name, run: () => setRenaming(true) },
    { label: 'Change icon style', hint: app.iconStyle ?? state.settings.iconStyle, run: () => setPickingIcon(true) },
    { label: 'Move to category', run: () => setPickingCategory(true) },
    app.isHidden
      ? { label: 'Unhide in preview', run: () => { hideApp(app.id, false); onClose(); } }
      : { label: 'Hide in preview', hint: 'not a secure hide', run: () => { hideApp(app.id, true); onClose(); } },
  ];

  return (
    <Sheet visible={!!app} onClose={onClose} label={`Actions for ${name}`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <AppIcon name={name} tint={app.iconTint} style={app.iconStyle ?? state.settings.iconStyle} size={52} theme={theme} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text, fontSize: scaled(18, theme) }]}>{name}</Text>
            <Text style={[styles.sub, { color: theme.textSecondary, fontSize: scaled(13, theme) }]}>
              {state.categories.find((c) => c.id === app.category)?.name ?? 'App'}
              {app.demoBadge ? ` · ${app.demoBadge} demo notifications` : ''}
            </Text>
          </View>
        </View>

        {renaming ? (
          <View style={{ flexDirection: 'row', gap: 8, marginVertical: 8 }}>
            <TextInput
              accessibilityLabel="App name in Styro"
              value={draft}
              onChangeText={setDraft}
              autoFocus
              onSubmitEditing={() => {
                renameApp(app.id, draft.trim() ? draft : undefined);
                setRenaming(false);
              }}
              style={[styles.input, { color: theme.text, borderColor: theme.accent, fontSize: scaled(15, theme) }]}
            />
            <Pressable
              accessibilityLabel="Save name"
              accessibilityRole="button"
              onPress={() => {
                renameApp(app.id, draft.trim() ? draft : undefined);
                setRenaming(false);
                onClose();
              }}
              style={[styles.miniBtn, { backgroundColor: theme.accent }]}
            >
              <Text style={{ color: theme.accentText, fontWeight: '800' }}>✓</Text>
            </Pressable>
          </View>
        ) : null}

        {pickingIcon ? (
          <View style={[styles.picker, { marginVertical: 8 }]}>
            <Text style={[styles.pickerTitle, { color: theme.textSecondary, fontSize: scaled(12.5, theme) }]}>
              Icon style for {name}
            </Text>
            <View style={styles.iconGrid}>
              {ICON_STYLES.map((s) => (
                <Pressable
                  key={s}
                  accessibilityRole="button"
                  accessibilityLabel={`${s} style`}
                  accessibilityState={{ selected: (app.iconStyle ?? state.settings.iconStyle) === s }}
                  onPress={() => {
                    setAppIcon(app.id, s);
                    setPickingIcon(false);
                  }}
                  style={[
                    styles.iconCell,
                    {
                      borderColor: (app.iconStyle ?? state.settings.iconStyle) === s ? theme.accent : 'transparent',
                      borderWidth: 2,
                      borderRadius: 10,
                      padding: 6,
                    },
                  ]}
                >
                  <AppIcon name={name} tint={app.iconTint} style={s} size={44} theme={theme} />
                  <Text style={[styles.iconLabel, { color: theme.textSecondary, fontSize: scaled(11, theme) }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {pickingFolder ? (
          <View style={{ marginVertical: 8, gap: 6 }}>
            <Text style={[styles.pickerTitle, { color: theme.textSecondary, fontSize: scaled(12.5, theme) }]}>Add to folder</Text>
            {state.folders.map((f) => (
              <Pressable
                key={f.id}
                accessibilityRole="button"
                accessibilityLabel={`Add to ${f.name}`}
                onPress={() => {
                  addAppToFolder(app.id, f.id);
                  setPickingFolder(false);
                  if (onOpenFolder) onOpenFolder(f.id);
                  else onClose();
                }}
                style={[styles.pickRow, { backgroundColor: theme.surface, borderRadius: theme.radiusSm, padding: 12 }]}
              >
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: scaled(14, theme) }}>{f.name}</Text>
                <Text style={{ color: theme.textMuted, fontSize: scaled(12, theme) }}>{f.appIds.length} apps</Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create new folder with this app"
              onPress={() => {
                const folder = addFolder(`${name} group`, [app.id]);
                setPickingFolder(false);
                if (onOpenFolder) onOpenFolder(folder.id);
                else onClose();
              }}
              style={[styles.pickRow, { backgroundColor: theme.accentSoft, borderRadius: theme.radiusSm, padding: 12 }]}
            >
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: scaled(14, theme) }}>＋ New folder</Text>
            </Pressable>
          </View>
        ) : null}

        {pickingCategory ? (
          <View style={{ marginVertical: 8, gap: 6 }}>
            <Text style={[styles.pickerTitle, { color: theme.textSecondary, fontSize: scaled(12.5, theme) }]}>Move to category</Text>
            {state.categories.map((c) => (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={`Move to ${c.name}`}
                onPress={() => {
                  moveAppCategory(app.id, c.id);
                  setPickingCategory(false);
                  onClose();
                }}
                style={[styles.pickRow, { backgroundColor: theme.surface, borderRadius: theme.radiusSm, padding: 12 }]}
              >
                <View style={[styles.catDot, { backgroundColor: c.accent }]} />
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: scaled(14, theme) }}>{c.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {!renaming && !pickingFolder && !pickingIcon && !pickingCategory && (
          <View style={{ gap: 2, marginTop: 4 }}>
            {rows.map((r) => (
              <Pressable
                key={r.label}
                accessibilityRole="button"
                accessibilityLabel={r.label}
                onPress={r.run}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: pressed ? theme.surface : 'transparent', borderRadius: theme.radiusSm, minHeight: 48 },
                ]}
              >
                <Text style={[styles.rowLabel, { color: r.danger ? theme.danger : theme.text, fontSize: scaled(15, theme) }]}>
                  {r.label}
                </Text>
                {r.hint ? (
                  <Text style={[styles.rowHint, { color: theme.textMuted, fontSize: scaled(12.5, theme) }]}>{r.hint}</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        )}

        <PermissionNotice text="Uninstall, App info, and system settings are native-only. This preview never fakes a system action." />
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  name: { fontWeight: '700' },
  sub: { marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  rowLabel: { fontWeight: '600' },
  rowHint: {},
  input: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, minHeight: 44 },
  miniBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  picker: {},
  pickerTitle: { fontWeight: '600', marginBottom: 8 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconCell: { alignItems: 'center', gap: 4 },
  iconLabel: { textTransform: 'capitalize' },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
});
