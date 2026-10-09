import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useStyro } from '@/lib/store';
import type { GestureActionId, GestureId } from '@/lib/types';
import { GESTURE_ACTION_LABELS, GESTURE_LABELS, WIDGET_CATALOG } from '@/lib/demoApps';
import { scaled } from '@/lib/tokens';
import { validateBackup } from '@/lib/persistence';
import { ResponsiveShell } from '@/components/ResponsiveShell';
import { SectionHeader, SegmentedControl, SettingRow, Toggle } from '@/components/SettingRow';
import { Sheet } from '@/components/Sheet';
import { EmptyState, PermissionNotice } from '@/components/bits';
import { WidgetPicker } from '@/components/WidgetCard';

export default function Customize() {
  const styro = useStyro();
  const { theme, state, updateSettings } = styro;
  const router = useRouter();
  const s = state.settings;

  const [gestureSheet, setGestureSheet] = useState<GestureId | null>(null);
  const [stackSheet, setStackSheet] = useState<string | null>(null);
  const [backupSheet, setBackupSheet] = useState<'export' | 'import' | null>(null);

  const confirmReset = (title: string, message: string, run: () => void) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: run },
    ]);
  };

  return (
    <ResponsiveShell>
      <ScrollView
        contentContainerStyle={[styles.body, { paddingHorizontal: 18, paddingBottom: 48 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={() => router.back()} style={styles.back} hitSlop={8}>
            <Text style={{ color: theme.text, fontSize: 24 }}>‹</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text, fontSize: scaled(22, theme) }]}>Customize</Text>
        </View>
        <Text style={[styles.sub, { color: theme.textSecondary, fontSize: scaled(13.5, theme) }]}>
          Everything is free. Changes apply immediately and are saved on this device.
        </Text>

        {/* ---------- Appearance ---------- */}
        <SectionHeader title="Appearance" />
        <SettingRow label="Theme" description="Follow the system or pick a side." control={
          <SegmentedControl label="Theme" value={s.theme} onChange={(theme) => updateSettings({ theme })}
            options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }, { value: 'system', label: 'System' }]} />
        } />
        <SettingRow label="Surface" description="How layers are tinted." control={
          <SegmentedControl label="Surface" value={s.surface} onChange={(surface) => updateSettings({ surface })}
            options={[{ value: 'ink', label: 'Ink' }, { value: 'graphite', label: 'Graphite' }, { value: 'mineral', label: 'Mineral' }, { value: 'tint', label: 'Tint' }]} />
        } />
        <SettingRow label="Accent intensity" description="How loudly the lime signal speaks." control={
          <SegmentedControl label="Accent intensity" value={s.accentIntensity} onChange={(accentIntensity) => updateSettings({ accentIntensity })}
            options={[{ value: 'quiet', label: 'Quiet' }, { value: 'standard', label: 'Standard' }, { value: 'vivid', label: 'Vivid' }]} />
        } />
        <SettingRow label="Corner radius" control={
          <SegmentedControl label="Corner radius" value={s.radius} onChange={(radius) => updateSettings({ radius })}
            options={[{ value: 'sharp', label: 'Sharp' }, { value: 'soft', label: 'Soft' }, { value: 'round', label: 'Round' }]} />
        } />
        <SettingRow label="Text contrast" control={
          <SegmentedControl label="Text contrast" value={s.contrast} onChange={(contrast) => updateSettings({ contrast })}
            options={[{ value: 'standard', label: 'Standard' }, { value: 'high', label: 'High' }]} />
        } />
        <SettingRow label="Icon style" description="Original Styro marks, applied everywhere." control={
          <SegmentedControl label="Icon style" value={s.iconStyle} onChange={(iconStyle) => updateSettings({ iconStyle })}
            options={[
              { value: 'signal', label: 'Signal' }, { value: 'orbit', label: 'Orbit' }, { value: 'prism', label: 'Prism' },
              { value: 'mono', label: 'Mono' }, { value: 'outline', label: 'Outline' }, { value: 'mineral', label: 'Mineral' },
            ]} />
        } />
        <SettingRow
          label="Icon size"
          description={`${s.iconSize}px. Per-app overrides live in the app menu.`}
          control={
            <View style={styles.stepper}>
              <StepBtn label="Smaller icons" glyph="−" onPress={() => updateSettings({ iconSize: Math.max(40, s.iconSize - 4) })} />
              <StepBtn label="Larger icons" glyph="＋" onPress={() => updateSettings({ iconSize: Math.min(64, s.iconSize + 4) })} />
            </View>
          }
        />
        <SettingRow label="App labels" description="Show names under icons." control={<Toggle label="App labels" value={s.showLabels} onChange={(showLabels) => updateSettings({ showLabels })} />} />
        <SettingRow label="Type scale" description="Label and body text size." control={
          <SegmentedControl label="Type scale" value={s.typeScale} onChange={(typeScale) => updateSettings({ typeScale })}
            options={[{ value: 'standard', label: 'Standard' }, { value: 'large', label: 'Large' }, { value: 'xlarge', label: 'Extra large' }]} />
        } />
        <PermissionNotice text="Wallpaper reading needs native Android access. Styro ships with its own local backgrounds in this preview." />
        <SettingRow label="Reset appearance" onPress={() => confirmReset('Reset appearance?', 'Theme, surfaces, icons, and type return to Styro defaults. Favorites and folders are kept.', styro.resetAppearance)} />

        {/* ---------- Home surface ---------- */}
        <SectionHeader title="Home surface" />
        <SettingRow label="Home layout" description="Minimal stays quiet; Dashboard shows more." control={
          <SegmentedControl label="Home layout" value={s.homeLayout} onChange={(homeLayout) => updateSettings({ homeLayout })}
            options={[{ value: 'minimal', label: 'Minimal' }, { value: 'focus', label: 'Focus' }, { value: 'expanded', label: 'Expanded' }, { value: 'dashboard', label: 'Dashboard' }]} />
        } />
        <SettingRow label="Density" description="Spacing and grid density." control={
          <SegmentedControl label="Density" value={s.density} onChange={(density) => updateSettings({ density })}
            options={[{ value: 'calm', label: 'Calm' }, { value: 'balanced', label: 'Balanced' }, { value: 'dense', label: 'Dense' }]} />
        } />
        <SettingRow label="Widgets" description="Show widget cards on home." control={<Toggle label="Widgets" value={s.showWidgets} onChange={(showWidgets) => updateSettings({ showWidgets })} />} />
        <SettingRow label="Bottom dock" description="Quick actions within thumb reach." control={<Toggle label="Bottom dock" value={s.showDock} onChange={(showDock) => updateSettings({ showDock })} />} />
        <SettingRow label="Lock modifications" description="Blocks accidental home edits." control={<Toggle label="Lock modifications" value={s.lockModifications} onChange={(lockModifications) => updateSettings({ lockModifications })} />} />
        <SettingRow label="Page looping" description="Swipe past the last page back to the first." control={<Toggle label="Page looping" value={s.pageLooping} onChange={(pageLooping) => updateSettings({ pageLooping })} />} />
        <SettingRow label="Reset home layout" onPress={() => confirmReset('Reset home layout?', 'Pages and widgets return to the Styro default. Apps and folders are kept.', styro.resetLayout)} />

        {/* ---------- App Space ---------- */}
        <SectionHeader title="App Space" />
        <SettingRow label="Default view" control={
          <SegmentedControl label="Default view" value={s.defaultDrawerMode} onChange={(v) => { updateSettings({ defaultDrawerMode: v }); styro.setDrawerMode(v); }}
            options={[
              { value: 'all', label: 'All' }, { value: 'categories', label: 'Categories' },
              { value: 'recent', label: 'Recent' }, { value: 'favorites', label: 'Favorites' }, { value: 'custom', label: 'Custom' },
            ]} />
        } />
        <SettingRow label="App list layout" control={
          <SegmentedControl label="App list layout" value={s.appListLayout} onChange={(appListLayout) => updateSettings({ appListLayout })}
            options={[{ value: 'list', label: 'List' }, { value: 'compact', label: 'Compact' }, { value: 'grid', label: 'Grid' }]} />
        } />
        <SettingRow label="Alphabet index rail" description="Quick-jump letters on wide screens." control={<Toggle label="Alphabet index rail" value={s.indexRail} onChange={(indexRail) => updateSettings({ indexRail })} />} />
        <SettingRow label="Notification badges" description="Demo badges in preview; real badges need Android." control={
          <SegmentedControl label="Notification badges" value={s.badgeStyle} onChange={(badgeStyle) => updateSettings({ badgeStyle })}
            options={[{ value: 'dot', label: 'Dot' }, { value: 'count', label: 'Count' }, { value: 'off', label: 'Off' }]} />
        } />
        <CategoryEditor />
        <SettingRow label="Reset app organization" onPress={() => confirmReset('Reset organization?', 'Categories, app names, and hidden flags return to defaults. Folders are removed.', styro.resetOrganization)} />

        {/* ---------- Folders & widgets ---------- */}
        <SectionHeader title="Folders & widgets" />
        <WidgetManager onManageStack={setStackSheet} />
        <SettingRow
          label="New widget stack"
          description="One footprint, many cards. Swipe or use the arrows."
          onPress={() => styro.createStack(state.activePageId)}
        />

        {/* ---------- Gestures ---------- */}
        <SectionHeader title="Gestures & shortcuts" />
        <PermissionNotice text="Every gesture has a visible button or keyboard alternative. Nothing here is gesture-only." />
        {styro.gestureConflicts.length > 0 && (
          <View style={[styles.warn, { backgroundColor: theme.accentSoft, borderColor: theme.warning, borderRadius: theme.radiusSm }]}>
            <Text style={[styles.warnText, { color: theme.text, fontSize: scaled(13, theme) }]}>
              ⚠ {styro.gestureConflicts.length} gestures share an action. That's allowed — but check you meant it.
            </Text>
          </View>
        )}
        {(Object.keys(GESTURE_LABELS) as GestureId[]).map((g) => {
          const action = state.gestures[g];
          const conflicted = styro.gestureConflicts.includes(g);
          return (
            <SettingRow
              key={g}
              label={`${GESTURE_LABELS[g]}${conflicted ? ' ⚠' : ''}`}
              description={GESTURE_ACTION_LABELS[action]}
              onPress={() => setGestureSheet(g)}
            />
          );
        })}
        <SettingRow label="Reset gestures" onPress={() => confirmReset('Reset gestures?', 'Gesture mappings return to Styro defaults.', styro.resetGestures)} />

        {/* ---------- Motion & feedback ---------- */}
        <SectionHeader title="Motion & feedback" />
        <SettingRow label="Animation level" control={
          <SegmentedControl label="Animation level" value={s.motionLevel} onChange={(motionLevel) => updateSettings({ motionLevel })}
            options={[{ value: 'full', label: 'Full' }, { value: 'subtle', label: 'Subtle' }, { value: 'reduced', label: 'Reduced' }]} />
        } />
        <SettingRow label="App launch animation" control={
          <SegmentedControl label="App launch animation" value={s.appLaunchAnimation} onChange={(appLaunchAnimation) => updateSettings({ appLaunchAnimation })}
            options={[{ value: 'lift', label: 'Lift' }, { value: 'fade', label: 'Fade' }, { value: 'none', label: 'None' }]} />
        } />
        <SettingRow label="Haptics" description="Native only; silent in web preview." control={<Toggle label="Haptics" value={s.hapticsEnabled} onChange={(hapticsEnabled) => updateSettings({ hapticsEnabled })} />} />
        {s.motionLevel === 'reduced' && (
          <PermissionNotice text="Reduced motion is on: parallax and spring effects are removed, but selection and focus feedback stay visible." />
        )}

        {/* ---------- Composition preview ---------- */}
        <SectionHeader title="Composition preview" />
        <SettingRow label="Preview as" description="See this exact configuration on other form factors." control={
          <SegmentedControl label="Preview as" value={s.formFactorPreview} onChange={(formFactorPreview) => updateSettings({ formFactorPreview })}
            options={[
              { value: 'auto', label: 'Auto' }, { value: 'phone-portrait', label: 'Phone ↕' },
              { value: 'phone-landscape', label: 'Phone ↔' }, { value: 'tablet-portrait', label: 'Tablet ↕' },
              { value: 'tablet-landscape', label: 'Tablet ↔' },
            ]} />
        } />

        {/* ---------- Data & recovery ---------- */}
        <SectionHeader title="Data & recovery" />
        <SettingRow label="Export configuration" description="Local JSON. No account, no cloud." onPress={() => setBackupSheet('export')} />
        <SettingRow label="Import configuration" description="Validated, with undo." onPress={() => setBackupSheet('import')} />
        <SettingRow label="Undo last import" description="Restores the pre-import snapshot." onPress={async () => {
          const ok = await styro.undoImport();
          if (!ok) styro.announce('No import to undo.');
        }} />
        <SettingRow label="Reset everything" danger onPress={() => confirmReset('Reset everything?', 'All Styro settings, favorites, folders, widgets, and pages return to factory defaults. This cannot be undone.', styro.resetEverything)} />

        {/* ---------- Native ---------- */}
        <SectionHeader title="Android integration" />
        <SettingRow
          label="Native capabilities"
          description="What's real, what's simulated, what needs Android."
          onPress={() => router.push('/native-capabilities')}
        />
        <View style={{ height: 8 }} />
        <Text style={[styles.foot, { color: theme.textMuted, fontSize: scaled(12, theme) }]}>
          Styro 1.0 · Free forever · No clutter. No paywalls. No noise.
        </Text>
      </ScrollView>

      <GestureSheet gesture={gestureSheet} onClose={() => setGestureSheet(null)} />
      <StackSheet stackId={stackSheet} onClose={() => setStackSheet(null)} />
      <BackupSheet mode={backupSheet} onClose={() => setBackupSheet(null)} />
    </ResponsiveShell>
  );
}

function StepBtn({ label, glyph, onPress }: { label: string; glyph: string; onPress: () => void }) {
  const { theme } = useStyro();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.stepBtn, { backgroundColor: theme.surface, borderRadius: 10 }]}
      hitSlop={4}
    >
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>{glyph}</Text>
    </Pressable>
  );
}

function CategoryEditor() {
  const { theme, state, addCategory, renameCategory, deleteCategory, reorderCategory, setCategorySort, autoCategorize, announce } = useStyro();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderRadius: theme.radius, borderColor: theme.edge, marginTop: 10 }]}>
      <View style={styles.cardHead}>
        <Text style={[styles.cardTitle, { color: theme.text, fontSize: scaled(15, theme) }]}>Categories</Text>
        <Pressable accessibilityLabel="Add category" accessibilityRole="button" onPress={() => setAdding((a) => !a)} style={[styles.mini, { backgroundColor: theme.surface2 }]}>
          <Text style={{ color: theme.text, fontWeight: '700' }}>＋</Text>
        </Pressable>
      </View>
      {adding && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <TextInput
            accessibilityLabel="New category name"
            placeholder="Category name"
            placeholderTextColor={theme.textMuted}
            value={draft}
            onChangeText={setDraft}
            style={[styles.input, { flex: 1, color: theme.text, borderColor: theme.edge, fontSize: scaled(14, theme) }]}
          />
          <Pressable
            accessibilityLabel="Create category"
            accessibilityRole="button"
            onPress={() => { addCategory(draft); setDraft(''); setAdding(false); }}
            style={[styles.mini, { backgroundColor: theme.accent }]}
          >
            <Text style={{ color: theme.accentText, fontWeight: '800' }}>✓</Text>
          </Pressable>
        </View>
      )}
      {state.categories.map((c, i) => {
        const count = state.apps.filter((a) => a.category === c.id).length;
        return (
          <View key={c.id} style={[styles.catRow, { borderColor: theme.edge }]}>
            <View style={[styles.catDot, { backgroundColor: c.accent }]} />
            <View style={{ flex: 1 }}>
              {renaming === c.id ? (
                <TextInput
                  accessibilityLabel={`Rename ${c.name}`}
                  value={renameDraft}
                  onChangeText={setRenameDraft}
                  autoFocus
                  onSubmitEditing={() => { renameCategory(c.id, renameDraft); setRenaming(null); }}
                  style={[styles.input, { color: theme.text, borderColor: theme.accent, fontSize: scaled(14, theme), minHeight: 36 }]}
                />
              ) : (
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: scaled(14, theme) }}>{c.name}</Text>
              )}
              <Text style={{ color: theme.textMuted, fontSize: scaled(12, theme), marginTop: 2 }}>
                {count} apps · sort: {c.sort}
              </Text>
            </View>
            <Pressable accessibilityLabel={`Move ${c.name} up`} accessibilityRole="button" disabled={i === 0} onPress={() => reorderCategory(c.id, -1)} style={[styles.mini, { opacity: i === 0 ? 0.3 : 1 }]}>
              <Text style={{ color: theme.text }}>↑</Text>
            </Pressable>
            <Pressable accessibilityLabel={`Move ${c.name} down`} accessibilityRole="button" disabled={i === state.categories.length - 1} onPress={() => reorderCategory(c.id, 1)} style={[styles.mini, { opacity: i === state.categories.length - 1 ? 0.3 : 1 }]}>
              <Text style={{ color: theme.text }}>↓</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={`Cycle sort for ${c.name}`}
              accessibilityRole="button"
              onPress={() => {
                const next = c.sort === 'alpha' ? 'recent' : c.sort === 'recent' ? 'custom' : 'alpha';
                setCategorySort(c.id, next);
              }}
              style={styles.mini}
            >
              <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '700' }}>SORT</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={`Rename ${c.name}`}
              accessibilityRole="button"
              onPress={() => { setRenameDraft(c.name); setRenaming(c.id); }}
              style={styles.mini}
            >
              <Text style={{ color: theme.textSecondary }}>✎</Text>
            </Pressable>
            {c.id !== 'other' && (
              <Pressable
                accessibilityLabel={`Delete ${c.name}`}
                accessibilityRole="button"
                onPress={() => {
                  Alert.alert('Delete category?', `"${c.name}" apps will move to Other.`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(c.id, 'other') },
                  ]);
                }}
                style={styles.mini}
              >
                <Text style={{ color: theme.danger }}>🗑</Text>
              </Pressable>
            )}
          </View>
        );
      })}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Auto-categorize apps"
        onPress={() => {
          const { moved } = autoCategorize();
          announce(moved > 0 ? `Reviewed suggestions applied to ${moved} apps.` : 'Everything already looks well placed.');
        }}
        style={[styles.autoBtn, { backgroundColor: theme.accentSoft, borderRadius: theme.radiusSm, marginTop: 10 }]}
      >
        <Text style={{ color: theme.text, fontWeight: '700', fontSize: scaled(13.5, theme) }}>
          ✨ Auto-categorize (local, reviewable)
        </Text>
      </Pressable>
    </View>
  );
}

function WidgetManager({ onManageStack }: { onManageStack: (id: string) => void }) {
  const { theme, state, removeWidget, announce } = useStyro();
  const widgets = state.widgets.filter((w) => w.pageId === state.activePageId);
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderRadius: theme.radius, borderColor: theme.edge, marginTop: 10 }]}>
      <Text style={[styles.cardTitle, { color: theme.text, fontSize: scaled(15, theme), marginBottom: 8 }]}>
        Widgets on this page
      </Text>
      {widgets.length === 0 && (
        <Text style={{ color: theme.textSecondary, fontSize: scaled(13, theme) }}>
          No widgets yet. Add them from the home surface Edit mode.
        </Text>
      )}
      {widgets.map((w) => (
        <View key={w.id} style={[styles.catRow, { borderColor: theme.edge }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontWeight: '600', fontSize: scaled(14, theme) }}>
              {w.title}{w.kind === 'stack' ? ` · stack of ${w.cards?.length ?? 0}` : ''}
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: scaled(12, theme), marginTop: 2 }}>
              {w.kind === 'stack' ? `rotation ${w.rotateSeconds ? `every ${w.rotateSeconds}s` : 'off'}` : WIDGET_CATALOG.find((c) => c.type === w.type)?.blurb ?? ''}
            </Text>
          </View>
          {w.kind === 'stack' && (
            <Pressable accessibilityLabel={`Manage ${w.title} stack`} accessibilityRole="button" onPress={() => onManageStack(w.id)} style={styles.mini}>
              <Text style={{ color: theme.accent, fontWeight: '700' }}>Manage</Text>
            </Pressable>
          )}
          <Pressable accessibilityLabel={`Remove ${w.title}`} accessibilityRole="button" onPress={() => { removeWidget(w.id); announce(`${w.title} removed.`); }} style={styles.mini}>
            <Text style={{ color: theme.danger }}>✕</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function GestureSheet({ gesture, onClose }: { gesture: GestureId | null; onClose: () => void }) {
  const { theme, state, setGesture } = useStyro();
  const actions = Object.keys(GESTURE_ACTION_LABELS) as GestureActionId[];
  return (
    <Sheet visible={!!gesture} onClose={onClose} label={gesture ? `Action for ${GESTURE_LABELS[gesture]}` : 'Gesture action'}>
      <Text style={[styles.sheetTitle, { color: theme.text, fontSize: scaled(17, theme) }]}>
        {gesture ? GESTURE_LABELS[gesture] : ''}
      </Text>
      <ScrollView style={{ maxHeight: 420 }}>
        {actions.map((a) => {
          const selected = gesture && state.gestures[gesture] === a;
          return (
            <Pressable
              key={a}
              accessibilityRole="radio"
              accessibilityState={{ selected: !!selected }}
              accessibilityLabel={GESTURE_ACTION_LABELS[a]}
              onPress={() => { if (gesture) setGesture(gesture, a); onClose(); }}
              style={[
                styles.pickRow,
                { backgroundColor: selected ? theme.accentSoft : 'transparent', borderRadius: theme.radiusSm, borderWidth: 1, borderColor: selected ? theme.accent : 'transparent' },
              ]}
            >
              <Text style={{ color: theme.text, fontWeight: selected ? '700' : '500', fontSize: scaled(14.5, theme) }}>
                {GESTURE_ACTION_LABELS[a]}
              </Text>
              {selected && <Text style={{ color: theme.accent, fontWeight: '800' }}>✓</Text>}
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={[styles.hint, { color: theme.textMuted, fontSize: scaled(12, theme) }]}>
        Swipes on the home surface need room to travel — keep buttons as the primary path for essential actions.
      </Text>
    </Sheet>
  );
}

function StackSheet({ stackId, onClose }: { stackId: string | null; onClose: () => void }) {
  const { theme, state, addToStack, removeFromStack, setStackInterval, renameWidget } = useStyro();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const stack = state.widgets.find((w) => w.id === stackId);
  if (!stack || stack.kind !== 'stack') return <Sheet visible={false} onClose={onClose} label="Stack" />;
  const cards = stack.cards ?? [];
  return (
    <Sheet visible={!!stackId} onClose={onClose} label={`Manage ${stack.title} stack`}>
      <Text style={[styles.sheetTitle, { color: theme.text, fontSize: scaled(17, theme) }]}>{stack.title}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        <TextInput
          accessibilityLabel="Stack name"
          value={draft || stack.title}
          onChangeText={setDraft}
          placeholder="Stack name"
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { flex: 1, color: theme.text, borderColor: theme.edge, fontSize: scaled(14, theme) }]}
        />
        <Pressable
          accessibilityLabel="Save stack name"
          accessibilityRole="button"
          onPress={() => { if (draft.trim()) renameWidget(stack.id, draft.trim()); setDraft(''); }}
          style={[styles.mini, { backgroundColor: theme.accent }]}
        >
          <Text style={{ color: theme.accentText, fontWeight: '800' }}>✓</Text>
        </Pressable>
      </View>
      {cards.map((c, i) => (
        <View key={`${c.type}-${i}`} style={[styles.pickRow, { backgroundColor: theme.surface, borderRadius: theme.radiusSm }]}>
          <Text style={{ color: theme.text, fontWeight: '600', fontSize: scaled(14, theme), flex: 1 }}>{c.title}</Text>
          <Pressable accessibilityLabel={`Remove ${c.title} from stack`} accessibilityRole="button" onPress={() => removeFromStack(stack.id, i)} style={styles.mini}>
            <Text style={{ color: theme.danger }}>✕</Text>
          </Pressable>
        </View>
      ))}
      {adding ? (
        <View style={{ maxHeight: 260 }}>
          <ScrollView>
            <WidgetPicker onPick={(type) => { addToStack(stack.id, type); setAdding(false); }} />
          </ScrollView>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add card to stack"
          onPress={() => setAdding(true)}
          style={[styles.autoBtn, { backgroundColor: theme.accentSoft, borderRadius: theme.radiusSm, marginTop: 8 }]}
        >
          <Text style={{ color: theme.text, fontWeight: '700' }}>＋ Add card</Text>
        </Pressable>
      )}
      <Text style={[styles.hint, { color: theme.textSecondary, fontSize: scaled(13, theme), marginTop: 12 }]}>Auto-rotation</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
        {[0, 10, 30, 60].map((sec) => {
          const selected = (stack.rotateSeconds ?? 0) === sec;
          return (
            <Pressable
              key={sec}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={sec === 0 ? 'Rotation off' : `Rotate every ${sec} seconds`}
              onPress={() => setStackInterval(stack.id, sec)}
              style={[styles.segOpt, { backgroundColor: selected ? theme.accent : theme.surface, borderRadius: 8 }]}
            >
              <Text style={{ color: selected ? theme.accentText : theme.textSecondary, fontWeight: '700', fontSize: scaled(12.5, theme) }}>
                {sec === 0 ? 'Off' : `${sec}s`}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

function BackupSheet({ mode, onClose }: { mode: 'export' | 'import' | null; onClose: () => void }) {
  const styro = useStyro();
  const { theme } = styro;
  const [importText, setImportText] = useState('');
  const [review, setReview] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  const payload = mode === 'export' ? JSON.stringify(styro.exportBackup(), null, 2) : '';

  const doCopy = async () => {
    try {
      // web clipboard
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (navigator as any).clipboard?.writeText(payload);
      setCopied(true);
      styro.announce('Configuration copied to clipboard.');
    } catch {
      styro.announce('Copy failed. Select the text manually.');
    }
  };

  const doReview = () => {
    setReview(null);
    try {
      const parsed = JSON.parse(importText);
      const v = validateBackup(parsed);
      if (!v.ok) {
        styro.announce(`Import rejected: ${v.reason} Current configuration untouched.`);
        return;
      }
      const cur = styro.exportBackup();
      const changed: string[] = [];
      if (JSON.stringify(cur.settings) !== JSON.stringify(parsed.settings)) changed.push('Appearance & behavior settings');
      if (cur.apps.length !== parsed.apps.length) changed.push(`Apps (${cur.apps.length} → ${parsed.apps.length})`);
      if (cur.folders.length !== parsed.folders.length) changed.push(`Folders (${cur.folders.length} → ${parsed.folders.length})`);
      if (cur.widgets.length !== parsed.widgets.length) changed.push(`Widgets (${cur.widgets.length} → ${parsed.widgets.length})`);
      if (cur.pages.length !== parsed.pages.length) changed.push(`Home pages (${cur.pages.length} → ${parsed.pages.length})`);
      if (changed.length === 0) changed.push('Configuration values (same counts)');
      setReview(changed);
    } catch {
      styro.announce('Import rejected: not valid JSON. Current configuration untouched.');
    }
  };

  return (
    <Sheet visible={!!mode} onClose={() => { onClose(); setReview(null); setImportText(''); setCopied(false); }} label={mode === 'export' ? 'Export configuration' : 'Import configuration'}>
      {mode === 'export' && (
        <View>
          <Text style={[styles.sheetTitle, { color: theme.text, fontSize: scaled(17, theme) }]}>Export</Text>
          <Text style={[styles.hint, { color: theme.textSecondary, fontSize: scaled(13, theme), marginBottom: 10 }]}>
            Local JSON of settings, favorites, folders, pages, and widgets. No secrets, no contacts, no cloud.
          </Text>
          <ScrollView style={[styles.code, { backgroundColor: theme.surface, borderColor: theme.edge, maxHeight: 280 }]}>
            <Text selectable style={{ color: theme.textSecondary, fontSize: 11, fontFamily: 'monospace' }}>{payload}</Text>
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copy configuration JSON"
            onPress={doCopy}
            style={[styles.autoBtn, { backgroundColor: theme.accent, borderRadius: theme.radiusSm, marginTop: 12 }]}
          >
            <Text style={{ color: theme.accentText, fontWeight: '700' }}>{copied ? 'Copied ✓' : 'Copy JSON'}</Text>
          </Pressable>
        </View>
      )}
      {mode === 'import' && (
        <View>
          <Text style={[styles.sheetTitle, { color: theme.text, fontSize: scaled(17, theme) }]}>Import</Text>
          {!review ? (
            <>
              <TextInput
                accessibilityLabel="Paste backup JSON"
                placeholder='Paste a Styro backup JSON here…'
                placeholderTextColor={theme.textMuted}
                value={importText}
                onChangeText={setImportText}
                multiline
                style={[styles.codeInput, { color: theme.text, borderColor: theme.edge, backgroundColor: theme.surface, fontSize: 12 }]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Validate and review import"
                onPress={doReview}
                style={[styles.autoBtn, { backgroundColor: theme.accent, borderRadius: theme.radiusSm, marginTop: 12 }]}
              >
                <Text style={{ color: theme.accentText, fontWeight: '700' }}>Validate & review</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.hint, { color: theme.text, fontSize: scaled(14, theme), marginBottom: 8 }]}>
                This import will change:
              </Text>
              {review.map((r) => (
                <Text key={r} style={{ color: theme.textSecondary, fontSize: scaled(13.5, theme), marginBottom: 4 }}>• {r}</Text>
              ))}
              <Text style={[styles.hint, { color: theme.textMuted, fontSize: scaled(12.5, theme), marginVertical: 10 }]}>
                A snapshot of your current setup is kept, so you can undo afterwards.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancel import"
                  onPress={() => setReview(null)}
                  style={[styles.autoBtn, { flex: 1, backgroundColor: theme.surface, borderRadius: theme.radiusSm }]}
                >
                  <Text style={{ color: theme.text, fontWeight: '700' }}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Apply import"
                  onPress={() => {
                    const parsed = JSON.parse(importText);
                    styro.importBackup(parsed);
                    onClose();
                    setReview(null);
                    setImportText('');
                  }}
                  style={[styles.autoBtn, { flex: 1, backgroundColor: theme.accent, borderRadius: theme.radiusSm }]}
                >
                  <Text style={{ color: theme.accentText, fontWeight: '700' }}>Apply import</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '800' },
  sub: { marginTop: 6, lineHeight: 20 },
  stepper: { flexDirection: 'row', gap: 8 },
  stepBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1, padding: 14 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontWeight: '700' },
  mini: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, minHeight: 44 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, paddingVertical: 8 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  autoBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, minHeight: 48, paddingHorizontal: 14 },
  warn: { borderWidth: 1, padding: 12, marginTop: 10 },
  warnText: { lineHeight: 19 },
  sheetTitle: { fontWeight: '700', marginBottom: 12 },
  pickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, marginBottom: 6 },
  hint: { lineHeight: 18, marginTop: 8 },
  segOpt: { paddingHorizontal: 14, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  code: { borderWidth: 1, borderRadius: 10, padding: 10 },
  codeInput: { borderWidth: 1, borderRadius: 10, padding: 10, minHeight: 140, textAlignVertical: 'top' },
  foot: { textAlign: 'center', marginTop: 8, lineHeight: 17 },
});
