import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useStyro } from '@/lib/store';
import { scaled } from '@/lib/tokens';

/** A single settings row: label, description, and a control on the right. */
export function SettingRow({
  label,
  description,
  control,
  onPress,
  disabled,
  danger,
}: {
  label: string;
  description?: string;
  control?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  const { theme } = useStyro();
  const inner = (
    <View style={[styles.row, { opacity: disabled ? 0.45 : 1, minHeight: 56 }]}>
      <View style={styles.texts}>
        <Text
          accessibilityRole={onPress ? undefined : 'text'}
          style={[styles.label, { color: danger ? theme.danger : theme.text, fontSize: scaled(15, theme) }]}
        >
          {label}
        </Text>
        {description ? (
          <Text style={[styles.desc, { color: theme.textSecondary, fontSize: scaled(12.5, theme) }]}>{description}</Text>
        ) : null}
      </View>
      {control ? <View style={styles.control}>{control}</View> : null}
      {onPress ? (
        <Text accessible={false} style={[styles.chev, { color: theme.textMuted }]}>
          ›
        </Text>
      ) : null}
    </View>
  );
  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
}

export function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  const { theme } = useStyro();
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      onValueChange={onChange}
      trackColor={{ false: theme.surface2, true: theme.accent }}
      thumbColor={value ? theme.accentText : theme.textSecondary}
      style={{ transform: [{ scale: 1 }] }}
    />
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const { theme } = useStyro();
  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="radiogroup"
      style={[styles.seg, { backgroundColor: theme.surface, borderRadius: theme.radiusSm }]}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={[
              styles.segBtn,
              {
                backgroundColor: selected ? theme.accent : 'transparent',
                borderRadius: theme.radiusSm - 2,
                minHeight: 40,
              },
            ]}
          >
            <Text
              style={[
                styles.segLabel,
                {
                  color: selected ? theme.accentText : theme.textSecondary,
                  fontSize: scaled(13, theme),
                  fontWeight: selected ? '700' : '500',
                },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SectionHeader({ title }: { title: string }) {
  const { theme } = useStyro();
  return (
    <Text
      accessibilityRole="header"
      style={[
        styles.section,
        { color: theme.textSecondary, fontSize: scaled(11.5, theme), marginTop: 26, marginBottom: 6 },
      ]}
    >
      {title.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  texts: { flex: 1, paddingRight: 12 },
  label: { fontWeight: '600' },
  desc: { marginTop: 3, lineHeight: 17 },
  control: { marginLeft: 8 },
  chev: { fontSize: 24, marginLeft: 4 },
  seg: { flexDirection: 'row', padding: 3, gap: 2 },
  segBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, paddingVertical: 8 },
  segLabel: { textAlign: 'center' },
  section: { fontWeight: '700', letterSpacing: 1.4, paddingHorizontal: 2 },
});
