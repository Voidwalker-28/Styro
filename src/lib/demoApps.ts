import type { AppItem, Category, HomePage, StyroSettings, Widget, GestureMap } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'communication', name: 'Communication', accent: '#83B7FF', sort: 'alpha' },
  { id: 'work', name: 'Work', accent: '#C7F36B', sort: 'alpha' },
  { id: 'create', name: 'Create', accent: '#F5C66B', sort: 'alpha' },
  { id: 'media', name: 'Media', accent: '#FF8C86', sort: 'alpha' },
  { id: 'read', name: 'Read', accent: '#B7A6F5', sort: 'alpha' },
  { id: 'tools', name: 'Tools', accent: '#9DEB9A', sort: 'alpha' },
  { id: 'travel', name: 'Travel', accent: '#8AD8D8', sort: 'alpha' },
  { id: 'games', name: 'Games', accent: '#F5A66B', sort: 'alpha' },
  { id: 'other', name: 'Other', accent: '#AAB8B7', sort: 'alpha' },
];

interface DemoAppSeed {
  id: string;
  name: string;
  category: string;
  aliases: string[];
  tint: string;
  badge?: number;
  favorite?: boolean;
}

const SEEDS: DemoAppSeed[] = [
  { id: 'arc', name: 'Arc', category: 'tools', aliases: ['browser', 'web', 'internet'], tint: '#83B7FF', favorite: true },
  { id: 'bloom', name: 'Bloom', category: 'media', aliases: ['photos', 'gallery', 'pictures'], tint: '#F5A6C6' },
  { id: 'brief', name: 'Brief', category: 'work', aliases: ['notes', 'notepad', 'write'], tint: '#C7F36B', favorite: true },
  { id: 'circuit', name: 'Circuit', category: 'tools', aliases: ['settings', 'utility', 'system'], tint: '#9DEB9A' },
  { id: 'drift', name: 'Drift', category: 'media', aliases: ['music', 'audio', 'player', 'songs'], tint: '#B7A6F5', badge: 2, favorite: true },
  { id: 'field', name: 'Field', category: 'travel', aliases: ['weather', 'forecast', 'climate'], tint: '#8AD8D8' },
  { id: 'halo', name: 'Halo', category: 'communication', aliases: ['messages', 'sms', 'chat', 'text'], tint: '#83B7FF', badge: 3, favorite: true },
  { id: 'loom', name: 'Loom', category: 'tools', aliases: ['files', 'storage', 'documents'], tint: '#F5C66B' },
  { id: 'mesa', name: 'Mesa', category: 'work', aliases: ['calendar', 'schedule', 'events'], tint: '#FF8C86', favorite: true },
  { id: 'orbit', name: 'Orbit', category: 'travel', aliases: ['maps', 'navigation', 'directions'], tint: '#8AD8D8' },
  { id: 'pulse', name: 'Pulse', category: 'other', aliases: ['fitness', 'health', 'workout', 'steps'], tint: '#FF8C86' },
  { id: 'relay', name: 'Relay', category: 'communication', aliases: ['mail', 'email', 'inbox'], tint: '#B7A6F5', badge: 5 },
  { id: 'slate', name: 'Slate', category: 'work', aliases: ['tasks', 'todo', 'checklist'], tint: '#C7F36B', favorite: true },
  { id: 'solace', name: 'Solace', category: 'other', aliases: ['meditation', 'mindfulness', 'calm', 'sleep'], tint: '#A6C6F5' },
  { id: 'thread', name: 'Thread', category: 'communication', aliases: ['social', 'feed', 'posts'], tint: '#F5A6C6' },
  { id: 'vector', name: 'Vector', category: 'create', aliases: ['camera', 'photo', 'lens'], tint: '#F5C66B' },
  { id: 'folio', name: 'Folio', category: 'read', aliases: ['books', 'reader', 'articles', 'news'], tint: '#B7A6F5' },
  { id: 'kepler', name: 'Kepler', category: 'games', aliases: ['arcade', 'play', 'puzzle'], tint: '#F5A66B' },
  { id: 'north', name: 'North', category: 'travel', aliases: ['compass', 'trips', 'flights'], tint: '#8AD8D8' },
  { id: 'quill', name: 'Quill', category: 'create', aliases: ['draw', 'sketch', 'design'], tint: '#F5C66B' },
];

const now = Date.now();
const DAY = 86_400_000;

export function defaultApps(): AppItem[] {
  return SEEDS.map((s, i) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    aliases: s.aliases,
    iconTint: s.tint,
    isFavorite: !!s.favorite,
    isHidden: false,
    lastOpenedAt: now - ((i * 37) % 9) * DAY - (i % 5) * 3_600_000,
    order: i,
    demoBadge: s.badge,
  }));
}

export function defaultSettings(): StyroSettings {
  return {
    theme: 'system',
    accentIntensity: 'standard',
    density: 'balanced',
    homeLayout: 'focus',
    appListLayout: 'list',
    iconStyle: 'signal',
    iconSize: 48,
    showLabels: true,
    showWidgets: true,
    typeScale: 'standard',
    motionLevel: 'full',
    hapticsEnabled: true,
    formFactorPreview: 'auto',
    radius: 'soft',
    contrast: 'standard',
    surface: 'ink',
    lockModifications: false,
    showDock: true,
    indexRail: true,
    defaultDrawerMode: 'all',
    rememberDrawerPosition: true,
    badgeStyle: 'dot',
    appLaunchAnimation: 'lift',
    pageLooping: false,
    onboarded: false,
  };
}

export function defaultPages(): HomePage[] {
  return [
    {
      id: 'page-home',
      name: 'Home',
      isDefault: true,
      pinnedIds: ['halo', 'drift', 'mesa', 'slate', 'arc', 'brief'],
    },
  ];
}

export function defaultWidgets(): Widget[] {
  return [
    {
      id: 'widget-focus',
      kind: 'card',
      type: 'focus',
      title: 'Focus',
      status: 'ready',
      size: 'medium',
      pageId: 'page-home',
    },
  ];
}

export const DEFAULT_GESTURES: GestureMap = {
  'tap-empty': 'none',
  'double-tap-empty': 'lock-modifications',
  'swipe-up': 'open-appspace',
  'swipe-down': 'open-search',
  'swipe-left': 'none',
  'swipe-right': 'none',
  'two-finger-up': 'none',
  'two-finger-down': 'none',
  'pinch-in': 'none',
  'pinch-out': 'none',
  'long-press-empty': 'toggle-edit',
  'long-press-app': 'none',
};

export const GESTURE_LABELS: Record<keyof GestureMap, string> = {
  'tap-empty': 'Tap empty space',
  'double-tap-empty': 'Double tap empty space',
  'swipe-up': 'Swipe up',
  'swipe-down': 'Swipe down',
  'swipe-left': 'Swipe left',
  'swipe-right': 'Swipe right',
  'two-finger-up': 'Two-finger swipe up',
  'two-finger-down': 'two-finger swipe down',
  'pinch-in': 'Pinch in',
  'pinch-out': 'Pinch out',
  'long-press-empty': 'Long press empty space',
  'long-press-app': 'Long press app',
};

export const GESTURE_ACTION_LABELS: Record<string, string> = {
  none: 'No action',
  'open-appspace': 'Open App Space',
  'open-search': 'Open Search',
  'open-favorites': 'Open Favorites',
  'open-folder': 'Open first folder',
  'toggle-edit': 'Toggle Edit Mode',
  'toggle-theme': 'Toggle dark / light',
  'toggle-dock': 'Show / hide dock',
  'lock-modifications': 'Lock preview modifications',
  'open-customize': 'Open Customize',
  'open-native': 'Open Native Capabilities',
  'open-app': 'Open first favorite app',
};

export const WIDGET_CATALOG: { type: Widget['type']; title: string; blurb: string }[] = [
  { type: 'clock', title: 'Clock', blurb: 'Time and date glance' },
  { type: 'focus', title: 'Focus', blurb: 'Current focus session' },
  { type: 'today', title: 'Today', blurb: 'Day overview' },
  { type: 'weather', title: 'Weather Preview', blurb: 'Demo forecast card' },
  { type: 'battery', title: 'Battery Preview', blurb: 'Demo battery card' },
  { type: 'calendar', title: 'Calendar Preview', blurb: 'Demo agenda card' },
  { type: 'notes', title: 'Quick note', blurb: 'Capture a thought' },
  { type: 'media', title: 'Media Preview', blurb: 'Demo playback card' },
  { type: 'shortcuts', title: 'Shortcuts', blurb: 'Frequent actions' },
];

export function displayName(app: AppItem): string {
  return app.customName?.trim() || app.name;
}

let counter = 0;
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}
