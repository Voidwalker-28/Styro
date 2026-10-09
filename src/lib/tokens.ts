import type { StyroSettings } from './types';

export const TOKENS = {
  ink950: '#080B10',
  ink900: '#0D1219',
  graphite800: '#151C25',
  graphite700: '#202A35',
  textPrimaryDark: '#F3F7F4',
  textSecondaryDark: '#AAB8B7',
  mineral050: '#F5F7F2',
  mineral100: '#E9EEE8',
  textPrimaryLight: '#111817',
  textSecondaryLight: '#586663',
  lime: '#C7F36B',
  limeStrong: '#A8E83E',
  infoBlue: '#83B7FF',
  warningAmber: '#F5C66B',
  dangerCoral: '#FF8C86',
  successGreen: '#9DEB9A',
} as const;

export interface Theme {
  dark: boolean;
  bg: string;
  bgElevated: string;
  surface: string;
  surface2: string;
  edge: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  info: string;
  warning: string;
  danger: string;
  success: string;
  radius: number;
  radiusSm: number;
  iconSize: number;
  typeScale: number;
  densityPad: number;
  rowHeight: number;
}

const ACCENT_BY_INTENSITY: Record<StyroSettings['accentIntensity'], { accent: string; soft: string }> = {
  quiet: { accent: '#9DBE5A', soft: 'rgba(199, 243, 107, 0.10)' },
  standard: { accent: TOKENS.lime, soft: 'rgba(199, 243, 107, 0.14)' },
  vivid: { accent: TOKENS.limeStrong, soft: 'rgba(168, 232, 62, 0.20)' },
};

const RADIUS: Record<StyroSettings['radius'], number> = {
  sharp: 4,
  soft: 14,
  round: 24,
};

const TYPE_SCALE: Record<StyroSettings['typeScale'], number> = {
  standard: 1,
  large: 1.15,
  xlarge: 1.3,
};

const DENSITY_PAD: Record<StyroSettings['density'], number> = {
  calm: 18,
  balanced: 12,
  dense: 7,
};

export function buildTheme(settings: StyroSettings, systemDark: boolean): Theme {
  const dark = settings.theme === 'system' ? systemDark : settings.theme === 'dark';
  const accent = ACCENT_BY_INTENSITY[settings.accentIntensity];
  const radius = RADIUS[settings.radius];
  const typeScale = TYPE_SCALE[settings.typeScale];
  const densityPad = DENSITY_PAD[settings.density];
  const highContrast = settings.contrast === 'high';

  const surfacePick = (): { surface: string; surface2: string } => {
    if (dark) {
      switch (settings.surface) {
        case 'graphite':
          return { surface: TOKENS.graphite800, surface2: TOKENS.graphite700 };
        case 'mineral':
        case 'tint':
          return { surface: '#101820', surface2: '#1A2430' };
        case 'ink':
        default:
          return { surface: TOKENS.ink900, surface2: TOKENS.graphite800 };
      }
    }
    switch (settings.surface) {
      case 'graphite':
        return { surface: '#E4E9E2', surface2: '#D8DFD6' };
      case 'tint':
        return { surface: '#EFF3E4', surface2: '#E2EAD2' };
      case 'ink':
        return { surface: '#EDEFF0', surface2: '#E0E5E4' };
      case 'mineral':
      default:
        return { surface: TOKENS.mineral100, surface2: '#DDE4DA' };
    }
  };
  const { surface, surface2 } = surfacePick();

  return {
    dark,
    bg: dark ? TOKENS.ink950 : TOKENS.mineral050,
    bgElevated: dark ? TOKENS.ink900 : '#FFFFFF',
    surface,
    surface2,
    edge: dark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,23,0.10)',
    text: dark ? TOKENS.textPrimaryDark : TOKENS.textPrimaryLight,
    textSecondary: dark
      ? highContrast
        ? '#D6E0DD'
        : TOKENS.textSecondaryDark
      : highContrast
        ? '#2A3634'
        : TOKENS.textSecondaryLight,
    textMuted: dark ? '#6E7B79' : '#8A978F',
    accent: accent.accent,
    accentSoft: accent.soft,
    accentText: dark ? '#0D1219' : '#111817',
    info: TOKENS.infoBlue,
    warning: TOKENS.warningAmber,
    danger: TOKENS.dangerCoral,
    success: TOKENS.successGreen,
    radius,
    radiusSm: Math.max(4, radius - 6),
    iconSize: settings.iconSize,
    typeScale,
    densityPad,
    rowHeight: settings.density === 'dense' ? 56 : settings.density === 'balanced' ? 64 : 74,
  };
}

export const TIMING = {
  tap: 140,
  small: 190,
  drawer: 280,
  preview: 160,
};

export const FONT = {
  display: 34,
  title: 22,
  headline: 17,
  body: 15,
  caption: 12,
  micro: 10,
};

export function scaled(size: number, theme: Theme): number {
  return Math.round(size * theme.typeScale);
}
