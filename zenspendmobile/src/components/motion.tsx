// Shared motion language for ZenSpend — "sobre & pro": short fades with a
// slight upward rise, gentle easing, and a small stagger between sibling
// blocks. Built on react-native-reanimated's declarative entering API so
// screens stay clean (wrap a block in <MotionView index={n}> and it's done).
import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  LinearTransition,
} from 'react-native-reanimated';

const DURATION = 380;
const STAGGER = 70;
const EASE = Easing.out(Easing.cubic);

/** Entrance for a content block: fade + slight rise, staggered by index. */
export function entrance(index = 0) {
  return FadeInDown.duration(DURATION)
    .delay(index * STAGGER)
    .easing(EASE);
}

/** Plain fade entrance (no movement) — for headers / hero blocks. */
export function fade(index = 0) {
  return FadeIn.duration(DURATION)
    .delay(index * STAGGER)
    .easing(EASE);
}

/** Smooth layout transition for list reordering / size changes. */
export const layout = LinearTransition.duration(DURATION).easing(EASE);

/** Re-export so screens can build their own animated rows when needed. */
export { Animated };

/** Animated view that fades + rises in on mount, staggered by `index`. */
export function MotionView({
  index = 0,
  style,
  children,
}: {
  index?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <Animated.View entering={entrance(index)} style={style}>
      {children}
    </Animated.View>
  );
}
