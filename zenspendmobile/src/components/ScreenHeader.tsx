// Consistent screen title row with an optional right-side action.
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, fontSize } from '../theme';

export function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  flex: { flex: 1 },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.foreground },
  subtitle: { fontSize: fontSize.sm, color: colors.muted, marginTop: spacing.xs },
});
