/**
 * launcher.ts — the single entry point for real Android launcher capabilities.
 *
 * On Android this talks to the native StyroLauncher module via the React
 * Native bridge. Everywhere else (or if the module is missing) it reports
 * itself unavailable so the UI shows "Needs Android" instead of crashing
 * or faking a system action.
 */
import { NativeModules, Platform } from 'react-native';
import type { InstalledApp } from 'styro-launcher';

export type { InstalledApp };

interface NativeBridge {
  getInstalledApps(): Promise<InstalledApp[]>;
  launchApp(packageName: string): Promise<boolean>;
  openAppInfo(packageName: string): Promise<void>;
  requestUninstall(packageName: string): Promise<void>;
  isDefaultLauncher(): Promise<boolean>;
  requestDefaultLauncher(): Promise<void>;
}

function getBridge(): NativeBridge | null {
  if (Platform.OS !== 'android') return null;
  const mod = (NativeModules as Record<string, unknown>).StyroLauncher as
    | NativeBridge
    | undefined;
  return mod && typeof mod.getInstalledApps === 'function' ? mod : null;
}

/** True only when the native launcher bridge is actually present. */
export function isLauncherNative(): boolean {
  return getBridge() !== null;
}

export async function getInstalledApps(): Promise<InstalledApp[]> {
  const mod = getBridge();
  if (!mod) throw new Error('Needs Android');
  return mod.getInstalledApps();
}

/** Returns true on success; throws when the app can't be opened. */
export async function launchApp(packageName: string): Promise<boolean> {
  const mod = getBridge();
  if (!mod) throw new Error('Needs Android');
  return mod.launchApp(packageName);
}

export async function openAppInfo(packageName: string): Promise<void> {
  const mod = getBridge();
  if (!mod) throw new Error('Needs Android');
  return mod.openAppInfo(packageName);
}

export async function requestUninstall(packageName: string): Promise<void> {
  const mod = getBridge();
  if (!mod) throw new Error('Needs Android');
  return mod.requestUninstall(packageName);
}

export async function isDefaultLauncher(): Promise<boolean> {
  const mod = getBridge();
  if (!mod) throw new Error('Needs Android');
  return mod.isDefaultLauncher();
}

export async function requestDefaultLauncher(): Promise<void> {
  const mod = getBridge();
  if (!mod) throw new Error('Needs Android');
  return mod.requestDefaultLauncher();
}
