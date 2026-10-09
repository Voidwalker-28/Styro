import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StyroState } from './types';
import { defaultApps, defaultPages, defaultSettings, defaultWidgets, DEFAULT_CATEGORIES, DEFAULT_GESTURES } from './demoApps';

const KEY = 'styro:v1:state';
const UNDO_KEY = 'styro:v1:undo';

export function defaultState(): StyroState {
  const settings = defaultSettings();
  const apps = defaultApps();
  const pages = defaultPages();
  return {
    settings,
    apps,
    folders: [],
    widgets: defaultWidgets(),
    pages,
    activePageId: pages[0].id,
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    gestures: { ...DEFAULT_GESTURES },
    drawerMode: settings.defaultDrawerMode,
    drawerCategory: 'all',
    schemaVersion: 1,
  };
}

export async function loadState(): Promise<StyroState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<StyroState>;
    const fresh = defaultState();
    if (parsed.schemaVersion !== 1) return fresh;
    return {
      ...fresh,
      ...parsed,
      settings: { ...fresh.settings, ...(parsed.settings ?? {}) },
    } as StyroState;
  } catch {
    return defaultState();
  }
}

export async function saveState(state: StyroState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // persistence is best-effort; the app keeps working in memory
  }
}

export async function snapshotUndo(state: StyroState): Promise<void> {
  try {
    await AsyncStorage.setItem(UNDO_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

export async function readUndo(): Promise<StyroState | null> {
  try {
    const raw = await AsyncStorage.getItem(UNDO_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StyroState;
  } catch {
    return null;
  }
}

export function validateBackup(payload: unknown): { ok: true } | { ok: false; reason: string } {
  if (!payload || typeof payload !== 'object') return { ok: false, reason: 'Not a JSON object.' };
  const p = payload as Record<string, unknown>;
  if (p.schemaVersion !== 1) return { ok: false, reason: 'Unsupported schema version.' };
  if (!p.settings || typeof p.settings !== 'object') return { ok: false, reason: 'Missing settings.' };
  if (!Array.isArray(p.apps)) return { ok: false, reason: 'Missing app list.' };
  if (!Array.isArray(p.pages)) return { ok: false, reason: 'Missing home pages.' };
  return { ok: true };
}
