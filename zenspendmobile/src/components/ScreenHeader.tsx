// Consistent, stylish screen title row with an optional right-side action.
// Renders a small primary accent bar (or an uppercase eyebrow label) above a
// large, tightly-tracked title.
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, fontSize } from '../theme';

export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  action,
}: {
  title: string;
  subtitle?: string;
  /** Optional uppercase overline label shown above the title. */
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        {eyebrow ? (
          <Text style={styles.eyebrow}>{eyebrow}</Text>
        ) : (
          <View style={styles.accent} />
        )}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  flex: { flex: 1 },
  accent: {
    width: 34,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.primary,
    marginBottom: spacing.sm,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.foreground,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: spacing.xs,
    letterSpacing: 0.1,
  },
});
