import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Dimensions, Platform, useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import type {
  AppItem,
  BackupPayload,
  Category,
  DrawerMode,
  DrawerSort,
  Folder,
  GestureActionId,
  GestureId,
  HomePage,
  StyroSettings,
  StyroState,
  Widget,
} from './types';
import { buildTheme, type Theme } from './tokens';
import { defaultState, loadState, readUndo, saveState, snapshotUndo } from './persistence';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_GESTURES,
  defaultApps,
  defaultPages,
  defaultSettings,
  defaultWidgets,
  displayName,
  uid,
  WIDGET_CATALOG,
} from './demoApps';
import { classifyViewport, effectiveViewport, type Viewport } from './responsive';

export interface SearchAction {
  id: string;
  title: string;
  subtitle: string;
  run: () => void;
}

interface StyroContextValue {
  ready: boolean;
  state: StyroState;
  theme: Theme;
  viewport: Viewport;
  framed: boolean;
  frameLabel?: string;
  systemDark: boolean;
  reducedMotion: boolean;
  announceMsg: string;
  announce: (msg: string) => void;
  buzz: (kind?: 'light' | 'medium' | 'heavy' | 'success') => void;

  updateSettings: (patch: Partial<StyroSettings>) => void;
  resetAppearance: () => void;
  resetLayout: () => void;
  resetOrganization: () => void;
  resetGestures: () => void;
  resetEverything: () => void;

  toggleFavorite: (appId: string) => void;
  moveFavorite: (pageId: string, from: number, to: number) => void;
  restoreFavorites: () => void;
  setPinned: (pageId: string, ids: string[]) => void;

  hideApp: (appId: string, hidden: boolean) => void;
  renameApp: (appId: string, name: string | undefined) => void;
  setAppIcon: (appId: string, style: AppItem['iconStyle'], tint?: string) => void;
  moveAppCategory: (appId: string, categoryId: string) => void;
  touchApp: (appId: string) => void;
  syncInstalledApps: () => Promise<{ count: number } | null>;

  addFolder: (name: string, appIds?: string[]) => Folder;
  renameFolder: (folderId: string, name: string) => void;
  deleteFolder: (folderId: string) => void;
  addAppToFolder: (appId: string, folderId: string) => void;
  removeAppFromFolder: (appId: string) => void;

  addWidget: (type: Widget['type'], pageId: string) => void;
  createStack: (pageId: string) => void;
  removeWidget: (widgetId: string) => void;
  renameWidget: (widgetId: string, title: string) => void;
  cycleStack: (widgetId: string, dir: 1 | -1) => void;
  addToStack: (stackId: string, type: Widget['type']) => void;
  removeFromStack: (stackId: string, index: number) => void;
  setStackInterval: (stackId: string, seconds: number) => void;

  addPage: (name: string) => void;
  renamePage: (pageId: string, name: string) => void;
  deletePage: (pageId: string, mode: 'move' | 'remove') => void;
  reorderPage: (pageId: string, dir: 1 | -1) => void;
  setDefaultPage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  setActivePage: (pageId: string) => void;

  addCategory: (name: string) => void;
  renameCategory: (id: string, name: string) => void;
  deleteCategory: (id: string, moveTo: string) => void;
  reorderCategory: (id: string, dir: 1 | -1) => void;
  setCategorySort: (id: string, sort: DrawerSort) => void;
  autoCategorize: () => { moved: number };

  setGesture: (gesture: GestureId, action: GestureActionId) => void;
  gestureConflicts: GestureId[];

  setDrawerMode: (mode: DrawerMode) => void;
  setDrawerCategory: (id: string) => void;

  exportBackup: () => BackupPayload;
  importBackup: (payload: BackupPayload) => { changed: string[] };
  undoImport: () => Promise<boolean>;

  searchActions: SearchAction[];
  registerSearchActions: (actions: SearchAction[]) => void;
}

const StyroContext = createContext<StyroContextValue | null>(null);

export function useStyro(): StyroContextValue {
  const ctx = useContext(StyroContext);
  if (!ctx) throw new Error('useStyro must be used inside StyroProvider');
  return ctx;
}

export function StyroProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StyroState>(defaultState);
  const [ready, setReady] = useState(false);
  const [announceMsg, setAnnounceMsg] = useState('');
  const [dims, setDims] = useState(() => Dimensions.get('window'));
  const systemScheme = useColorScheme();
  const systemDark = systemScheme === 'dark';
  const extraActions = useRef<SearchAction[]>([]);
  const [, force] = useState(0);

  useEffect(() => {
    loadState().then((s) => {
      setState(s);
      setReady(true);
    });
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveState(state), 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, ready]);

  const patch = useCallback((fn: (s: StyroState) => StyroState) => {
    setState((s) => fn(s));
  }, []);

  const announce = useCallback((msg: string) => {
    setAnnounceMsg('');
    requestAnimationFrame(() => setAnnounceMsg(msg));
  }, []);

  const buzz = useCallback(
    (kind: 'light' | 'medium' | 'heavy' | 'success' = 'light') => {
      if (!state.settings.hapticsEnabled || Platform.OS === 'web') return;
      try {
        if (kind === 'success') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else
          void Haptics.impactAsync(
            kind === 'heavy'
              ? Haptics.ImpactFeedbackStyle.Heavy
              : kind === 'medium'
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Light,
          );
      } catch {
        /* haptics unavailable */
      }
    },
    [state.settings.hapticsEnabled],
  );

  const theme = useMemo(
    () => buildTheme(state.settings, systemDark),
    [state.settings, systemDark],
  );
  const reducedMotion = state.settings.motionLevel === 'reduced';

  const { viewport, framed, frameLabel } = useMemo(() => {
    const eff = effectiveViewport(state.settings.formFactorPreview);
    if (state.settings.formFactorPreview === 'auto') {
      return { viewport: classifyViewport(dims.width, dims.height), framed: false, frameLabel: undefined };
    }
    return { viewport: eff.viewport, framed: eff.framed, frameLabel: eff.frameLabel };
  }, [dims, state.settings.formFactorPreview]);

  /* ---------- settings ---------- */
  const updateSettings = useCallback(
    (p: Partial<StyroSettings>) => patch((s) => ({ ...s, settings: { ...s.settings, ...p } })),
    [patch],
  );

  const resetAppearance = useCallback(() => {
    const d = defaultSettings();
    patch((s) => ({
      ...s,
      settings: {
        ...s.settings,
        theme: d.theme,
        accentIntensity: d.accentIntensity,
        surface: d.surface,
        radius: d.radius,
        contrast: d.contrast,
        iconStyle: d.iconStyle,
        iconSize: d.iconSize,
        showLabels: d.showLabels,
        typeScale: d.typeScale,
        density: d.density,
        motionLevel: d.motionLevel,
      },
    }));
    announce('Appearance reset to Styro defaults.');
  }, [patch, announce]);

  const resetLayout = useCallback(() => {
    patch((s) => ({ ...s, pages: defaultPages(), activePageId: 'page-home', widgets: defaultWidgets() }));
    announce('Home layout reset.');
  }, [patch, announce]);

  const resetOrganization = useCallback(() => {
    patch((s) => ({
      ...s,
      apps: defaultApps(),
      categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
      folders: [],
      drawerMode: 'all',
      drawerCategory: 'all',
    }));
    announce('App organization restored.');
  }, [patch, announce]);

  const resetGestures = useCallback(() => {
    patch((s) => ({ ...s, gestures: { ...DEFAULT_GESTURES } }));
    announce('Gestures restored to defaults.');
  }, [patch, announce]);

  const resetEverything = useCallback(() => {
    const fresh = defaultState();
    fresh.settings.onboarded = true;
    setState(fresh);
    announce('Styro reset to factory defaults.');
  }, [announce]);

  /* ---------- favorites / pages ---------- */
  const activePage = state.pages.find((p) => p.id === state.activePageId) ?? state.pages[0];

  const setPinned = useCallback(
    (pageId: string, ids: string[]) => {
      patch((s) => ({
        ...s,
        pages: s.pages.map((p) => (p.id === pageId ? { ...p, pinnedIds: ids } : p)),
      }));
    },
    [patch],
  );

  const toggleFavorite = useCallback(
    (appId: string) => {
      const app = state.apps.find((a) => a.id === appId);
      if (!app) return;
      const turningOn = !app.isFavorite;
      patch((s) => ({
        ...s,
        apps: s.apps.map((a) => (a.id === appId ? { ...a, isFavorite: turningOn } : a)),
        pages: s.pages.map((p) =>
          p.id === s.activePageId
            ? {
                ...p,
                pinnedIds: turningOn
                  ? p.pinnedIds.includes(appId)
                    ? p.pinnedIds
                    : [...p.pinnedIds, appId]
                  : p.pinnedIds.filter((id) => id !== appId),
              }
            : p,
        ),
      }));
      announce(turningOn ? `Added ${displayName(app)} to favorites.` : `Removed ${displayName(app)} from favorites.`);
      buzz(turningOn ? 'success' : 'light');
    },
    [patch, state.apps, state.activePageId, announce, buzz],
  );

  const moveFavorite = useCallback(
    (pageId: string, from: number, to: number) => {
      patch((s) => ({
        ...s,
        pages: s.pages.map((p) => {
          if (p.id !== pageId) return p;
          const ids = [...p.pinnedIds];
          if (from < 0 || from >= ids.length || to < 0 || to >= ids.length) return p;
          const [moved] = ids.splice(from, 1);
          ids.splice(to, 0, moved);
          return { ...p, pinnedIds: ids };
        }),
      }));
    },
    [patch],
  );

  const restoreFavorites = useCallback(() => {
    const favIds = defaultApps().filter((a) => a.isFavorite).map((a) => a.id);
    patch((s) => ({
      ...s,
      apps: s.apps.map((a) => ({ ...a, isFavorite: favIds.includes(a.id) })),
      pages: s.pages.map((p) =>
        p.id === s.activePageId ? { ...p, pinnedIds: favIds } : p,
      ),
    }));
    announce('Default favorite set restored.');
  }, [patch, announce]);

  /* ---------- apps ---------- */
  const hideApp = useCallback(
    (appId: string, hidden: boolean) => {
      patch((s) => ({
        ...s,
        apps: s.apps.map((a) => (a.id === appId ? { ...a, isHidden: hidden } : a)),
      }));
      const app = state.apps.find((a) => a.id === appId);
      announce(hidden ? `${app ? displayName(app) : 'App'} hidden in preview. Hiding does not uninstall or secure the app.` : 'App is visible again.');
    },
    [patch, state.apps, announce],
  );

  const renameApp = useCallback(
    (appId: string, name: string | undefined) =>
      patch((s) => ({
        ...s,
        apps: s.apps.map((a) => (a.id === appId ? { ...a, customName: name } : a)),
      })),
    [patch],
  );

  const setAppIcon = useCallback(
    (appId: string, style: AppItem['iconStyle'], tint?: string) =>
      patch((s) => ({
        ...s,
        apps: s.apps.map((a) =>
          a.id === appId ? { ...a, iconStyle: style, iconTint: tint ?? a.iconTint } : a,
        ),
      })),
    [patch],
  );

  const moveAppCategory = useCallback(
    (appId: string, categoryId: string) =>
      patch((s) => ({
        ...s,
        apps: s.apps.map((a) => (a.id === appId ? { ...a, category: categoryId } : a)),
      })),
    [patch],
  );

  const touchApp = useCallback(
    (appId: string) =>
      patch((s) => ({
        ...s,
        apps: s.apps.map((a) => (a.id === appId ? { ...a, lastOpenedAt: Date.now() } : a)),
      })),
    [patch],
  );

  /**
   * Replace the demo catalog with the real installed apps on Android.
   * User customizations (favorites, folders, categories, hidden, renames)
   * are preserved by matching on packageName.
   */
  const syncInstalledApps = useCallback(
    async (): Promise<{ count: number } | null> => {
      const { getInstalledApps, isLauncherNative } = await import('./launcher');
      if (!isLauncherNative()) return null;
      const installed = await getInstalledApps();
      let count = 0;
      patch((s) => {
        const prev = new Map(s.apps.map((a) => [a.packageName ?? a.id, a]));
        const seen = new Set<string>();
        const apps: AppItem[] = installed.map((inst, i) => {
          const id = `pkg:${inst.packageName}`;
          seen.add(inst.packageName);
          const old = prev.get(inst.packageName);
          count += 1;
          return {
            id,
            name: inst.label,
            customName: old?.customName,
            category: old?.category ?? 'other',
            aliases: old?.aliases ?? [],
            isFavorite: old?.isFavorite ?? false,
            isHidden: old?.isHidden ?? false,
            folderId: old?.folderId,
            lastOpenedAt: old?.lastOpenedAt ?? 0,
            order: i,
            packageName: inst.packageName,
            iconBase64: inst.iconBase64 ?? null,
          } as AppItem;
        });
        // Keep any user-created demo entries that don't collide (unlikely on device).
        const validIds = new Set(apps.map((a) => a.id));
        return {
          ...s,
          apps,
          pages: s.pages.map((p) => ({
            ...p,
            pinnedIds: p.pinnedIds.filter((pid) => validIds.has(pid)),
          })),
          folders: s.folders.map((f) => ({
            ...f,
            appIds: f.appIds.filter((aid) => validIds.has(aid)),
          })),
        };
      });
      announce(`App list updated. ${count} apps found.`);
      return { count };
    },
    [patch, announce],
  );

  /* ---------- folders ---------- */
  const addFolder = useCallback(
    (name: string, appIds: string[] = []) => {
      const folder: Folder = { id: uid('folder'), name: name.trim() || 'New folder', appIds: [...appIds], colorToken: '#C7F36B', style: 'popup' };
      patch((s) => ({ ...s, folders: [...s.folders, folder] }));
      announce(`Folder ${folder.name} created.`);
      return folder;
    },
    [patch, announce],
  );

  const renameFolder = useCallback(
    (folderId: string, name: string) =>
      patch((s) => ({
        ...s,
        folders: s.folders.map((f) => (f.id === folderId ? { ...f, name: name.trim() || f.name } : f)),
      })),
    [patch],
  );

  const deleteFolder = useCallback(
    (folderId: string) => {
      const folder = state.folders.find((f) => f.id === folderId);
      patch((s) => ({
        ...s,
        folders: s.folders.filter((f) => f.id !== folderId),
        apps: s.apps.map((a) => (a.folderId === folderId ? { ...a, folderId: undefined } : a)),
      }));
      announce(folder ? `Folder ${folder.name} deleted. Its apps stay in App Space.` : 'Folder deleted.');
    },
    [patch, state.folders, announce],
  );

  const addAppToFolder = useCallback(
    (appId: string, folderId: string) => {
      const folder = state.folders.find((f) => f.id === folderId);
      if (!folder || folder.appIds.includes(appId)) return;
      patch((s) => ({
        ...s,
        folders: s.folders.map((f) =>
          f.id === folderId ? { ...f, appIds: [...f.appIds, appId] } : f,
        ),
        apps: s.apps.map((a) => (a.id === appId ? { ...a, folderId } : a)),
      }));
      const app = state.apps.find((a) => a.id === appId);
      announce(`${app ? displayName(app) : 'App'} added to ${folder.name}.`);
    },
    [patch, state.folders, state.apps, announce],
  );

  const removeAppFromFolder = useCallback(
    (appId: string) => {
      patch((s) => ({
        ...s,
        folders: s.folders.map((f) => ({ ...f, appIds: f.appIds.filter((id) => id !== appId) })),
        apps: s.apps.map((a) => (a.id === appId ? { ...a, folderId: undefined } : a)),
      }));
      announce('Removed from folder.');
    },
    [patch, announce],
  );

  /* ---------- widgets ---------- */
  const addWidget = useCallback(
    (type: Widget['type'], pageId: string) => {
      const def = WIDGET_CATALOG.find((w) => w.type === type);
      const w: Widget = {
        id: uid('widget'),
        kind: 'card',
        type,
        title: def?.title ?? type,
        status: 'ready',
        size: 'medium',
        pageId,
      };
      patch((s) => ({ ...s, widgets: [...s.widgets, w] }));
      announce(`${w.title} added to home.`);
    },
    [patch, announce],
  );

  const createStack = useCallback(
    (pageId: string) => {
      const w: Widget = {
        id: uid('stack'),
        kind: 'stack',
        type: 'focus',
        title: 'Stack',
        status: 'ready',
        size: 'medium',
        pageId,
        cards: [
          { type: 'focus', title: 'Focus' },
          { type: 'weather', title: 'Weather Preview' },
        ],
        activeIndex: 0,
        rotateSeconds: 0,
      };
      patch((s) => ({ ...s, widgets: [...s.widgets, w] }));
      announce('Widget stack created. Manage its cards from Customize.');
    },
    [patch, announce],
  );

  const removeWidget = useCallback(
    (widgetId: string) => {
      patch((s) => ({ ...s, widgets: s.widgets.filter((w) => w.id !== widgetId) }));
      announce('Widget removed.');
    },
    [patch, announce],
  );

  const renameWidget = useCallback(
    (widgetId: string, title: string) =>
      patch((s) => ({
        ...s,
        widgets: s.widgets.map((w) => (w.id === widgetId ? { ...w, title: title.trim() || w.title } : w)),
      })),
    [patch],
  );

  const cycleStack = useCallback(
    (widgetId: string, dir: 1 | -1) => {
      patch((s) => ({
        ...s,
        widgets: s.widgets.map((w) => {
          if (w.id !== widgetId || w.kind !== 'stack' || !w.cards?.length) return w;
          const n = w.cards.length;
          const next = (((w.activeIndex ?? 0) + dir) % n + n) % n;
          return { ...w, activeIndex: next };
        }),
      }));
    },
    [patch],
  );

  const addToStack = useCallback(
    (stackId: string, type: Widget['type']) => {
      const def = WIDGET_CATALOG.find((w) => w.type === type);
      if (!def) return;
      patch((s) => ({
        ...s,
        widgets: s.widgets.map((w) =>
          w.id === stackId && w.kind === 'stack'
            ? { ...w, cards: [...(w.cards ?? []), { type: def.type, title: def.title }] }
            : w,
        ),
      }));
      announce(`${def.title} added to stack.`);
    },
    [patch, announce],
  );

  const removeFromStack = useCallback(
    (stackId: string, index: number) => {
      patch((s) => ({
        ...s,
        widgets: s.widgets.map((w) => {
          if (w.id !== stackId || w.kind !== 'stack') return w;
          const cards = (w.cards ?? []).filter((_, i) => i !== index);
          return { ...w, cards, activeIndex: 0 };
        }),
      }));
    },
    [patch],
  );

  const setStackInterval = useCallback(
    (stackId: string, seconds: number) =>
      patch((s) => ({
        ...s,
        widgets: s.widgets.map((w) => (w.id === stackId ? { ...w, rotateSeconds: seconds } : w)),
      })),
    [patch],
  );

  /* ---------- pages ---------- */
  const addPage = useCallback(
    (name: string) => {
      const page: HomePage = { id: uid('page'), name: name.trim() || 'New page', isDefault: false, pinnedIds: [] };
      patch((s) => ({ ...s, pages: [...s.pages, page], activePageId: page.id }));
      announce(`Page ${page.name} added.`);
    },
    [patch, announce],
  );

  const renamePage = useCallback(
    (pageId: string, name: string) =>
      patch((s) => ({
        ...s,
        pages: s.pages.map((p) => (p.id === pageId ? { ...p, name: name.trim() || p.name } : p)),
      })),
    [patch],
  );

  const deletePage = useCallback(
    (pageId: string, mode: 'move' | 'remove') => {
      const page = state.pages.find((p) => p.id === pageId);
      if (!page || state.pages.length <= 1) return;
      patch((s) => {
        const remaining = s.pages.filter((p) => p.id !== pageId);
        let pages = remaining;
        if (mode === 'move') {
          const target = remaining.find((p) => p.isDefault) ?? remaining[0];
          pages = remaining.map((p) =>
            p.id === target.id
              ? { ...p, pinnedIds: [...p.pinnedIds, ...page.pinnedIds.filter((id) => !p.pinnedIds.includes(id))] }
              : p,
          );
        }
        if (!pages.some((p) => p.isDefault)) pages = pages.map((p, i) => ({ ...p, isDefault: i === 0 }));
        const fallbackId = pages[0].id;
        return {
          ...s,
          pages,
          activePageId: s.activePageId === pageId ? fallbackId : s.activePageId,
          widgets:
            mode === 'move'
              ? s.widgets.map((w) => (w.pageId === pageId ? { ...w, pageId: fallbackId } : w))
              : s.widgets.filter((w) => w.pageId !== pageId),
        };
      });
      announce(`Page ${page.name} deleted.`);
    },
    [patch, state.pages, announce],
  );

  const reorderPage = useCallback(
    (pageId: string, dir: 1 | -1) =>
      patch((s) => {
        const i = s.pages.findIndex((p) => p.id === pageId);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= s.pages.length) return s;
        const pages = [...s.pages];
        [pages[i], pages[j]] = [pages[j], pages[i]];
        return { ...s, pages };
      }),
    [patch],
  );

  const setDefaultPage = useCallback(
    (pageId: string) =>
      patch((s) => ({ ...s, pages: s.pages.map((p) => ({ ...p, isDefault: p.id === pageId })) })),
    [patch],
  );

  const duplicatePage = useCallback(
    (pageId: string) => {
      const page = state.pages.find((p) => p.id === pageId);
      if (!page) return;
      const copy: HomePage = { ...page, id: uid('page'), name: `${page.name} copy`, isDefault: false, pinnedIds: [...page.pinnedIds] };
      patch((s) => ({ ...s, pages: [...s.pages, copy] }));
      announce(`Duplicated as ${copy.name}.`);
    },
    [patch, state.pages, announce],
  );

  const setActivePage = useCallback(
    (pageId: string) => patch((s) => ({ ...s, activePageId: pageId })),
    [patch],
  );

  /* ---------- categories ---------- */
  const addCategory = useCallback(
    (name: string) => {
      const cat: Category = { id: uid('cat'), name: name.trim() || 'New category', accent: '#AAB8B7', sort: 'alpha' };
      patch((s) => ({ ...s, categories: [...s.categories, cat] }));
      announce(`Category ${cat.name} added.`);
    },
    [patch, announce],
  );

  const renameCategory = useCallback(
    (id: string, name: string) =>
      patch((s) => ({
        ...s,
        categories: s.categories.map((c) => (c.id === id ? { ...c, name: name.trim() || c.name } : c)),
      })),
    [patch],
  );

  const deleteCategory = useCallback(
    (id: string, moveTo: string) => {
      if (id === 'other') return;
      const cat = state.categories.find((c) => c.id === id);
      patch((s) => ({
        ...s,
        categories: s.categories.filter((c) => c.id !== id),
        apps: s.apps.map((a) => (a.category === id ? { ...a, category: moveTo } : a)),
        drawerCategory: s.drawerCategory === id ? 'all' : s.drawerCategory,
      }));
      announce(cat ? `Category ${cat.name} deleted. Its apps moved.` : 'Category deleted.');
    },
    [patch, state.categories, announce],
  );

  const reorderCategory = useCallback(
    (id: string, dir: 1 | -1) =>
      patch((s) => {
        const i = s.categories.findIndex((c) => c.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= s.categories.length) return s;
        const categories = [...s.categories];
        [categories[i], categories[j]] = [categories[j], categories[i]];
        return { ...s, categories };
      }),
    [patch],
  );

  const setCategorySort = useCallback(
    (id: string, sort: DrawerSort) =>
      patch((s) => ({ ...s, categories: s.categories.map((c) => (c.id === id ? { ...c, sort } : c)) })),
    [patch],
  );

  const autoCategorize = useCallback(() => {
    // Deterministic local heuristic: assign by keyword in aliases/name.
    const rules: { test: RegExp; cat: string }[] = [
      { test: /mail|message|chat|sms|social|feed/i, cat: 'communication' },
      { test: /note|task|calendar|schedule|todo/i, cat: 'work' },
      { test: /music|photo|camera|video|media/i, cat: 'media' },
      { test: /book|read|news|article/i, cat: 'read' },
      { test: /game|arcade|puzzle|play/i, cat: 'games' },
      { test: /map|weather|travel|trip|compass/i, cat: 'travel' },
      { test: /draw|sketch|design|create/i, cat: 'create' },
    ];
    let moved = 0;
    patch((s) => ({
      ...s,
      apps: s.apps.map((a) => {
        const hay = `${a.name} ${a.aliases.join(' ')}`;
        const rule = rules.find((r) => r.test.test(hay));
        if (rule && a.category !== rule.cat) {
          moved += 1;
          return { ...a, category: rule.cat };
        }
        return a;
      }),
    }));
    return { moved };
  }, [patch]);

  /* ---------- gestures ---------- */
  const setGesture = useCallback(
    (gesture: GestureId, action: GestureActionId) =>
      patch((s) => ({ ...s, gestures: { ...s.gestures, [gesture]: action } })),
    [patch],
  );

  const gestureConflicts = useMemo(() => {
    const seen = new Map<GestureActionId, GestureId[]>();
    (Object.keys(state.gestures) as GestureId[]).forEach((g) => {
      const a = state.gestures[g];
      if (a === 'none') return;
      const list = seen.get(a) ?? [];
      list.push(g);
      seen.set(a, list);
    });
    const conflicted = new Set<GestureId>();
    seen.forEach((list) => {
      if (list.length > 1) list.forEach((g) => conflicted.add(g));
    });
    // scroll-conflicting physical gestures warn: swipe-up/down on home also scrolls
    return [...conflicted];
  }, [state.gestures]);

  /* ---------- drawer ---------- */
  const setDrawerMode = useCallback(
    (mode: DrawerMode) => patch((s) => ({ ...s, drawerMode: mode })),
    [patch],
  );
  const setDrawerCategory = useCallback(
    (id: string) => patch((s) => ({ ...s, drawerCategory: id })),
    [patch],
  );

  /* ---------- backup ---------- */
  const exportBackup = useCallback((): BackupPayload => {
    const { settings, apps, folders, widgets, pages, activePageId, categories, gestures } = state;
    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      settings,
      apps,
      folders,
      widgets,
      pages,
      activePageId,
      categories,
      gestures,
    };
  }, [state]);

  const importBackup = useCallback(
    (payload: BackupPayload) => {
      const changed: string[] = [];
      void snapshotUndo(state);
      const cur = state;
      if (JSON.stringify(cur.settings) !== JSON.stringify(payload.settings)) changed.push('Appearance & behavior settings');
      if (cur.apps.length !== payload.apps.length) changed.push('App list');
      if (cur.folders.length !== payload.folders.length) changed.push('Folders');
      if (cur.widgets.length !== payload.widgets.length) changed.push('Widgets');
      if (cur.pages.length !== payload.pages.length) changed.push('Home pages');
      if (changed.length === 0) changed.push('Configuration values');
      setState((s) => ({
        ...s,
        settings: { ...payload.settings, onboarded: s.settings.onboarded },
        apps: payload.apps,
        folders: payload.folders,
        widgets: payload.widgets,
        pages: payload.pages,
        activePageId: payload.activePageId,
        categories: payload.categories,
        gestures: payload.gestures,
        drawerMode: payload.settings.defaultDrawerMode,
        drawerCategory: 'all',
      }));
      announce('Backup applied. Previous state kept for undo.');
      return { changed };
    },
    [state, announce],
  );

  const undoImport = useCallback(async () => {
    const prev = await readUndo();
    if (!prev) return false;
    setState(prev);
    announce('Import undone.');
    return true;
  }, [announce]);

  /* ---------- search actions ---------- */
  const registerSearchActions = useCallback((actions: SearchAction[]) => {
    extraActions.current = actions;
    force((n) => n + 1);
  }, []);

  const searchActions = useMemo<SearchAction[]>(() => extraActions.current, [extraActions.current, ready]);

  const value: StyroContextValue = {
    ready,
    state,
    theme,
    viewport,
    framed,
    frameLabel,
    systemDark,
    reducedMotion,
    announceMsg,
    announce,
    buzz,
    updateSettings,
    resetAppearance,
    resetLayout,
    resetOrganization,
    resetGestures,
    resetEverything,
    toggleFavorite,
    moveFavorite,
    restoreFavorites,
    setPinned,
    hideApp,
    renameApp,
    setAppIcon,
    moveAppCategory,
    touchApp,
    syncInstalledApps,
    addFolder,
    renameFolder,
    deleteFolder,
    addAppToFolder,
    removeAppFromFolder,
    addWidget,
    createStack,
    removeWidget,
    renameWidget,
    cycleStack,
    addToStack,
    removeFromStack,
    setStackInterval,
    addPage,
    renamePage,
    deletePage,
    reorderPage,
    setDefaultPage,
    duplicatePage,
    setActivePage,
    addCategory,
    renameCategory,
    deleteCategory,
    reorderCategory,
    setCategorySort,
    autoCategorize,
    setGesture,
    gestureConflicts,
    setDrawerMode,
    setDrawerCategory,
    exportBackup,
    importBackup,
    undoImport,
    searchActions,
    registerSearchActions,
    // expose active page helper via state
  };

  return <StyroContext.Provider value={value}>{children}</StyroContext.Provider>;
}

export function activePageOf(s: StyroState): HomePage {
  return s.pages.find((p) => p.id === s.activePageId) ?? s.pages[0];
}
