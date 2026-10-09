import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStyro } from '@/lib/store';
import type { AppItem, DrawerMode, GestureActionId, Widget } from '@/lib/types';
import { displayName } from '@/lib/demoApps';
import { scaled } from '@/lib/tokens';
import { searchAll } from '@/lib/search';
import { ResponsiveShell } from '@/components/ResponsiveShell';
import { StyroMark } from '@/components/StyroMark';
import { SearchField } from '@/components/SearchField';
import { AppRow, AppGridCell } from '@/components/AppRow';
import { FolderOverlay } from '@/components/FolderOverlay';
import { AppActionSheet } from '@/components/AppActionSheet';
import { EmptyState, PermissionNotice } from '@/components/bits';
import { columnsFor } from '@/lib/responsive';

const MODES: { id: DrawerMode; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'categories', label: 'Categories' },
  { id: 'recent', label: 'Recent' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'custom', label: 'Custom' },
  { id: 'hidden', label: 'Hidden' },
];

export default function Drawer() {
  const styro = useStyro();
  const {
    theme, state, viewport, announce, buzz, touchApp,
    setDrawerMode, setDrawerCategory, toggleFavorite,
  } = styro;
  const router = useRouter();
  const params = useLocalSearchParams<{ focus?: string; q?: string }>();

  const [query, setQuery] = useState(typeof params.q === 'string' ? params.q : '');
  const [searchFocused, setSearchFocused] = useState(false);
  const [actionApp, setActionApp] = useState<AppItem | null>(null);
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [launchMsg, setLaunchMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const searchRef = useRef<TextInput>(null);
  const listRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});

  // Simulated load: skeleton first, then content (fast, deterministic)
  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, [state.drawerMode, state.drawerCategory]);

  useEffect(() => {
    if (params.focus === '1') {
      setSearchFocused(true);
      const t = setTimeout(() => searchRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [params.focus]);

  // Register global search actions for the drawer search
  useEffect(() => {
    styro.registerSearchActions([
      { id: 'act-theme', title: 'Change theme', subtitle: 'Customize → Appearance', run: () => router.push('/customize') },
      { id: 'act-fav', title: 'Open favorites', subtitle: 'Home surface', run: () => router.push('/') },
      { id: 'act-gest', title: 'Edit gestures', subtitle: 'Customize → Gestures', run: () => router.push('/customize') },
      { id: 'act-reset', title: 'Restore defaults', subtitle: 'Customize → Data & Recovery', run: () => router.push('/customize') },
      { id: 'act-native', title: 'Native capabilities', subtitle: 'Android integration boundary', run: () => router.push('/native-capabilities') },
      { id: 'act-appspace', title: 'Open App Space', subtitle: 'Browse the full app library', run: () => router.push('/drawer') },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const simulateLaunch = useCallback((app: AppItem) => {
    touchApp(app.id);
    buzz('light');
    setLaunchMsg(`${displayName(app)} would open here. Preview only — Android system access is required for the real action.`);
    announce(`${displayName(app)} selected. Preview launch simulated.`);
  }, [touchApp, buzz, announce]);

  const searching = query.trim().length > 0 || searchFocused;
  const results = useMemo(
    () => searchAll(query, state.apps, state.categories, state.folders, styro.searchActions),
    [query, state.apps, state.categories, state.folders, styro.searchActions],
  );
  const resultCount = results.apps.length + results.categories.length + results.folders.length + results.actions.length;

  useEffect(() => {
    if (searching && query.trim()) announce(`${resultCount} results for ${query}.`);
  }, [resultCount, query, searching, announce]);

  const visibleApps = useMemo(() => {
    const apps = state.apps.filter((a) => !a.isHidden || state.drawerMode === 'hidden');
    switch (state.drawerMode) {
      case 'favorites': return apps.filter((a) => a.isFavorite).sort((x, y) => displayName(x).localeCompare(displayName(y)));
      case 'recent': return [...apps].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt).slice(0, 12);
      case 'custom': return [...apps].sort((a, b) => a.order - b.order);
      case 'hidden': return state.apps.filter((a) => a.isHidden);
      case 'categories': {
        if (state.drawerCategory !== 'all') {
          const cat = state.categories.find((c) => c.id === state.drawerCategory);
          const sort = cat?.sort ?? 'alpha';
          const list = apps.filter((a) => a.category === state.drawerCategory);
          return sortApps(list, sort);
        }
        return [...apps].sort((a, b) => displayName(a).localeCompare(displayName(b)));
      }
      case 'all':
      default:
        return [...apps].sort((a, b) => displayName(a).localeCompare(displayName(b)));
    }
  }, [state.apps, state.drawerMode, state.drawerCategory, state.categories]);

  const sections = useMemo(() => {
    if (state.drawerMode !== 'all' || state.settings.appListLayout === 'grid') return null;
    const map = new Map<string, AppItem[]>();
    visibleApps.forEach((a) => {
      const letter = displayName(a).charAt(0).toUpperCase();
      const list = map.get(letter) ?? [];
      list.push(a);
      map.set(letter, list);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [visibleApps, state.drawerMode, state.settings.appListLayout]);

  const letters = useMemo(() => (sections ? sections.map(([l]) => l) : []), [sections]);

  const jumpToLetter = (letter: string) => {
    const y = sectionOffsets.current[letter];
    if (y != null && listRef.current) {
      listRef.current.scrollTo({ y: Math.max(0, y - 8), animated: !styro.reducedMotion });
      announce(`Jumped to ${letter}.`);
    }
  };

  const closeSearch = () => {
    setQuery('');
    setSearchFocused(false);
    searchRef.current?.blur();
  };

  // Web keyboard: arrows navigate, Escape backs out
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (actionApp) setActionApp(null);
        else if (openFolder) setOpenFolder(null);
        else if (searching) closeSearch();
        else router.back();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searching, actionApp, openFolder, router]);

  const grid = state.settings.appListLayout === 'grid';
  const cols = columnsFor(viewport, state.settings.density);
  const showRail = state.settings.indexRail && viewport.isTablet && sections;

  const header = (
    <View style={[styles.header, { paddingHorizontal: theme.densityPad + 8, paddingTop: 8 }]}>
      <View style={styles.headerRow}>
        <Pressable accessibilityLabel="Back to home" accessibilityRole="button" onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Text style={{ color: theme.text, fontSize: 22 }}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text, fontSize: scaled(20, theme) }]}>App Space</Text>
        <Text style={[styles.count, { color: theme.textMuted, fontSize: scaled(12.5, theme) }]}>
          {visibleApps.length} apps
        </Text>
      </View>
      <SearchField
        ref={searchRef}
        value={query}
        onChange={setQuery}
        onFocus={() => setSearchFocused(true)}
        label="Search apps, folders, and settings"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modes}>
        {MODES.map((m) => {
          const selected = state.drawerMode === m.id && !searching;
          return (
            <Pressable
              key={m.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`${m.label} view`}
              onPress={() => { setDrawerMode(m.id); closeSearch(); }}
              style={[
                styles.modeChip,
                {
                  backgroundColor: selected ? theme.accent : theme.surface,
                  borderRadius: theme.radiusSm,
                },
              ]}
            >
              <Text style={{ color: selected ? theme.accentText : theme.textSecondary, fontWeight: selected ? '700' : '600', fontSize: scaled(13, theme) }}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {state.drawerMode === 'categories' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modes}>
          <CatChip id="all" name="All categories" />
          {state.categories.map((c) => (
            <CatChip key={c.id} id={c.id} name={c.name} />
          ))}
        </ScrollView>
      )}
    </View>
  );

  function CatChip({ id, name }: { id: string; name: string }) {
    const selected = state.drawerCategory === id;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Category ${name}`}
        accessibilityState={{ selected }}
        onPress={() => setDrawerCategory(id)}
        style={[styles.modeChip, { backgroundColor: selected ? theme.accentSoft : 'transparent', borderWidth: 1, borderColor: selected ? theme.accent : theme.edge, borderRadius: theme.radiusSm }]}
      >
        <Text style={{ color: selected ? theme.text : theme.textSecondary, fontWeight: '600', fontSize: scaled(12.5, theme) }}>{name}</Text>
      </Pressable>
    );
  }

  const renderRow = (app: AppItem) => (
    grid ? (
      <View key={app.id} style={{ width: `${100 / cols}%` }}>
        <AppGridCell app={app} onPress={() => simulateLaunch(app)} onLongPress={() => setActionApp(app)} />
      </View>
    ) : (
      <AppRow
        key={app.id}
        app={app}
        showCategory={state.drawerMode === 'all'}
        compact={state.settings.appListLayout === 'compact'}
        onPress={() => simulateLaunch(app)}
        onLongPress={() => setActionApp(app)}
      />
    )
  );

  const body = () => {
    if (loading) {
      return (
        <View style={[styles.listPad, { paddingHorizontal: theme.densityPad + 8 }]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={[styles.skeleton, { backgroundColor: theme.surface, borderRadius: theme.radiusSm, height: theme.rowHeight * 0.72 }]} />
          ))}
        </View>
      );
    }
    if (loadError) {
      return (
        <EmptyState
          title="Couldn't load App Space"
          message="The demo catalog failed to load in this simulation. Your settings are intact."
          action={<RetryBtn onPress={() => { setLoadError(false); setLoading(true); setTimeout(() => setLoading(false), 450); }} />}
        />
      );
    }
    if (searching && query.trim()) {
      if (resultCount === 0) {
        return (
          <EmptyState
            title="No Styro result yet."
            message="Nothing matched that search. Try a shorter name or browse All Apps."
            action={<RetryBtn label="Browse All Apps" onPress={() => { setDrawerMode('all'); closeSearch(); }} />}
          />
        );
      }
      return (
        <ScrollView contentContainerStyle={[styles.listPad, { paddingHorizontal: theme.densityPad + 8 }]} showsVerticalScrollIndicator={false}>
          <ResultGroup title="Apps" count={results.apps.length}>
            {results.apps.map((a) => (
              <AppRow key={a.id} app={a} compact onPress={() => simulateLaunch(a)} onLongPress={() => setActionApp(a)} />
            ))}
          </ResultGroup>
          <ResultGroup title="Categories" count={results.categories.length}>
            {results.categories.map((c) => (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={`Open category ${c.name}`}
                onPress={() => { setDrawerMode('categories'); setDrawerCategory(c.id); closeSearch(); }}
                style={[styles.resultRow, { backgroundColor: theme.surface, borderRadius: theme.radiusSm }]}
              >
                <View style={[styles.catDot, { backgroundColor: c.accent }]} />
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: scaled(14, theme) }}>{c.name}</Text>
              </Pressable>
            ))}
          </ResultGroup>
          <ResultGroup title="Folders" count={results.folders.length}>
            {results.folders.map((f) => (
              <Pressable
                key={f.id}
                accessibilityRole="button"
                accessibilityLabel={`Open folder ${f.name}`}
                onPress={() => setOpenFolder(f.id)}
                style={[styles.resultRow, { backgroundColor: theme.surface, borderRadius: theme.radiusSm }]}
              >
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: scaled(14, theme) }}>▤ {f.name}</Text>
                <Text style={{ color: theme.textMuted, fontSize: scaled(12, theme) }}>{f.appIds.length}</Text>
              </Pressable>
            ))}
          </ResultGroup>
          <ResultGroup title="Styro actions" count={results.actions.length}>
            {results.actions.map((a) => (
              <Pressable
                key={a.id}
                accessibilityRole="button"
                accessibilityLabel={a.title}
                onPress={() => { closeSearch(); a.run(); }}
                style={[styles.resultRow, { backgroundColor: theme.accentSoft, borderRadius: theme.radiusSm }]}
              >
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: scaled(14, theme) }}>{a.title}</Text>
                <Text style={{ color: theme.textMuted, fontSize: scaled(12, theme) }}>{a.subtitle}</Text>
              </Pressable>
            ))}
          </ResultGroup>
        </ScrollView>
      );
    }
    if (visibleApps.length === 0) {
      const emptyCopy: Record<DrawerMode, { title: string; message: string }> = {
        all: { title: 'No apps here', message: 'The demo catalog is empty. Restore it from Customize → Data & Recovery.' },
        categories: { title: 'Empty category', message: 'No apps in this category yet. Move apps here from any app menu.' },
        recent: { title: 'No recent apps', message: 'Apps you open in preview will appear here.' },
        favorites: { title: 'No favorites yet', message: 'Long-press any app and choose Add to Favorites.' },
        custom: { title: 'Nothing ordered', message: 'Custom order is empty.' },
        hidden: { title: 'Nothing hidden', message: 'Hidden preview apps appear here. Hiding never uninstalls or secures an app.' },
      };
      const c = emptyCopy[state.drawerMode];
      return <EmptyState title={c.title} message={c.message} action={<RetryBtn label="Browse All Apps" onPress={() => setDrawerMode('all')} />} />;
    }
    if (grid) {
      return (
        <ScrollView contentContainerStyle={[styles.gridPad, { paddingHorizontal: theme.densityPad }]} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>{visibleApps.map(renderRow)}</View>
        </ScrollView>
      );
    }
    if (sections) {
      return (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <ScrollView
            ref={listRef}
            contentContainerStyle={[styles.listPad, { paddingHorizontal: theme.densityPad + 8, flexGrow: 1 }]}
            showsVerticalScrollIndicator={false}
          >
            {sections.map(([letter, apps]) => (
              <View
                key={letter}
                onLayout={(e) => { sectionOffsets.current[letter] = e.nativeEvent.layout.y; }}
              >
                <Text accessibilityRole="header" style={[styles.letter, { color: theme.textMuted, fontSize: scaled(12, theme) }]}>
                  {letter}
                </Text>
                {apps.map(renderRow)}
              </View>
            ))}
          </ScrollView>
          {showRail && (
            <View style={[styles.rail, { borderColor: theme.edge }]} accessibilityRole="list" accessibilityLabel="Alphabet index">
              {letters.map((l) => (
                <Pressable
                  key={l}
                  accessibilityRole="button"
                  accessibilityLabel={`Jump to ${l}`}
                  onPress={() => jumpToLetter(l)}
                  style={styles.railBtn}
                  hitSlop={4}
                >
                  <Text style={[styles.railLetter, { color: theme.textSecondary, fontSize: scaled(11, theme) }]}>{l}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      );
    }
    return (
      <ScrollView contentContainerStyle={[styles.listPad, { paddingHorizontal: theme.densityPad + 8 }]} showsVerticalScrollIndicator={false}>
        {state.drawerMode === 'categories' && state.drawerCategory === 'all'
          ? state.categories.map((cat) => {
              const apps = visibleApps.filter((a) => a.category === cat.id);
              if (apps.length === 0) return null;
              return (
                <View key={cat.id}>
                  <Text accessibilityRole="header" style={[styles.letter, { color: theme.textMuted, fontSize: scaled(12, theme) }]}>
                    {cat.name.toUpperCase()}
                  </Text>
                  {apps.map(renderRow)}
                </View>
              );
            })
          : visibleApps.map(renderRow)}
      </ScrollView>
    );
  };

  return (
    <ResponsiveShell>
      <View style={{ flex: 1 }}>
        {header}
        <View style={{ flex: 1, marginTop: 8 }}>{body()}</View>
        {launchMsg && (
          <Pressable
            accessibilityLabel="Dismiss"
            onPress={() => setLaunchMsg(null)}
            style={[styles.toast, { backgroundColor: theme.bgElevated, borderColor: theme.edge }]}
          >
            <View style={[styles.toastDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.toastText, { color: theme.text, fontSize: scaled(13, theme) }]}>{launchMsg}</Text>
          </Pressable>
        )}
      </View>
      <AppActionSheet app={actionApp} onClose={() => setActionApp(null)} onOpenFolder={(id) => { setActionApp(null); setOpenFolder(id); }} />
      <FolderOverlay folder={state.folders.find((f) => f.id === openFolder) ?? null} onClose={() => setOpenFolder(null)} />
      {state.drawerMode === 'hidden' && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <PermissionNotice text="Hidden in preview only. This does not uninstall, secure, or lock the app." />
        </View>
      )}
    </ResponsiveShell>
  );
}

function sortApps(apps: AppItem[], sort: 'alpha' | 'category' | 'recent' | 'custom'): AppItem[] {
  const list = [...apps];
  switch (sort) {
    case 'recent': return list.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
    case 'custom': return list.sort((a, b) => a.order - b.order);
    case 'category':
    case 'alpha':
    default: return list.sort((a, b) => displayName(a).localeCompare(displayName(b)));
  }
}

function ResultGroup({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const { theme } = useStyro();
  if (count === 0) return null;
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        accessibilityLiveRegion="polite"
        style={[styles.groupTitle, { color: theme.textMuted, fontSize: scaled(11.5, theme) }]}
      >
        {title.toUpperCase()} · {count}
      </Text>
      {children}
    </View>
  );
}

function RetryBtn({ label = 'Try again', onPress }: { label?: string; onPress: () => void }) {
  const { theme } = useStyro();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.retry, { backgroundColor: theme.accent, borderRadius: theme.radiusSm }]}
    >
      <Text style={{ color: theme.accentText, fontWeight: '700', fontSize: scaled(14, theme) }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '700', flex: 1 },
  count: {},
  modes: { gap: 8, paddingVertical: 2 },
  modeChip: { paddingHorizontal: 14, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  listPad: { paddingBottom: 32, gap: 2 },
  gridPad: { paddingBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  letter: { fontWeight: '700', letterSpacing: 1.2, marginTop: 12, marginBottom: 4 },
  skeleton: { marginBottom: 8, opacity: 0.6 },
  rail: { width: 34, borderLeftWidth: 1, alignItems: 'center', paddingVertical: 8 },
  railBtn: { paddingVertical: 3, minHeight: 28, justifyContent: 'center' },
  railLetter: { fontWeight: '600' },
  groupTitle: { fontWeight: '700', letterSpacing: 1.2, marginBottom: 6 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 6 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  toastDot: { width: 8, height: 8, borderRadius: 4 },
  toastText: { flex: 1, lineHeight: 18 },
  retry: { paddingHorizontal: 18, paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
});
