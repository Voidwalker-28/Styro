import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useStyro } from '@/lib/store';
import { scaled } from '@/lib/tokens';

/** Bottom sheet with scrim; honors reduced motion. */
export function Sheet({
  visible,
  onClose,
  children,
  label,
  height,
}: {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  label: string;
  height?: number;
}) {
  const { theme, reducedMotion } = useStyro();
  const { height: winH } = useWindowDimensions();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      if (reducedMotion) {
        anim.setValue(1);
      } else {
        Animated.timing(anim, { toValue: 1, duration: 240, useNativeDriver: true }).start();
      }
    }
  }, [visible, reducedMotion, anim]);

  const sheetH = height ?? Math.min(winH * 0.72, 560);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [sheetH, 0] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Close"
        accessibilityRole="button"
        onPress={onClose}
        style={[styles.scrim, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
      />
      <View style={styles.anchor} pointerEvents="box-none">
        <Animated.View
          accessibilityLabel={label}
          accessibilityRole="menu"
          style={[
            styles.sheet,
            {
              backgroundColor: theme.bgElevated,
              borderTopLeftRadius: theme.radius,
              borderTopRightRadius: theme.radius,
              maxHeight: sheetH,
              transform: reducedMotion ? [] : [{ translateY }],
              opacity: reducedMotion ? (visible ? 1 : 0) : anim,
              borderTopWidth: 1,
              borderColor: theme.edge,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.textMuted }]} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFill },
  anchor: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
    opacity: 0.5,
  },
});

export function SheetTitle({ children }: { children: React.ReactNode }) {
  const { theme } = useStyro();
  return (
    <View style={{ marginBottom: 8 }}>
      {typeof children === 'string' ? (
        <Animated.Text style={{ color: theme.text, fontSize: scaled(17, theme), fontWeight: '700' }}>
          {children}
        </Animated.Text>
      ) : (
        children
      )}
    </View>
  );
}
