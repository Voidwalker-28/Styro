import React, { useRef } from 'react';
import { PanResponder, View } from 'react-native';
import type { GestureActionId, GestureId } from '@/lib/types';

const SWIPE_THRESHOLD = 48;
const DOUBLE_TAP_MS = 320;

/**
 * Lightweight gesture layer for the home surface. Detects directional swipes,
 * double taps, and long presses, then maps them through the user's gesture
 * configuration. Every gesture has a visible button alternative elsewhere.
 */
export function GestureLayer({
  gestures,
  onAction,
  children,
}: {
  gestures: Record<GestureId, GestureActionId>;
  onAction: (action: GestureActionId) => void;
  children: React.ReactNode;
}) {
  const start = useRef({ x: 0, y: 0, t: 0 });
  const lastTap = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moved = useRef(false);

  const fire = (g: GestureId) => {
    const action = gestures[g];
    if (action && action !== 'none') onAction(action);
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 12 || Math.abs(gs.dy) > 12,
      onPanResponderGrant: (_, gs) => {
        start.current = { x: gs.x0, y: gs.y0, t: Date.now() };
        moved.current = false;
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        longPressTimer.current = setTimeout(() => {
          if (!moved.current) fire('long-press-empty');
        }, 600);
      },
      onPanResponderMove: (_, gs) => {
        if (Math.abs(gs.dx) > 10 || Math.abs(gs.dy) > 10) {
          moved.current = true;
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        const dx = gs.dx;
        const dy = gs.dy;
        const adx = Math.abs(dx);
        const ady = Math.abs(dy);
        if (Math.max(adx, ady) < SWIPE_THRESHOLD) {
          // treat as tap
          const now = Date.now();
          if (now - lastTap.current < DOUBLE_TAP_MS) {
            lastTap.current = 0;
            fire('double-tap-empty');
          } else {
            lastTap.current = now;
            // single tap on empty space -> tap-empty (default none)
            setTimeout(() => {
              if (lastTap.current !== 0) {
                lastTap.current = 0;
                fire('tap-empty');
              }
            }, DOUBLE_TAP_MS);
          }
          return;
        }
        if (adx > ady) {
          fire(dx > 0 ? 'swipe-right' : 'swipe-left');
        } else {
          fire(dy > 0 ? 'swipe-down' : 'swipe-up');
        }
      },
      onPanResponderTerminate: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      },
    }),
  ).current;

  return <View style={{ flex: 1 }} {...responder.panHandlers}>{children}</View>;
}
