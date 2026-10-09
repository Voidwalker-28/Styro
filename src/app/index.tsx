import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useStyro } from '@/lib/store';
import type { AppItem, GestureActionId } from '@/lib/types';
import { displayName } from '@/lib/demoApps';
import { scaled } from '@/lib/tokens';
import { ResponsiveShell } from '@/components/ResponsiveShell';
import { StyroMark } from '@/components/StyroMark';
import { FavoriteRail } from '@/components/FavoriteRail';
import { WidgetCard, WidgetPicker } from '@/components/WidgetCard';
import { FolderOverlay } from '@/components/FolderOverlay';
import { AppActionSheet } from '@/components/AppActionSheet';
import { GestureLayer } from '@/components/GestureLayer';
import { Sheet } from '@/components/Sheet';
import { PermissionNotice } from '@/components/bits';
import { AppRow } from '@/components/AppRow';

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function Home() {
  const styro = useStyro();
  const {
    theme, state, viewport, updateSettings, touchApp, announce, buzz,
    setPinned, addFolder, addWidget, addPage, deletePage,
    setDefaultPage, duplicatePage, setActivePage,
  } = styro;
  const router = useRouter();
  const now = useNow();

  const [editMode, setEditMode] = useState(false);
  const [actionApp, setActionApp] = useState<AppItem | null>(null);
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'addApp' | 'addWidget' | 'addFolder' | 'addPage' | 'pages' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const page = state.pages.find((p) => p.id === state.activePageId) ?? state.pages[0];
  const pageWidgets = state.widgets.filter((w) => w.pageId === page.id);
  const showWidgets = state.settings.showWidgets && pageWidgets.length > 0;

  const say = useCallback((msg: string) => {
    setToast(msg);
    announce(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, [announce]);

  const simulateLaunch = useCallback((app: AppItem) => {
    touchApp(app.id);
    buzz('light');
    say(`${displayName(app)} would open here. Preview only — Android system access is required for the real action.`);
  }, [touchApp, buzz, say]);

  const handleAppPress = useCallback((id: string) => {
    if (id === '__browse__') { router.push('/drawer'); return; }
    if (id === '__restore__') { styro.restoreFavorites(); return; }
    const app = state.apps.find((a) => a.id === id);
    if (app) simulateLaunch(app);
  }, [router, state.apps, simulateLaunch, styro]);

  const runGestureAction = useCallback((action: GestureActionId) => {
    switch (action) {
      case 'open-appspace': router.push('/drawer'); break;
      case 'open-search': router.push({ pathname: '/drawer', params: { focus: '1' } }); break;
      case 'open-favorites': say('Favorites are the list on this home surface.'); break;
      case 'open-folder':
        if (state.folders[0]) setOpenFolder(state.folders[0].id);
        else say('No folders yet. Long-press an app to create one.');
        break;
      case 'toggle-edit':
        if (state.settings.lockModifications) say('Modifications are locked. Unlock in Customize → Home Surface.');
        else setEditMode((e) => !e);
        break;
      case 'toggle-theme':
        updateSettings({ theme: theme.dark ? 'light' : 'dark' });
        say(theme.dark ? 'Light theme on.' : 'Dark theme on.');
        break;
      case 'toggle-dock': updateSettings({ showDock: !state.settings.showDock }); break;
      case 'lock-modifications':
        updateSettings({ lockModifications: !state.settings.lockModifications });
        say(state.settings.lockModifications ? 'Modifications unlocked.' : 'Preview modifications locked.');
        break;
      case 'open-customize': router.push('/customize'); break;
      case 'open-native': router.push('/native-capabilities'); break;
      case 'open-app': {
        const first = state.apps.find((a) => a.isFavorite && !a.isHidden);
        if (first) simulateLaunch(first);
        break;
      }
      default: break;
    }
  }, [router, say, state.folders, state.settings, state.apps, theme.dark, updateSettings, simulateLaunch]);

  // Web keyboard shortcuts
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '/') { e.preventDefault(); router.push({ pathname: '/drawer', params: { focus: '1' } }); }
      if (e.key === 'Escape') { setSheet(null); setActionApp(null); setOpenFolder(null); if (editMode) setEditMode(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router, editMode]);

  const enterEdit = () => {
    if (state.settings.lockModifications) {
      say('Modifications are locked. Unlock in Customize → Home Surface.');
      return;
    }
    setEditMode(true);
    announce('Edit mode. Add, reorder, or remove items. Press Done to finish.');
  };

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  const isLargeTabletLandscape = viewport.breakpoint === 'large-tablet' && viewport.landscape;

  const hero = (
    <GestureLayer gestures={state.gestures} onAction={runGestureAction}>
      <View style={[styles.hero, { paddingHorizontal: theme.densityPad + 8, paddingTop: 8 }]}>
        <Pressable
          accessibilityLabel="Styro. Open Customize."
          accessibilityRole="button"
          onPress={() => router.push('/customize')}
          style={styles.markRow}
          hitSlop={8}
        >
          <StyroMark size={26} color={theme.accent} />
          <Text style={[styles.wordmark, { color: theme.text, fontSize: scaled(15, theme) }]}>Styro</Text>
          <Text style={[styles.pageName, { color: theme.textMuted, fontSize: scaled(12.5, theme) }]}>{page.name}</Text>
        </Pressable>
        <Text accessibilityLabel={`Current time ${time}`} style={[styles.time, { color: theme.text, fontSize: scaled(viewport.isTablet ? 44 : 38, theme) }]}>
          {time}
        </Text>
        <Text style={[styles.date, { color: theme.textSecondary, fontSize: scaled(14, theme) }]}>{date}</Text>
        <Pressable
          accessibilityLabel="Search apps, folders, and settings"
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/drawer', params: { focus: '1' } })}
          style={[styles.searchAfford, { backgroundColor: theme.surface, borderRadius: theme.radiusSm, borderColor: theme.edge }]}
        >
          <Text style={{ color: theme.textMuted, fontSize: scaled(15, theme) }}>⌕  Search apps, folders, settings…</Text>
        </Pressable>
      </View>
    </GestureLayer>
  );

  const folderChips = state.folders.length > 0 && (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, { paddingHorizontal: theme.densityPad + 8 }]}>
      {state.folders.map((f) => (
        <Pressable
          key={f.id}
          accessibilityLabel={`Open folder ${f.name}, ${f.appIds.length} apps`}
          accessibilityRole="button"
          onPress={() => setOpenFolder(f.id)}
          style={[styles.chip, { backgroundColor: theme.surface, borderRadius: theme.radiusSm, borderColor: theme.edge }]}
        >
          <View style={[styles.chipDot, { backgroundColor: f.colorToken }]} />
          <Text style={{ color: theme.text, fontWeight: '600', fontSize: scaled(13.5, theme) }}>{f.name}</Text>
          <Text style={{ color: theme.textMuted, fontSize: scaled(12, theme) }}>{f.appIds.length}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  const widgetArea = showWidgets && (
    <View style={[styles.widgets, { paddingHorizontal: theme.densityPad + 8, gap: 12 }]}>
      {pageWidgets.slice(0, state.settings.homeLayout === 'dashboard' ? 4 : 2).map((w) => (
        <WidgetCard key={w.id} widget={w} editMode={editMode} />
      ))}
    </View>
  );

  const favorites = (
    <View style={{ paddingHorizontal: theme.densityPad }}>
      <FavoriteRail
        editMode={editMode}
        onAppPress={handleAppPress}
        onAppLongPress={(id) => {
          const app = state.apps.find((a) => a.id === id);
          if (app) setActionApp(app);
        }}
      />
    </View>
  );

  const dock = state.settings.showDock && (
    <View style={[styles.dock, { backgroundColor: theme.surface, borderColor: theme.edge, borderRadius: theme.radius }]}>
      <DockBtn label="App Space" glyph="▦" onPress={() => router.push('/drawer')} />
      <DockBtn label="Search" glyph="⌕" onPress={() => router.push({ pathname: '/drawer', params: { focus: '1' } })} />
      <DockBtn label={editMode ? 'Done' : 'Edit'} glyph={editMode ? '✓' : '✎'} accent={editMode} onPress={() => (editMode ? setEditMode(false) : enterEdit())} />
      <DockBtn label="Customize" glyph="⚙" onPress={() => router.push('/customize')} />
    </View>
  );

  const editBanner = editMode && (
    <View style={[styles.editBanner, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
      <Text style={[styles.editTitle, { color: theme.text, fontSize: scaled(13.5, theme) }]}>
        Edit mode — {page.name}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <EditAction label="＋ App" onPress={() => setSheet('addApp')} />
        <EditAction label="＋ Folder" onPress={() => { setDraft(''); setSheet('addFolder'); }} />
        <EditAction label="＋ Widget" onPress={() => setSheet('addWidget')} />
        <EditAction label="Pages" onPress={() => setSheet('pages')} />
        <EditAction label="Done" primary onPress={() => setEditMode(false)} />
      </ScrollView>
    </View>
  );

  return (
    <ResponsiveShell>
      {isLargeTabletLandscape ? (
        <View style={styles.tabletRow}>
          <View style={[styles.rail, { backgroundColor: theme.surface, borderColor: theme.edge }]}>
            <Pressable accessibilityLabel="Styro. Open Customize." accessibilityRole="button" onPress={() => router.push('/customize')} style={styles.railMark}>
              <StyroMark size={30} color={theme.accent} />
            </Pressable>
            <Text style={[styles.time, { color: theme.text, fontSize: scaled(26, theme) }]}>{time}</Text>
            <Text style={[styles.date, { color: theme.textSecondary, fontSize: scaled(12, theme) }]}>{date}</Text>
            <View style={{ gap: 6, marginTop: 18 }}>
              <RailNav label="App Space" onPress={() => router.push('/drawer')} />
              <RailNav label="Search" onPress={() => router.push({ pathname: '/drawer', params: { focus: '1' } })} />
              <RailNav label={editMode ? 'Done' : 'Edit'} onPress={() => (editMode ? setEditMode(false) : enterEdit())} />
              <RailNav label="Customize" onPress={() => router.push('/customize')} />
              <RailNav label="Native" onPress={() => router.push('/native-capabilities')} />
            </View>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
            {editBanner}
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>{favorites}</View>
              <View style={{ flex: 1, gap: 12 }}>
                {widgetArea}
                {folderChips}
              </View>
            </View>
          </ScrollView>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {hero}
            <View style={{ height: 14 }} />
            {editBanner}
            {favorites}
            <View style={{ height: 14 }} />
            {state.settings.homeLayout !== 'minimal' && folderChips}
            <View style={{ height: 6 }} />
            {widgetArea}
            {state.settings.homeLayout === 'dashboard' && (
              <View style={{ paddingHorizontal: theme.densityPad + 8, marginTop: 12 }}>
                <PermissionNotice text="This preview simulates launcher behavior. Android system access is required for the real action." />
              </View>
            )}
          </ScrollView>
          {dock && <View style={[styles.dockWrap, { paddingHorizontal: theme.densityPad + 8 }]}>{dock}</View>}
        </View>
      )}

      {toast && (
        <View style={[styles.toast, { backgroundColor: theme.bgElevated, borderColor: theme.edge }]}>
          <View style={[styles.toastDot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.toastText, { color: theme.text, fontSize: scaled(13, theme) }]}>{toast}</Text>
        </View>
      )}

      <AppActionSheet app={actionApp} onClose={() => setActionApp(null)} onOpenFolder={(id) => { setActionApp(null); setOpenFolder(id); }} />
      <FolderOverlay folder={state.folders.find((f) => f.id === openFolder) ?? null} onClose={() => setOpenFolder(null)} />

      <Sheet visible={sheet === 'addApp'} onClose={() => setSheet(null)} label="Add app to home page">
        <Text style={[styles.sheetTitle, { color: theme.text, fontSize: scaled(17, theme) }]}>Add to {page.name}</Text>
        <ScrollView style={{ maxHeight: 380 }}>
          {state.apps.filter((a) => !a.isHidden && !page.pinnedIds.includes(a.id)).map((app) => (
            <AppRow key={app.id} app={app} compact onPress={() => {
              setPinned(page.id, [...page.pinnedIds, app.id]);
              if (!app.isFavorite) styro.toggleFavorite(app.id);
              setSheet(null);
              say(`${displayName(app)} added to ${page.name}.`);
            }} />
          ))}
        </ScrollView>
      </Sheet>

      <Sheet visible={sheet === 'addWidget'} onClose={() => setSheet(null)} label="Add widget">
        <Text style={[styles.sheetTitle, { color: theme.text, fontSize: scaled(17, theme) }]}>Add widget</Text>
        <ScrollView style={{ maxHeight: 420 }}>
          <WidgetPicker onPick={(type) => { addWidget(type, page.id); setSheet(null); }} />
        </ScrollView>
      </Sheet>

      <Sheet visible={sheet === 'addFolder'} onClose={() => setSheet(null)} label="Create folder">
        <Text style={[styles.sheetTitle, { color: theme.text, fontSize: scaled(17, theme) }]}>New folder</Text>
        <TextInput
          accessibilityLabel="Folder name"
          placeholder="Folder name"
          placeholderTextColor={theme.textMuted}
          value={draft}
          onChangeText={setDraft}
          autoFocus
          style={[styles.nameInput, { color: theme.text, borderColor: theme.edge, fontSize: scaled(15, theme) }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create folder"
          onPress={() => { const f = addFolder(draft); setSheet(null); setOpenFolder(f.id); }}
          style={[styles.primaryBtn, { backgroundColor: theme.accent, borderRadius: theme.radiusSm }]}
        >
          <Text style={{ color: theme.accentText, fontWeight: '700', fontSize: scaled(15, theme) }}>Create folder</Text>
        </Pressable>
      </Sheet>

      <Sheet visible={sheet === 'pages'} onClose={() => setSheet(null)} label="Home pages">
        <Text style={[styles.sheetTitle, { color: theme.text, fontSize: scaled(17, theme) }]}>Home pages</Text>
        <ScrollView style={{ maxHeight: 380 }}>
          {state.pages.map((p) => (
            <View key={p.id} style={[styles.pageRow, { borderColor: theme.edge }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: scaled(15, theme) }}>
                  {p.name}{p.isDefault ? ' · default' : ''}{p.id === page.id ? ' · current' : ''}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: scaled(12, theme), marginTop: 2 }}>{p.pinnedIds.length} pinned</Text>
              </View>
              <Pressable accessibilityLabel={`Go to ${p.name}`} accessibilityRole="button" onPress={() => { setActivePage(p.id); setSheet(null); }} style={styles.pageBtn}>
                <Text style={{ color: theme.accent, fontWeight: '700' }}>Open</Text>
              </Pressable>
              {!p.isDefault && (
                <Pressable accessibilityLabel={`Set ${p.name} as default`} accessibilityRole="button" onPress={() => setDefaultPage(p.id)} style={styles.pageBtn}>
                  <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Default</Text>
                </Pressable>
              )}
              <Pressable accessibilityLabel={`Duplicate ${p.name}`} accessibilityRole="button" onPress={() => duplicatePage(p.id)} style={styles.pageBtn}>
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Copy</Text>
              </Pressable>
              {state.pages.length > 1 && (
                <Pressable accessibilityLabel={`Delete ${p.name}`} accessibilityRole="button" onPress={() => deletePage(p.id, 'move')} style={styles.pageBtn}>
                  <Text style={{ color: theme.danger, fontWeight: '600' }}>Delete</Text>
                </Pressable>
              )}
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TextInput
              accessibilityLabel="New page name"
              placeholder="New page name"
              placeholderTextColor={theme.textMuted}
              value={draft}
              onChangeText={setDraft}
              style={[styles.nameInput, { flex: 1, color: theme.text, borderColor: theme.edge, fontSize: scaled(15, theme), marginBottom: 0 }]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add page"
              onPress={() => { addPage(draft); setDraft(''); }}
              style={[styles.primaryBtn, { backgroundColor: theme.accent, borderRadius: theme.radiusSm, paddingHorizontal: 16 }]}
            >
              <Text style={{ color: theme.accentText, fontWeight: '700' }}>Add</Text>
            </Pressable>
          </View>
          <Text style={{ color: theme.textMuted, fontSize: scaled(12, theme), marginTop: 10, lineHeight: 17 }}>
            Deleting a page moves its pinned apps to the default page. Widgets move too.
          </Text>
        </ScrollView>
      </Sheet>
    </ResponsiveShell>
  );
}

function DockBtn({ label, glyph, onPress, accent }: { label: string; glyph: string; onPress: () => void; accent?: boolean }) {
  const { theme } = useStyro();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.dockBtn,
        { backgroundColor: accent ? theme.accent : pressed ? theme.surface2 : 'transparent', borderRadius: theme.radiusSm },
      ]}
    >
      <Text style={{ fontSize: 20, color: accent ? theme.accentText : theme.text }}>{glyph}</Text>
      <Text style={[styles.dockLabel, { color: accent ? theme.accentText : theme.textSecondary, fontSize: scaled(10.5, theme) }]}>{label}</Text>
    </Pressable>
  );
}

function RailNav({ label, onPress }: { label: string; onPress: () => void }) {
  const { theme } = useStyro();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.railNav, { backgroundColor: theme.bgElevated, borderRadius: theme.radiusSm }]}
    >
      <Text style={{ color: theme.text, fontWeight: '600', fontSize: scaled(14, theme) }}>{label}</Text>
    </Pressable>
  );
}

function EditAction({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  const { theme } = useStyro();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.editAction, { backgroundColor: primary ? theme.accent : theme.surface, borderRadius: theme.radiusSm }]}
    >
      <Text style={{ color: primary ? theme.accentText : theme.text, fontWeight: '700', fontSize: scaled(13, theme) }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  hero: {},
  markRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: { fontWeight: '800' },
  pageName: { marginLeft: 'auto', fontWeight: '500' },
  time: { fontWeight: '700', letterSpacing: 0.5, marginTop: 14 },
  date: { marginTop: 4 },
  searchAfford: { marginTop: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1 },
  chips: { gap: 8, paddingVertical: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1 },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  widgets: {},
  dockWrap: { paddingBottom: 10 },
  dock: { flexDirection: 'row', borderWidth: 1, padding: 6 },
  dockBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, gap: 2, minHeight: 56, justifyContent: 'center' },
  dockLabel: { fontWeight: '600' },
  editBanner: { marginHorizontal: 16, marginBottom: 12, borderWidth: 1.5, borderRadius: 14, padding: 12, gap: 10 },
  editTitle: { fontWeight: '700' },
  editAction: { paddingHorizontal: 14, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  tabletRow: { flex: 1, flexDirection: 'row' },
  rail: { width: 220, borderRightWidth: 1, padding: 18, gap: 4 },
  railMark: { marginBottom: 8 },
  railNav: { paddingHorizontal: 12, paddingVertical: 12, minHeight: 48, justifyContent: 'center' },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  toastDot: { width: 8, height: 8, borderRadius: 4 },
  toastText: { flex: 1, lineHeight: 18 },
  sheetTitle: { fontWeight: '700', marginBottom: 12 },
  nameInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, minHeight: 48, marginBottom: 12 },
  primaryBtn: { alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  pageRow: { flexDirection: 'row', alignItems: 'center', gap: 4, borderBottomWidth: 1, paddingVertical: 10 },
  pageBtn: { paddingHorizontal: 8, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
});
