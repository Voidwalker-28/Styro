export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentIntensity = 'quiet' | 'standard' | 'vivid';
export type Density = 'calm' | 'balanced' | 'dense';
export type HomeLayout = 'minimal' | 'focus' | 'expanded' | 'dashboard';
export type AppListLayout = 'list' | 'compact' | 'grid';
export type IconStyleId = 'signal' | 'orbit' | 'prism' | 'mono' | 'outline' | 'mineral';
export type TypeScale = 'standard' | 'large' | 'xlarge';
export type MotionLevel = 'full' | 'subtle' | 'reduced';
export type CornerRadius = 'sharp' | 'soft' | 'round';
export type Contrast = 'standard' | 'high';
export type SurfaceTreatment = 'ink' | 'graphite' | 'mineral' | 'tint';
export type FormFactorPreview =
  | 'auto'
  | 'phone-portrait'
  | 'phone-landscape'
  | 'tablet-portrait'
  | 'tablet-landscape';

export type WidgetStatus = 'ready' | 'loading' | 'unavailable' | 'permission-denied' | 'error';
export type WidgetSize = 'small' | 'medium' | 'large';
export type WidgetType =
  | 'clock'
  | 'focus'
  | 'today'
  | 'weather'
  | 'battery'
  | 'calendar'
  | 'notes'
  | 'media'
  | 'shortcuts';

export interface StyroSettings {
  theme: ThemeMode;
  accentIntensity: AccentIntensity;
  density: Density;
  homeLayout: HomeLayout;
  appListLayout: AppListLayout;
  iconStyle: IconStyleId;
  iconSize: number; // 40 - 64
  showLabels: boolean;
  showWidgets: boolean;
  typeScale: TypeScale;
  motionLevel: MotionLevel;
  hapticsEnabled: boolean;
  formFactorPreview: FormFactorPreview;
  radius: CornerRadius;
  contrast: Contrast;
  surface: SurfaceTreatment;
  lockModifications: boolean;
  showDock: boolean;
  indexRail: boolean;
  defaultDrawerMode: DrawerMode;
  rememberDrawerPosition: boolean;
  badgeStyle: 'dot' | 'count' | 'off';
  appLaunchAnimation: 'lift' | 'fade' | 'none';
  pageLooping: boolean;
  onboarded: boolean;
}

export type DrawerMode = 'all' | 'categories' | 'recent' | 'favorites' | 'custom' | 'hidden';
export type DrawerSort = 'alpha' | 'category' | 'recent' | 'custom';

export interface AppItem {
  id: string;
  name: string;
  customName?: string;
  category: string; // category id
  aliases: string[];
  iconStyle?: IconStyleId;
  iconTint?: string;
  isFavorite: boolean;
  isHidden: boolean;
  folderId?: string;
  lastOpenedAt: number;
  order: number;
  demoBadge?: number;
  /** Real Android package name. Absent for demo apps in preview. */
  packageName?: string;
  /** Real app icon as base64 PNG (no data: prefix). Absent for demo apps. */
  iconBase64?: string | null;
}

export interface Folder {
  id: string;
  name: string;
  appIds: string[];
  colorToken: string;
  style: 'popup' | 'panel' | 'full';
}

export interface WidgetCardDef {
  type: WidgetType;
  title: string;
}

export interface Widget {
  id: string;
  kind: 'card' | 'stack';
  type: WidgetType; // for card
  title: string;
  status: WidgetStatus;
  size: WidgetSize;
  pageId: string;
  cards?: WidgetCardDef[]; // for stack
  activeIndex?: number;
  rotateSeconds?: number; // 0 = off
}

export interface HomePage {
  id: string;
  name: string;
  isDefault: boolean;
  pinnedIds: string[]; // ordered favorite app ids on this page
}

export interface Category {
  id: string;
  name: string;
  accent: string;
  sort: DrawerSort;
}

export type GestureId =
  | 'tap-empty'
  | 'double-tap-empty'
  | 'swipe-up'
  | 'swipe-down'
  | 'swipe-left'
  | 'swipe-right'
  | 'two-finger-up'
  | 'two-finger-down'
  | 'pinch-in'
  | 'pinch-out'
  | 'long-press-empty'
  | 'long-press-app';

export type GestureActionId =
  | 'none'
  | 'open-appspace'
  | 'open-search'
  | 'open-favorites'
  | 'open-folder'
  | 'toggle-edit'
  | 'toggle-theme'
  | 'toggle-dock'
  | 'lock-modifications'
  | 'open-customize'
  | 'open-native'
  | 'open-app';

export type GestureMap = Record<GestureId, GestureActionId>;

export interface StyroState {
  settings: StyroSettings;
  apps: AppItem[];
  folders: Folder[];
  widgets: Widget[];
  pages: HomePage[];
  activePageId: string;
  categories: Category[];
  gestures: GestureMap;
  drawerMode: DrawerMode;
  drawerCategory: string; // 'all' or category id
  schemaVersion: number;
}

export interface BackupPayload {
  schemaVersion: number;
  exportedAt: string;
  settings: StyroSettings;
  apps: AppItem[];
  folders: Folder[];
  widgets: Widget[];
  pages: HomePage[];
  activePageId: string;
  categories: Category[];
  gestures: GestureMap;
}
