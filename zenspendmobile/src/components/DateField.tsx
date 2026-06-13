// A labelled date input that opens the native OS date picker, matching the
// look of the text `Field`. Stores/returns an ISO date string (YYYY-MM-DD).
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { colors, fontSize, radius, spacing } from '../theme';

/** Local-time ISO date (avoids the UTC off-by-one of toISOString). */
function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatFr(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Sélectionner une date',
  clearable = false,
  minimumDate,
  maximumDate,
}: {
  label?: string;
  /** ISO date 'YYYY-MM-DD' or '' when empty. */
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  clearable?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
}) {
  const [show, setShow] = useState(false);
  const current = value ? new Date(`${value}T00:00:00`) : new Date();

  const handleValueChange = (_event: DateTimePickerChangeEvent, selected: Date) => {
    // Android closes the dialog itself; iOS keeps the spinner inline.
    setShow(Platform.OS === 'ios');
    if (selected) {
      onChange(toISO(selected));
    }
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={() => setShow(true)}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.muted} style={styles.icon} />
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? formatFr(value) : placeholder}
        </Text>
        {clearable && value ? (
          <Pressable onPress={() => onChange('')} hitSlop={8} style={styles.clear}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        ) : (
          <Ionicons name="chevron-down" size={18} color={colors.muted} />
        )}
      </Pressable>

      {show ? (
        <DateTimePicker
          value={current}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onValueChange={handleValueChange}
          onDismiss={() => setShow(false)}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground, marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  rowPressed: { borderColor: colors.primary },
  icon: { marginRight: spacing.sm },
  value: { flex: 1, fontSize: fontSize.md, color: colors.foreground },
  placeholder: { color: colors.muted },
  clear: { paddingLeft: spacing.sm },
});
