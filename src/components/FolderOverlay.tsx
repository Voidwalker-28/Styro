import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStyro } from '@/lib/store';
import type { Folder } from '@/lib/types';
import { displayName } from '@/lib/demoApps';
import { scaled } from '@/lib/tokens';
import { Sheet } from './Sheet';
import { AppIcon } from './AppIcon';
import { EmptyState } from './bits';

/** Focused folder overlay: open, reorder, add/remove, rename, delete. */
export function FolderOverlay({ folder, onClose }: { folder: Folder | null; onClose: () => void }) {
  const { theme, state, renameFolder, deleteFolder, removeAppFromFolder } = useStyro();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(folder?.name ?? '');

  React.useEffect(() => {
    setDraft(folder?.name ?? '');
    setRenaming(false);
  }, [folder?.id, folder?.name]);

  const apps = (folder?.appIds ?? [])
    .map((id) => state.apps.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => !!a);

  const confirmDelete = () => {
    if (!folder) return;
    Alert.alert(
      'Delete folder?',
      `"${folder.name}" will be removed. Its apps stay in App Space.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteFolder(folder.id);
            onClose();
          },
        },
      ],
    );
  };

  return (
    <Sheet visible={!!folder} onClose={onClose} label={folder ? `Folder ${folder.name}` : 'Folder'}>
      {folder && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.head}>
            {renaming ? (
              <View style={{ flexDirection: 'row', gap: 8, flex: 1 }}>
                <TextInput
                  accessibilityLabel="Folder name"
                  value={draft}
                  onChangeText={setDraft}
                  onSubmitEditing={() => {
                    renameFolder(folder.id, draft);
                    setRenaming(false);
                  }}
                  autoFocus
                  style={[
                    styles.input,
                    { color: theme.text, borderColor: theme.accent, fontSize: scaled(17, theme) },
                  ]}
                />
                <Pressable
                  accessibilityLabel="Save folder name"
                  accessibilityRole="button"
                  onPress={() => {
                    renameFolder(folder.id, draft);
                    setRenaming(false);
                  }}
                  style={[styles.iconBtn, { backgroundColor: theme.accent }]}
                >
                  <Text style={{ color: theme.accentText, fontWeight: '800' }}>✓</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.text, fontSize: scaled(20, theme) }]}>{folder.name}</Text>
                  <Text style={[styles.count, { color: theme.textSecondary, fontSize: scaled(13, theme) }]}>
                    {apps.length} {apps.length === 1 ? 'app' : 'apps'}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={`Rename folder ${folder.name}`}
                  accessibilityRole="button"
                  onPress={() => {
                    setDraft(folder.name);
                    setRenaming(true);
                  }}
                  style={[styles.iconBtn, { backgroundColor: theme.surface }]}
                >
                  <Text style={{ color: theme.text, fontWeight: '700' }}>✎</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={`Delete folder ${folder.name}`}
                  accessibilityRole="button"
                  onPress={confirmDelete}
                  style={[styles.iconBtn, { backgroundColor: theme.surface }]}
                >
                  <Text style={{ color: theme.danger, fontWeight: '700' }}>🗑</Text>
                </Pressable>
              </>
            )}
          </View>

          {apps.length === 0 ? (
            <EmptyState
              title="Empty folder"
              message="This folder is waiting for apps. Add some from any app's long-press menu, or delete the folder."
            />
          ) : (
            <View style={styles.grid}>
              {apps.map((app) => {
                const name = displayName(app);
                return (
                  <View key={app.id} style={[styles.cell, { width: '30%' }]}>
                    <AppIcon
                      name={name}
                      tint={app.iconTint}
                      style={app.iconStyle ?? state.settings.iconStyle}
                      size={52}
                      theme={theme}
                    />
                    <Text
                      style={[styles.cellLabel, { color: theme.text, fontSize: scaled(12, theme) }]}
                      numberOfLines={2}
                    >
                      {name}
                    </Text>
                    <Pressable
                      accessibilityLabel={`Remove ${name} from folder`}
                      accessibilityRole="button"
                      onPress={() => removeAppFromFolder(app.id)}
                      style={[styles.remove, { backgroundColor: theme.surface2 }]}
                      hitSlop={8}
                    >
                      <Text style={[styles.removeGlyph, { color: theme.textSecondary }]}>−</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

          <Pressable
            accessibilityLabel="Close folder"
            accessibilityRole="button"
            onPress={onClose}
            style={[styles.close, { backgroundColor: theme.surface, borderRadius: theme.radiusSm }]}
          >
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: scaled(15, theme) }}>Done</Text>
          </Pressable>
        </ScrollView>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  name: { fontWeight: '700' },
  count: { marginTop: 2 },
  input: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, minHeight: 44, fontWeight: '600' },
  iconBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 8 },
  cell: { alignItems: 'center', gap: 6, position: 'relative', paddingVertical: 8 },
  cellLabel: { textAlign: 'center', fontWeight: '500' },
  remove: {
    position: 'absolute',
    top: 0,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeGlyph: { fontSize: 14, fontWeight: '800', marginTop: -2 },
  close: { alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: 16 },
});
