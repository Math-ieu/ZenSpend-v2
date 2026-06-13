// Animated "piggy hero" for sparse screens (login, forgot-password, empty
// states). Port of the web mockup's Variant B: a central piggy bank in a white
// disc with a pulsing halo, two coins gently orbiting, peeking corner stickers
// and twinkling sparkles. CSS @keyframes become reanimated loops
// (withRepeat + withTiming, reversing) so the float is buttery on the UI thread.
import { useEffect } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// Soft pastel disc backgrounds matching each emoji (approx. of the mockup's oklch).
const STICKER_BG = {
  coin: '#FBEFD2',
  bill: '#D8F2DF',
  card: '#DCEAFB',
  bag: '#FBE2D0',
} as const;

const HALO = 'rgba(244,122,31,0.20)';

// ---- Animated primitives ---------------------------------------------------

/** A floating disc with an emoji: loops translate (dx/dy) + rotate. */
function Floaty({
  emoji,
  size,
  fontSize,
  bg,
  borderWidth = 4,
  dx = 0,
  dy,
  rotFrom,
  rotTo,
  duration,
  delay = 0,
  style,
}: {
  emoji: string;
  size: number;
  fontSize: number;
  bg?: string;
  borderWidth?: number;
  dx?: number;
  dy: number;
  rotFrom: number;
  rotTo: number;
  duration: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  }, []);
  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dx * t.value },
      { translateY: dy * t.value },
      { rotate: `${rotFrom + (rotTo - rotFrom) * t.value}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[
        styles.disc,
        { width: size, height: size, borderRadius: size / 2, borderWidth, backgroundColor: bg ?? '#fff' },
        style,
        aStyle,
      ]}
    >
      <Text style={{ fontSize }}>{emoji}</Text>
    </Animated.View>
  );
}

/** Pulsing soft halo behind the piggy (scale + opacity). */
function Halo({ size }: { size: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 4500, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const aStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + 0.35 * t.value,
    transform: [{ scale: 1 + 0.13 * t.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: HALO },
        aStyle,
      ]}
    />
  );
}

/** Twinkling sparkle (scale + opacity). */
function Sparkle({
  fontSize,
  delay = 0,
  duration = 3200,
  style,
}: {
  fontSize: number;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  }, []);
  const aStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + 0.5 * t.value,
    transform: [{ scale: 0.8 + 0.35 * t.value }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute' }, style, aStyle]}>
      <Text style={{ fontSize }}>✨</Text>
    </Animated.View>
  );
}

// ---- Hero ------------------------------------------------------------------

/**
 * `compact` shrinks everything and drops the corner stickers + wordmark — sized
 * for empty-state cards. Full size is meant for the top of an auth screen.
 */
export function FloatingStickers({
  compact = false,
  showWordmark = !compact,
  style,
}: {
  compact?: boolean;
  showWordmark?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const k = compact ? 0.66 : 1; // global scale factor
  const groupSize = 200 * k;
  const haloSize = 170 * k;
  const discSize = 128 * k;
  const piggyFont = 66 * k;

  return (
    <View style={[styles.container, { minHeight: compact ? 150 : 280 }, style]}>
      {/* Peeking corner stickers — full size only */}
      {!compact ? (
        <>
          <Floaty
            emoji="💵"
            size={58}
            fontSize={27}
            bg={STICKER_BG.bill}
            dy={-16}
            rotFrom={6}
            rotTo={1}
            duration={5600}
            style={{ position: 'absolute', left: 8, top: 6 }}
          />
          <Floaty
            emoji="💳"
            size={56}
            fontSize={26}
            bg={STICKER_BG.card}
            dy={-14}
            rotFrom={8}
            rotTo={2}
            duration={5000}
            delay={300}
            style={{ position: 'absolute', right: 8, top: 12 }}
          />
        </>
      ) : null}

      {/* Center piggy group */}
      <View style={{ width: groupSize, height: groupSize, alignItems: 'center', justifyContent: 'center' }}>
        <Halo size={haloSize} />

        {/* Hero disc (gentle float) */}
        <Floaty
          emoji="🏦"
          size={discSize}
          fontSize={piggyFont}
          bg="#fff"
          borderWidth={0}
          dy={-13 * k}
          rotFrom={-2.5}
          rotTo={2.5}
          duration={5500}
          style={styles.piggyShadow}
        />

        {/* Orbiting coins */}
        <Floaty
          emoji="🪙"
          size={52 * k}
          fontSize={24 * k}
          bg={STICKER_BG.coin}
          dx={-7}
          dy={-13}
          rotFrom={-6}
          rotTo={2}
          duration={4600}
          style={{ position: 'absolute', left: -2 * k, top: 34 * k }}
        />
        <Floaty
          emoji="💰"
          size={58 * k}
          fontSize={27 * k}
          bg={STICKER_BG.bag}
          dx={8}
          dy={-11}
          rotFrom={7}
          rotTo={-2}
          duration={5200}
          style={{ position: 'absolute', right: -6 * k, bottom: 24 * k }}
        />

        {/* Sparkles */}
        <Sparkle fontSize={22 * k} style={{ right: 6 * k, top: 8 * k }} />
        <Sparkle fontSize={18 * k} delay={600} duration={4000} style={{ left: 14 * k, bottom: 6 * k }} />
      </View>

      {showWordmark ? <Text style={styles.wordmark}>ZenSpend</Text> : null}
    </View>
  );
}

// ---- Form decorations ------------------------------------------------------

/** Soft pastel disc backgrounds, keyed by theme. */
export const STICKER_TINTS = {
  bill: '#D8F2DF',
  coin: '#FBEFD2',
  card: '#DCEAFB',
  bag: '#FBE2D0',
  bank: '#E3F0E8',
  chart: '#DCEAFB',
  target: '#FCE3DF',
} as const;

/** Single floating sticker for a form's top-right corner (themed per screen). */
export function StickerBadge({
  emoji,
  tint,
  size = 60,
}: {
  emoji: string;
  tint: string;
  size?: number;
}) {
  return (
    <Floaty
      emoji={emoji}
      size={size}
      fontSize={Math.round(size * 0.46)}
      bg={tint}
      dy={-7}
      rotFrom={-6}
      rotTo={4}
      duration={5200}
    />
  );
}

/** Two floating stickers + sparkles to fill the empty space of a short form. */
export function StickerScatter({
  left,
  right,
  style,
}: {
  left: { emoji: string; tint: string };
  right: { emoji: string; tint: string };
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.scatter, style]}>
      <Floaty
        emoji={left.emoji}
        size={74}
        fontSize={34}
        bg={left.tint}
        dy={-12}
        rotFrom={-5}
        rotTo={3}
        duration={5400}
        style={{ position: 'absolute', left: 28, top: 30 }}
      />
      <Floaty
        emoji={right.emoji}
        size={64}
        fontSize={30}
        bg={right.tint}
        dy={-14}
        rotFrom={7}
        rotTo={-2}
        duration={4800}
        delay={300}
        style={{ position: 'absolute', right: 40, top: 66 }}
      />
      <Sparkle fontSize={22} style={{ left: '48%', top: 4 }} />
      <Sparkle fontSize={18} delay={500} duration={4000} style={{ left: '34%', bottom: 22 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  scatter: { height: 170, width: '100%' },
  container: { alignItems: 'center', justifyContent: 'center', width: '100%' },
  disc: {
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    // shadow (iOS) + elevation (Android)
    shadowColor: 'rgba(60,40,20,1)',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  piggyShadow: {
    shadowColor: 'rgba(60,40,20,1)',
    shadowOpacity: 0.16,
    shadowRadius: 19,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },
  wordmark: {
    fontWeight: '800',
    fontSize: 20,
    color: '#22262F',
    letterSpacing: -0.4,
    marginTop: 6,
  },
});
