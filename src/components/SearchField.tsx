import React, { forwardRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStyro } from '@/lib/store';
import { scaled } from '@/lib/tokens';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  label?: string;
  testID?: string;
}

/** Search input with clear button, 44pt targets, visible focus ring. */
export const SearchField = forwardRef<TextInput, Props>(function SearchField(
  { value, onChange, onFocus, placeholder = 'Search apps, folders, settings', autoFocus, label = 'Search', testID },
  ref,
) {
  const { theme } = useStyro();
  const [focused, setFocused] = React.useState(false);
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.surface,
          borderRadius: theme.radiusSm,
          borderWidth: 1.5,
          borderColor: focused ? theme.accent : theme.edge,
          minHeight: 48,
        },
      ]}
    >
      <Text accessible={false} style={[styles.icon, { color: theme.textMuted }]}>
        ⌕
      </Text>
      <TextInput
        ref={ref}
        testID={testID}
        accessibilityLabel={label}
        accessibilityRole="search"
        value={value}
        onChangeText={onChange}
        onFocus={() => {
          setFocused(true);
          onFocus?.();
        }}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        autoFocus={autoFocus}
        returnKeyType="search"
        clearButtonMode="never"
        style={[styles.input, { color: theme.text, fontSize: scaled(15, theme) }]}
      />
      {value.length > 0 && (
        <Pressable
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          onPress={() => onChange('')}
          style={[styles.clear, { backgroundColor: theme.surface2 }]}
          hitSlop={8}
        >
          <Text style={[styles.clearGlyph, { color: theme.textSecondary }]}>✕</Text>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  icon: { fontSize: 20, marginRight: 8 },
  input: { flex: 1, minHeight: 46, paddingVertical: 10 },
  clear: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  clearGlyph: { fontSize: 14, fontWeight: '600' },
});
