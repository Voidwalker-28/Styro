/**
 * with-styro-launcher — Expo config plugin that turns Styro into a real
 * Android home app (default launcher).
 *
 * - Adds the HOME intent filter to MainActivity so Android offers Styro
 *   as a home app, and forces launchMode="singleTask".
 * - Adds a <queries> block for MAIN + LAUNCHER so the app list can be
 *   discovered without QUERY_ALL_PACKAGES.
 * - Removes permissions the product does not use.
 */
const {
  withAndroidManifest,
  AndroidConfig,
} = require('@expo/config-plugins');

const UNUSED_PERMISSIONS = [
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
];

function ensureHomeIntentFilter(mainActivity) {
  const filters = mainActivity['intent-filter'] || [];
  const hasHome = filters.some((f) => {
    const actions = (f.action || []).map((a) => a.$['android:name']);
    const categories = (f.category || []).map((c) => c.$['android:name']);
    return (
      actions.includes('android.intent.action.MAIN') &&
      categories.includes('android.intent.category.HOME')
    );
  });
  if (!hasHome) {
    filters.push({
      action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
      category: [
        { $: { 'android:name': 'android.intent.category.HOME' } },
        { $: { 'android:name': 'android.intent.category.DEFAULT' } },
      ],
    });
  }
  mainActivity['intent-filter'] = filters;
  // Home button must return to the existing task, never stack a new one.
  mainActivity.$['android:launchMode'] = 'singleTask';
}

function ensureLauncherQueries(manifest) {
  const manifestNode = manifest.manifest || manifest;
  let queries = manifestNode.queries;
  if (!queries) {
    queries = [{}];
    manifestNode.queries = queries;
  }
  const q = queries[0];
  const intents = q.intent || [];
  const hasLauncherQuery = intents.some((i) => {
    const actions = (i.action || []).map((a) => a.$['android:name']);
    const categories = (i.category || []).map((c) => c.$['android:name']);
    return (
      actions.includes('android.intent.action.MAIN') &&
      categories.includes('android.intent.category.LAUNCHER')
    );
  });
  if (!hasLauncherQuery) {
    intents.push({
      action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
      category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
    });
  }
  q.intent = intents;
}

function removeUnusedPermissions(manifest) {
  const manifestNode = manifest.manifest || manifest;
  const perms = manifestNode['uses-permission'] || [];
  manifestNode['uses-permission'] = perms.filter(
    (p) => !UNUSED_PERMISSIONS.includes(p.$['android:name'])
  );
}

const withStyroLauncher = (config) =>
  withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(app);

    ensureHomeIntentFilter(mainActivity);
    ensureLauncherQueries(manifest);
    removeUnusedPermissions(manifest);

    return config;
  });

module.exports = withStyroLauncher;
