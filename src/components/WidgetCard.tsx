import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStyro } from '@/lib/store';
import type { Widget } from '@/lib/types';
import { scaled } from '@/lib/tokens';
import { WIDGET_CATALOG } from '@/lib/demoApps';

function useClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function CardShell({
  title,
  previewLabel,
  children,
  onRemove,
  editMode,
  minHeight,
}: {
  title: string;
  previewLabel?: string;
  children: React.ReactNode;
  onRemove?: () => void;
  editMode?: boolean;
  minHeight?: number;
}) {
  const { theme } = useStyro();
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${title} widget`}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderRadius: theme.radius,
          borderWidth: 1,
          borderColor: theme.edge,
          minHeight: minHeight ?? 120,
          padding: 16,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textSecondary, fontSize: scaled(11.5, theme) }]}>
          {title.toUpperCase()}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {previewLabel ? (
            <View style={[styles.tag, { backgroundColor: theme.surface2, borderRadius: 6 }]}>
              <Text style={[styles.tagText, { color: theme.textMuted, fontSize: scaled(10, theme) }]}>{previewLabel}</Text>
            </View>
          ) : null}
          {editMode && onRemove ? (
            <Pressable
              accessibilityLabel={`Remove ${title} widget`}
              accessibilityRole="button"
              onPress={onRemove}
              style={[styles.remove, { backgroundColor: theme.danger }]}
              hitSlop={8}
            >
              <Text style={[styles.removeGlyph, { color: '#0D1219' }]}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={{ marginTop: 10, flex: 1 }}>{children}</View>
    </View>
  );
}

function CardBody({ type }: { type: Widget['type'] }) {
  const { theme } = useStyro();
  const now = useClock();
  const [note, setNote] = useState('');

  switch (type) {
    case 'clock': {
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const date = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
      return (
        <View>
          <Text accessibilityLabel={`Current time ${time}`} style={[styles.big, { color: theme.text, fontSize: scaled(30, theme) }]}>
            {time}
          </Text>
          <Text style={[styles.body, { color: theme.textSecondary, fontSize: scaled(13, theme) }]}>{date}</Text>
        </View>
      );
    }
    case 'focus':
      return (
        <View>
          <Text style={[styles.big, { color: theme.text, fontSize: scaled(20, theme) }]}>Deep work · 25:00</Text>
          <Text style={[styles.body, { color: theme.textSecondary, fontSize: scaled(13, theme) }]}>
            One thing at a time. Notifications stay quiet in preview.
          </Text>
          <View style={[styles.bar, { backgroundColor: theme.surface2, borderRadius: 4 }]}>
            <View style={[styles.barFill, { width: '35%', backgroundColor: theme.accent, borderRadius: 4 }]} />
          </View>
        </View>
      );
    case 'today':
      return (
        <View>
          <Text style={[styles.body, { color: theme.text, fontSize: scaled(14, theme) }]}>3 items on your demo agenda</Text>
          {['09:30  Design review', '13:00  Lunch with Sam', '17:45  Evening walk'].map((t) => (
            <Text key={t} style={[styles.body, { color: theme.textSecondary, fontSize: scaled(13, theme), marginTop: 4 }]}>
              • {t}
            </Text>
          ))}
        </View>
      );
    case 'weather':
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: scaled(34, theme) }}>⛅</Text>
          <View>
            <Text style={[styles.big, { color: theme.text, fontSize: scaled(24, theme) }]}>24°</Text>
            <Text style={[styles.body, { color: theme.textSecondary, fontSize: scaled(13, theme) }]}>Partly cloudy · demo data</Text>
          </View>
        </View>
      );
    case 'battery':
      return (
        <View>
          <Text style={[styles.big, { color: theme.text, fontSize: scaled(24, theme) }]}>82%</Text>
          <Text style={[styles.body, { color: theme.textSecondary, fontSize: scaled(13, theme) }]}>Demo level · native reading requires Android</Text>
          <View style={[styles.bar, { backgroundColor: theme.surface2, borderRadius: 4 }]}>
            <View style={[styles.barFill, { width: '82%', backgroundColor: theme.success, borderRadius: 4 }]} />
          </View>
        </View>
      );
    case 'calendar':
      return (
        <View>
          <Text style={[styles.body, { color: theme.text, fontSize: scaled(14, theme) }]}>Next: Design review</Text>
          <Text style={[styles.body, { color: theme.textSecondary, fontSize: scaled(13, theme), marginTop: 4 }]}>
            Today 09:30 – 10:15 · demo agenda
          </Text>
        </View>
      );
    case 'notes':
      return (
        <TextInput
          accessibilityLabel="Quick note"
          placeholder="Jot a thought… (local only)"
          placeholderTextColor={theme.textMuted}
          value={note}
          onChangeText={setNote}
          multiline
          style={[styles.note, { color: theme.text, fontSize: scaled(14, theme), borderColor: theme.edge }]}
        />
      );
    case 'media':
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[styles.play, { backgroundColor: theme.accent }]}>
            <Text style={{ color: theme.accentText, fontWeight: '800' }}>▶</Text>
          </View>
          <View>
            <Text style={[styles.body, { color: theme.text, fontSize: scaled(14, theme) }]}>Drift — demo track</Text>
            <Text style={[styles.body, { color: theme.textSecondary, fontSize: scaled(12, theme) }]}>Preview card · no audio</Text>
          </View>
        </View>
      );
    case 'shortcuts':
      return (
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {['Search', 'Favorites', 'Settings'].map((s) => (
            <View key={s} style={[styles.chip, { backgroundColor: theme.surface2, borderRadius: theme.radiusSm }]}>
              <Text style={{ color: theme.text, fontSize: scaled(13, theme), fontWeight: '600' }}>{s}</Text>
            </View>
          ))}
        </View>
      );
    default:
      return null;
  }
}

export function WidgetCard({ widget, editMode }: { widget: Widget; editMode?: boolean }) {
  const { theme, removeWidget, cycleStack, renameWidget } = useStyro();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(widget.title);

  // auto-rotation for stacks
  useEffect(() => {
    if (widget.kind !== 'stack' || !widget.rotateSeconds || widget.rotateSeconds <= 0) return;
    const t = setInterval(() => cycleStack(widget.id, 1), widget.rotateSeconds * 1000);
    return () => clearInterval(t);
  }, [widget.id, widget.kind, widget.rotateSeconds, cycleStack]);

  if (widget.status !== 'ready') {
    return (
      <CardShell title={widget.title} editMode={editMode} onRemove={() => removeWidget(widget.id)}>
        <WidgetStatusBody status={widget.status} />
      </CardShell>
    );
  }

  if (widget.kind === 'stack') {
    const cards = widget.cards ?? [];
    const idx = Math.min(widget.activeIndex ?? 0, Math.max(0, cards.length - 1));
    const current = cards[idx];
    return (
      <CardShell
        title={widget.title}
        previewLabel={`${idx + 1}/${Math.max(1, cards.length)}`}
        editMode={editMode}
        onRemove={() => removeWidget(widget.id)}
      >
        {current ? (
          <CardBody type={current.type} />
        ) : (
          <Text style={{ color: theme.textSecondary }}>Stack is empty. Add cards from Customize.</Text>
        )}
        {cards.length > 1 && (
          <View style={[styles.stackNav, { marginTop: 10 }]}>
            <Pressable
              accessibilityLabel="Previous card"
              accessibilityRole="button"
              onPress={() => cycleStack(widget.id, -1)}
              style={[styles.navBtn, { backgroundColor: theme.surface2 }]}
              hitSlop={6}
            >
              <Text style={{ color: theme.text, fontWeight: '700' }}>‹</Text>
            </Pressable>
            <Text style={{ color: theme.textMuted, fontSize: scaled(12, theme) }}>
              {current?.title}
            </Text>
            <Pressable
              accessibilityLabel="Next card"
              accessibilityRole="button"
              onPress={() => cycleStack(widget.id, 1)}
              style={[styles.navBtn, { backgroundColor: theme.surface2 }]}
              hitSlop={6}
            >
              <Text style={{ color: theme.text, fontWeight: '700' }}>›</Text>
            </Pressable>
          </View>
        )}
      </CardShell>
    );
  }

  return (
    <CardShell
      title={widget.title}
      previewLabel={widget.type === 'clock' || widget.type === 'notes' ? undefined : 'Preview'}
      editMode={editMode}
      onRemove={() => removeWidget(widget.id)}
    >
      <CardBody type={widget.type} />
      {editMode && (
        renaming ? (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TextInput
              accessibilityLabel="Widget title"
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={() => {
                renameWidget(widget.id, draft);
                setRenaming(false);
              }}
              style={[styles.renameInput, { color: theme.text, borderColor: theme.edge, fontSize: scaled(14, theme) }]}
            />
            <Pressable
              accessibilityLabel="Save widget title"
              accessibilityRole="button"
              onPress={() => {
                renameWidget(widget.id, draft);
                setRenaming(false);
              }}
              style={[styles.navBtn, { backgroundColor: theme.accent }]}
            >
              <Text style={{ color: theme.accentText, fontWeight: '700' }}>✓</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityLabel={`Rename ${widget.title}`}
            accessibilityRole="button"
            onPress={() => {
              setDraft(widget.title);
              setRenaming(true);
            }}
            style={{ marginTop: 10 }}
          >
            <Text style={{ color: theme.textMuted, fontSize: scaled(12.5, theme) }}>Rename widget</Text>
          </Pressable>
        )
      )}
    </CardShell>
  );
}

function WidgetStatusBody({ status }: { status: Exclude<Widget['status'], 'ready'> }) {
  const { theme } = useStyro();
  const copy: Record<Exclude<Widget['status'], 'ready'>, string> = {
    loading: 'Loading demo content…',
    unavailable: 'This card is unavailable right now.',
    'permission-denied': 'Native data required. Permission not granted in preview.',
    error: 'Something went wrong loading this card.',
  };
  return <Text style={{ color: theme.textSecondary, fontSize: scaled(14, theme) }}>{copy[status]}</Text>;
}

export function WidgetPicker({ onPick }: { onPick: (type: Widget['type']) => void }) {
  const { theme } = useStyro();
  return (
    <View style={{ gap: 8 }}>
      {WIDGET_CATALOG.map((w) => (
        <Pressable
          key={w.type}
          accessibilityRole="button"
          accessibilityLabel={`Add ${w.title} widget`}
          onPress={() => onPick(w.type)}
          style={({ pressed }) => [
            styles.pick,
            { backgroundColor: pressed ? theme.surface2 : theme.surface, borderRadius: theme.radiusSm, padding: 12 },
          ]}
        >
          <Text style={{ color: theme.text, fontWeight: '600', fontSize: scaled(14, theme) }}>{w.title}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: scaled(12.5, theme), marginTop: 2 }}>{w.blurb}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontWeight: '700', letterSpacing: 1.2 },
  tag: { paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontWeight: '600' },
  remove: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  removeGlyph: { fontSize: 12, fontWeight: '800' },
  big: { fontWeight: '700', letterSpacing: 0.5 },
  body: { lineHeight: 19 },
  bar: { height: 8, marginTop: 10, overflow: 'hidden' },
  barFill: { height: 8 },
  note: { borderWidth: 1, borderRadius: 8, padding: 10, minHeight: 64, textAlignVertical: 'top' },
  play: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 8 },
  stackNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pick: {},
  renameInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, minHeight: 40 },
});
