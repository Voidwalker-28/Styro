import { Dimensions } from 'react-native';
import type { FormFactorPreview } from './types';

export type Breakpoint = 'compact-phone' | 'large-phone' | 'small-tablet' | 'large-tablet';

export interface Viewport {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  landscape: boolean;
  isTablet: boolean;
}

export function classifyViewport(width: number, height: number): Viewport {
  const landscape = width > height;
  const min = Math.min(width, height);
  let breakpoint: Breakpoint;
  if (min < 480) breakpoint = 'compact-phone';
  else if (min < 700) breakpoint = 'large-phone';
  else if (min < 1000) breakpoint = 'small-tablet';
  else breakpoint = 'large-tablet';
  return { width, height, breakpoint, landscape, isTablet: min >= 700 };
}

export function effectiveViewport(
  preview: FormFactorPreview,
): { viewport: Viewport; framed: boolean; frameLabel?: string } {
  if (preview === 'auto') {
    const { width, height } = Dimensions.get('window');
    return { viewport: classifyViewport(width, height), framed: false };
  }
  const map: Record<Exclude<FormFactorPreview, 'auto'>, { w: number; h: number; label: string }> = {
    'phone-portrait': { w: 390, h: 844, label: 'Phone · Portrait' },
    'phone-landscape': { w: 844, h: 390, label: 'Phone · Landscape' },
    'tablet-portrait': { w: 820, h: 1180, label: 'Tablet · Portrait' },
    'tablet-landscape': { w: 1180, h: 820, label: 'Tablet · Landscape' },
  };
  const m = map[preview];
  return { viewport: classifyViewport(m.w, m.h), framed: true, frameLabel: m.label };
}

export function columnsFor(viewport: Viewport, density: 'calm' | 'balanced' | 'dense'): number {
  const base =
    viewport.breakpoint === 'large-tablet'
      ? 8
      : viewport.breakpoint === 'small-tablet'
        ? 6
        : viewport.breakpoint === 'large-phone'
          ? 5
          : 4;
  if (density === 'calm') return Math.max(3, base - 1);
  if (density === 'dense') return base + 1;
  return base;
}
