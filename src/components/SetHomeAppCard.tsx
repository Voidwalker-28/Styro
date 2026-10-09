import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useStyro } from '@/lib/store';
import { scaled } from '@/lib/tokens';
import {
  isLauncherNative,
  isDefaultLauncher,
  requestDefaultLauncher,
} from '@/lib/launcher';

type HomeState = 'checking' | 'not-default' | 'default' | 'unavailable';

const COPY: Record<Exclude<HomeState, 'checking'>, { title: string; body: string; button: string | null }> = {
  'not-default': {
    title: 'Make Styro your home app',
    body: 'The Home button will open Styro, and Android will offer it as your default launcher. You can switch back any time in system Settings → Default apps.',
    button: 'Set as home app',
  },
  default: {
    title: 'Styro is your home app',
    body: 'The Home button opens Styro. To switch back, open system Settings → Default apps → Home app.',
    button: null,
  },
  unavailable: {
    title: 'Set as home app',
    body: 'Needs Android — this preview can\u2019t change the system home app.',
    button: null,
  },
};

/**
 * "Set Styro as your home app" card. Explains before asking, never
 * auto-prompts — the system dialog only opens from an explicit tap.
 */
export function SetHomeAppCard() {
  const { theme } = useStyro();
  const [state, setState] = useState<HomeState>('checking');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!isLauncherNative()) {
      setState('unavailable');
      return;
    }
    try {
      setState((await isDefaultLauncher()) ? 'default' : 'not-default');
    } catch {
      setState('unavailable');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onPress = useCallback(async () => {
    setBusy(true);
    try {
      await requestDefaultLauncher();
    } catch {
      // The user may have dismissed the system dialog; state refreshes on return.
    } finally {
      setBusy(false);
      // Re-check after a beat — the system dialog resolves asynchronously.
      setTimeout(refresh, 1200);
    }
  }, [refresh]);

  if (state === 'checking') {
    return (
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.edge }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const copy = COPY[state];
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.edge }]}>
      <Text style={[styles.title, { color: theme.text, fontSize: scaled(16, theme) }]}>{copy.title}</Text>
      <Text style={[styles.body, { color: theme.textSecondary, fontSize: scaled(13, theme) }]}>{copy.body}</Text>
      {state === 'default' && (
        <View style={[styles.pill, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.pillText, { color: theme.success, fontSize: scaled(12, theme) }]}>Default home app</Text>
        </View>
      )}
      {copy.button && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.button}
          onPress={onPress}
          disabled={busy}
          style={[styles.button, { backgroundColor: theme.accent, opacity: busy ? 0.6 : 1 }]}
        >
          {busy ? (
            <ActivityIndicator color={theme.accentText} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.accentText, fontSize: scaled(14, theme) }]}>
              {copy.button}
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: { fontWeight: '700', marginBottom: 6 },
  body: { lineHeight: 19, marginBottom: 12 },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: { fontWeight: '700' },
  button: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonText: { fontWeight: '700' },
});
