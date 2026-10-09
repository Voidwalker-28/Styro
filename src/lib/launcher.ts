/**
 * launcher.ts — the single entry point for real Android launcher capabilities.
 *
 * On Android this talks to the native StyroLauncher module. Everywhere else
 * it reports itself unavailable so the UI can show "Needs Android" instead of
 * faking a system action.
 */
import { Platform } from 'react-native';
import type {
  InstalledApp,
  StyroLauncherModuleType,
} from 'styro-launcher';

export type { InstalledApp };

let nativeModule: StyroLauncherModuleType | null = null;
let availabilityChecked = false;

function getNative(): StyroLauncherModuleType | null {
  if (!availabilityChecked) {
    availabilityChecked = true;
    if (Platform.OS === 'android') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require('styro-launcher/src/StyroLauncherModule').default;
        if (mod && typeof mod.getInstalledApps === 'function') {
          nativeModule = mod as StyroLauncherModuleType;
        }
      } catch {
        nativeModule = null;
      }
    }
  }
  return nativeModule;
}

/** True only when the native launcher bridge is actually present. */
export function isLauncherNative(): boolean {
  return getNative() !== null;
}

export async function getInstalledApps(): Promise<InstalledApp[]> {
  const mod = getNative();
  if (!mod) throw new Error('Needs Android');
  return mod.getInstalledApps();
}

/** Returns true on success; throws when the app can't be opened. */
export async function launchApp(packageName: string): Promise<boolean> {
  const mod = getNative();
  if (!mod) throw new Error('Needs Android');
  return mod.launchApp(packageName);
}

export async function openAppInfo(packageName: string): Promise<void> {
  const mod = getNative();
  if (!mod) throw new Error('Needs Android');
  return mod.openAppInfo(packageName);
}

export async function requestUninstall(packageName: string): Promise<void> {
  const mod = getNative();
  if (!mod) throw new Error('Needs Android');
  return mod.requestUninstall(packageName);
}

export async function isDefaultLauncher(): Promise<boolean> {
  const mod = getNative();
  if (!mod) throw new Error('Needs Android');
  return mod.isDefaultLauncher();
}

export async function requestDefaultLauncher(): Promise<void> {
  const mod = getNative();
  if (!mod) throw new Error('Needs Android');
  return mod.requestDefaultLauncher();
}
