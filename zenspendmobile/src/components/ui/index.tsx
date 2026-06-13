// Shared presentational primitives for the ZenSpend mobile UI.
import React, { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing, fontSize } from '../../theme';
import { FloatingStickers } from '../FloatingStickers';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ---- Avatar ----------------------------------------------------------------

export function Avatar({
  name,
  uri,
  size = 44,
  onPress,
}: {
  name?: string;
  uri?: string;
  size?: number;
  onPress?: () => void;
}) {
  const initials =
    (name || '')
      .split(' ')
      .map((p) => p.trim()[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  const circle = { width: size, height: size, borderRadius: size / 2 } as const;
  const content = uri ? (
    <Image source={{ uri }} style={circle} />
  ) : (
    <View style={[styles.avatar, circle]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}>
        {content}
      </Pressable>
    );
  }
  return content;
}

// ---- Card ------------------------------------------------------------------

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ---- Button ----------------------------------------------------------------

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';
  const isFilled = isPrimary || isDanger;

  // Subtle press feedback: scale down slightly while held.
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 140 });
      }}
      disabled={disabled || loading}
      style={[
        styles.button,
        isPrimary && styles.buttonPrimary,
        isDanger && styles.buttonDanger,
        variant === 'secondary' && styles.buttonSecondary,
        isGhost && styles.buttonGhost,
        (disabled || loading) && styles.buttonDisabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isFilled ? colors.white : colors.primary} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            isFilled ? styles.buttonTextPrimary : styles.buttonTextSecondary,
          ]}
        >
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
}

// ---- Input -----------------------------------------------------------------

interface FieldProps extends TextInputProps {
  label?: string;
  error?: string;
  /** Optional leading icon (Ionicons name). */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Optional override for the input container (e.g. pill shape on auth screens). */
  containerStyle?: StyleProp<ViewStyle>;
}

export function Field({ label, error, icon, style, containerStyle, secureTextEntry, ...rest }: FieldProps) {
  const isPassword = !!secureTextEntry;
  const [hidden, setHidden] = useState(isPassword);

  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, !!error && styles.inputError, containerStyle]}>
        {icon ? <Ionicons name={icon} size={18} color={colors.muted} style={styles.inputIcon} /> : null}
        <TextInput
          placeholderTextColor={colors.muted}
          style={[styles.inputField, style]}
          secureTextEntry={isPassword && hidden}
          {...rest}
        />
        {isPassword ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8} style={styles.eyeBtn}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

// ---- ProgressBar -----------------------------------------------------------

export function ProgressBar({ progress, color = colors.primary }: { progress: number; color?: string }) {
  const pct = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

// ---- EmptyState ------------------------------------------------------------

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.empty}>
      <FloatingStickers compact style={styles.emptyArt} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '800' },
  button: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonDanger: { backgroundColor: colors.error },
  buttonSecondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonDisabled: { opacity: 0.6 },
  buttonPressed: { opacity: 0.85 },
  buttonText: { fontSize: fontSize.md, fontWeight: '700' },
  buttonTextPrimary: { color: colors.white },
  buttonTextSecondary: { color: colors.foreground },
  fieldWrap: { marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground, marginBottom: spacing.xs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  inputIcon: { marginRight: spacing.sm },
  inputField: {
    flex: 1,
    height: '100%',
    fontSize: fontSize.md,
    color: colors.foreground,
  },
  eyeBtn: { paddingLeft: spacing.sm },
  inputError: { borderColor: colors.error },
  errorText: { color: colors.error, fontSize: fontSize.xs, marginTop: spacing.xs },
  progressTrack: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.full },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  emptyArt: { marginBottom: spacing.lg },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.foreground, marginBottom: spacing.xs },
  emptyMessage: { fontSize: fontSize.sm, color: colors.muted, textAlign: 'center', paddingHorizontal: spacing.xl },
});
