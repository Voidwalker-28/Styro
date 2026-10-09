import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useStyro } from '@/lib/store';
import type { Density, FormFactorPreview, HomeLayout, MotionLevel, ThemeMode } from '@/lib/types';
import { scaled } from '@/lib/tokens';
import { ResponsiveShell } from '@/components/ResponsiveShell';
import { StyroMark } from '@/components/StyroMark';
import { SegmentedControl } from '@/components/SettingRow';
import { SetHomeAppCard } from '@/components/SetHomeAppCard';

const STEPS = ['Theme', 'Spacing', 'Home layout', 'Motion', 'Preview'] as const;

export default function Onboarding() {
  const { theme, updateSettings, announce } = useStyro();
  const router = useRouter();
  const [step, setStep] = useState(0);

  const finish = (skipped: boolean) => {
    updateSettings({ onboarded: true });
    announce(skipped ? 'Setup skipped. Sensible defaults are in place.' : 'Welcome to Styro.');
    router.replace('/');
  };

  return (
    <ResponsiveShell>
      <ScrollView contentContainerStyle={[styles.body, { padding: 24 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.brand}>
          <StyroMark size={44} color={theme.accent} />
          <Text style={[styles.wordmark, { color: theme.text, fontSize: scaled(26, theme) }]}>Styro</Text>
        </View>
        <Text style={[styles.tagline, { color: theme.textSecondary, fontSize: scaled(15, theme) }]}>
          Your phone, arranged around you. Free forever — no accounts, no paywalls, no ads.
        </Text>

        <View style={[styles.dots, { marginVertical: 20 }]}>
          {STEPS.map((s, i) => (
            <View
              key={s}
              accessibilityLabel={`Step ${i + 1}: ${s}`}
              style={[
                styles.dot,
                { backgroundColor: i === step ? theme.accent : theme.surface2, width: i === step ? 24 : 8 },
              ]}
            />
          ))}
        </View>

        <Text style={[styles.stepTitle, { color: theme.text, fontSize: scaled(20, theme) }]}>
          {stepTitle(step)}
        </Text>
        <Text style={[styles.stepDesc, { color: theme.textSecondary, fontSize: scaled(14, theme) }]}>
          {stepDesc(step)}
        </Text>

        <View style={{ marginTop: 18 }}>
          <StepControl step={step} />
        </View>

        <View style={styles.nav}>
          {step > 0 ? (
            <NavBtn label="Back" onPress={() => setStep(step - 1)} />
          ) : (
            <NavBtn label="Skip setup" onPress={() => finish(true)} subtle />
          )}
          {step < STEPS.length - 1 ? (
            <NavBtn label="Continue" primary onPress={() => setStep(step + 1)} />
          ) : (
            <NavBtn label="Start using Styro" primary onPress={() => finish(false)} />
          )}
        </View>

        {step === STEPS.length - 1 && (
          <View style={{ marginTop: 4 }}>
            <SetHomeAppCard />
            <Text style={[styles.hint, { color: theme.textMuted, fontSize: scaled(12.5, theme) }]}>
              Styro keeps the essentials close and the rest easy to find. Every choice here can be changed later in
              Customize.
            </Text>
          </View>
        )}
      </ScrollView>
    </ResponsiveShell>
  );
}

function stepTitle(step: number): string {
  return ['Choose your theme', 'Choose your spacing', 'Choose your home layout', 'Choose your motion', 'Preview your composition'][step];
}

function stepDesc(step: number): string {
  return [
    'Dark, light, or follow the system. Lime stays as the quiet signal color either way.',
    'Calm gives everything room to breathe. Dense fits more on screen.',
    'Minimal is the quietest start. Focus adds a glance card. Expanded and Dashboard show more.',
    'Full motion feels alive. Reduced keeps every interaction instant and still.',
    'See how the same Styro adapts to phones and tablets, in either orientation.',
  ][step];
}

function StepControl({ step }: { step: number }) {
  const { state, updateSettings } = useStyro();
  const s = state.settings;
  switch (step) {
    case 0:
      return (
        <SegmentedControl<ThemeMode>
          label="Theme"
          value={s.theme}
          onChange={(theme) => updateSettings({ theme })}
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
            { value: 'system', label: 'System' },
          ]}
        />
      );
    case 1:
      return (
        <SegmentedControl<Density>
          label="Spacing"
          value={s.density}
          onChange={(density) => updateSettings({ density })}
          options={[
            { value: 'calm', label: 'Calm' },
            { value: 'balanced', label: 'Balanced' },
            { value: 'dense', label: 'Dense' },
          ]}
        />
      );
    case 2:
      return (
        <SegmentedControl<HomeLayout>
          label="Home layout"
          value={s.homeLayout}
          onChange={(homeLayout) => updateSettings({ homeLayout })}
          options={[
            { value: 'minimal', label: 'Minimal' },
            { value: 'focus', label: 'Focus' },
            { value: 'expanded', label: 'Expanded' },
            { value: 'dashboard', label: 'Dashboard' },
          ]}
        />
      );
    case 3:
      return (
        <SegmentedControl<MotionLevel>
          label="Motion"
          value={s.motionLevel}
          onChange={(motionLevel) => updateSettings({ motionLevel })}
          options={[
            { value: 'full', label: 'Full' },
            { value: 'subtle', label: 'Subtle' },
            { value: 'reduced', label: 'Reduced' },
          ]}
        />
      );
    default:
      return (
        <SegmentedControl<FormFactorPreview>
          label="Composition preview"
          value={s.formFactorPreview}
          onChange={(formFactorPreview) => updateSettings({ formFactorPreview })}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'phone-portrait', label: 'Phone' },
            { value: 'tablet-landscape', label: 'Tablet' },
          ]}
        />
      );
  }
}

function NavBtn({
  label,
  onPress,
  primary,
  subtle,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  subtle?: boolean;
}) {
  const { theme } = useStyro();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.navBtn,
        {
          backgroundColor: primary ? theme.accent : 'transparent',
          borderWidth: primary ? 0 : 1,
          borderColor: theme.edge,
          borderRadius: theme.radiusSm,
          minHeight: 48,
          paddingHorizontal: 20,
          opacity: subtle ? 0.8 : 1,
        },
      ]}
    >
      <Text
        style={{
          color: primary ? theme.accentText : theme.text,
          fontWeight: '700',
          fontSize: scaled(15, theme),
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, justifyContent: 'center', maxWidth: 560, width: '100%', alignSelf: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wordmark: { fontWeight: '800', letterSpacing: 0.5 },
  tagline: { marginTop: 14, lineHeight: 22 },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { height: 8, borderRadius: 4 },
  stepTitle: { fontWeight: '700' },
  stepDesc: { marginTop: 8, lineHeight: 21 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32, gap: 12 },
  navBtn: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  hint: { marginTop: 20, lineHeight: 18, textAlign: 'center' },
});
