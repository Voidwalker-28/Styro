export interface InstalledApp {
  packageName: string;
  label: string;
  /** PNG icon, base64-encoded (no data: prefix). Absent on web. */
  iconBase64?: string | null;
}

export interface StyroLauncherModuleType {
  getInstalledApps(): Promise<InstalledApp[]>;
  launchApp(packageName: string): Promise<boolean>;
  openAppInfo(packageName: string): Promise<void>;
  requestUninstall(packageName: string): Promise<void>;
  isDefaultLauncher(): Promise<boolean>;
  requestDefaultLauncher(): Promise<void>;
}

export function isNativeAvailable(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require('./StyroLauncherModule').default;
    return typeof m?.getInstalledApps === 'function';
  } catch {
    return false;
  }
}
