/**
 * with-styro-launcher-native — injects the StyroLauncher native module
 * (plain React Native module, no autolinking dependency) into the Android
 * project during prebuild.
 *
 * - Copies StyroLauncherModule.kt + StyroLauncherPackage.kt into the app
 * - Registers StyroLauncherPackage() in MainApplication.kt
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PACKAGE_DIR = 'com/styro/launcher';
const FILES = ['StyroLauncherModule.kt', 'StyroLauncherPackage.kt'];

function copySources(projectRoot, platformRoot) {
  const srcDir = path.join(projectRoot, 'plugins', 'native');
  const destDir = path.join(
    platformRoot, 'app', 'src', 'main', 'java', ...PACKAGE_DIR.split('/')
  );
  fs.mkdirSync(destDir, { recursive: true });
  for (const f of FILES) {
    fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));
  }
}

function registerPackage(platformRoot) {
  // Find MainApplication.kt (package name may vary)
  const javaRoot = path.join(platformRoot, 'app', 'src', 'main', 'java');
  const candidates = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'MainApplication.kt') candidates.push(p);
    }
  };
  walk(javaRoot);
  if (candidates.length === 0) {
    throw new Error('[with-styro-launcher-native] MainApplication.kt not found');
  }
  const mainApp = candidates[0];
  let src = fs.readFileSync(mainApp, 'utf8');

  const importLine = 'import com.styro.launcher.StyroLauncherPackage';
  if (!src.includes(importLine)) {
    // Insert after the last import
    src = src.replace(
      /^(import .*\n)(?!\n*import )/m,
      (m) => m,
    );
    const lines = src.split('\n');
    let lastImport = -1;
    lines.forEach((l, i) => {
      if (l.startsWith('import ')) lastImport = i;
    });
    lines.splice(lastImport + 1, 0, importLine);
    src = lines.join('\n');
  }

  const addLine = 'add(StyroLauncherPackage())';
  if (!src.includes(addLine)) {
    src = src.replace(
      /(\/\/ Packages that cannot be autolinked yet can be added manually here, for example:\n\s*\/\/ add\(MyReactNativePackage\(\)\))/,
      `$1\n          ${addLine}`
    );
  }

  fs.writeFileSync(mainApp, src);
}

const withStyroLauncherNative = (config) =>
  withDangerousMod(config, [
    'android',
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;
      copySources(projectRoot, platformRoot);
      registerPackage(platformRoot);
      return config;
    },
  ]);

module.exports = withStyroLauncherNative;
