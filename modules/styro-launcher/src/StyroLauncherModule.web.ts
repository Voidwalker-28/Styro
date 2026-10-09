/**
 * Web / preview fallback. Never fakes success — every native-only call
 * throws a clearly-labeled error so the UI can say "Needs Android".
 */
export class UnavailableError extends Error {
  constructor() {
    super('StyroLauncher is not available on this platform. Needs Android.');
    this.name = 'UnavailableError';
  }
}

export default {
  getInstalledApps(): never {
    throw new UnavailableError();
  },
  launchApp(): never {
    throw new UnavailableError();
  },
  openAppInfo(): never {
    throw new UnavailableError();
  },
  requestUninstall(): never {
    throw new UnavailableError();
  },
  isDefaultLauncher(): never {
    throw new UnavailableError();
  },
  requestDefaultLauncher(): never {
    throw new UnavailableError();
  },
};
