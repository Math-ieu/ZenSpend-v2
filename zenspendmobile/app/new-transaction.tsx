import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '../src/components/ui';
import { DateField } from '../src/components/DateField';
import { MotionView } from '../src/components/motion';
import { StickerBadge, STICKER_TINTS } from '../src/components/FloatingStickers';
import { useFetch } from '../src/lib/useFetch';
import { accountsApi, categoriesApi, transactionsApi } from '../src/api/resources';
import type { Account, Category } from '../src/types';
import { colors, spacing, fontSize, radius } from '../src/theme';

export default function NewTransactionScreen() {
  const router = useRouter();
  const accounts = useFetch<Account[]>(() => accountsApi.list(), []);
  const categories = useFetch<Category[]>(() => categoriesApi.list(), []);

  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayISO());
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async () => {
    setError(null);
    const numeric = parseFloat(amount.replace(',', '.'));
    if (!description.trim() || !numeric || Number.isNaN(numeric)) {
      setError('Renseignez une description et un montant valide.');
      return;
    }
    setSaving(true);
    try {
      const signed = type === 'expense' ? -Math.abs(numeric) : Math.abs(numeric);
      await transactionsApi.create({
        amount: signed,
        description: description.trim(),
        date,
        account: accountId ? Number(accountId) : null,
        category: categoryId ? Number(categoryId) : null,
      });
      router.back();
    } catch (e: any) {
      setError(e?.message || "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Nouvelle transaction', presentation: 'modal' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <MotionView index={0} style={styles.titleRow}>
            <Text style={[styles.title, styles.titleFlex]}>Nouvelle transaction</Text>
            <StickerBadge emoji="💵" tint={STICKER_TINTS.bill} />
          </MotionView>

          <MotionView index={1} style={styles.toggle}>
            {(['expense', 'income'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[styles.toggleBtn, type === t && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, type === t && styles.toggleTextActive]}>
                  {t === 'expense' ? 'Dépense' : 'Revenu'}
                </Text>
              </Pressable>
            ))}
          </MotionView>

          <MotionView index={2}>
            <Field
              label="Montant"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0,00"
            />
          </MotionView>
          <MotionView index={3}>
            <Field
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Courses, Salaire…"
            />
          </MotionView>
          <MotionView index={4}>
            <DateField label="Date" value={date} onChange={setDate} maximumDate={new Date()} />
          </MotionView>

          <MotionView index={5}>
            <Selector
              label="Compte"
              options={(accounts.data || []).map((a) => ({ id: String(a.id), label: a.name }))}
              selected={accountId}
              onSelect={setAccountId}
              emptyHint="Aucun compte"
            />
          </MotionView>
          <MotionView index={6}>
            <Selector
              label="Catégorie"
              options={(categories.data || []).map((c) => ({ id: String(c.id), label: c.name }))}
              selected={categoryId}
              onSelect={setCategoryId}
              emptyHint="Aucune catégorie"
            />
          </MotionView>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <MotionView index={7}>
            <Button title="Enregistrer" onPress={onSubmit} loading={saving} />
            <Button title="Annuler" variant="ghost" onPress={() => router.back()} />
          </MotionView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Selector({
  label,
  options,
  selected,
  onSelect,
  emptyHint,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
  emptyHint: string;
}) {
  return (
    <View style={styles.selectorWrap}>
      <Text style={styles.label}>{label}</Text>
      {options.length === 0 ? (
        <Text style={styles.hint}>{emptyHint}</Text>
      ) : (
        <View style={styles.chips}>
          {options.map((o) => (
            <Pressable
              key={o.id}
              onPress={() => onSelect(o.id)}
              style={[styles.chip, selected === o.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, selected === o.id && styles.chipTextActive]}>
                {o.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { padding: spacing.xl },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.foreground, marginBottom: spacing.xl },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.xl },
  titleFlex: { flex: 1, marginBottom: 0 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  toggleBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
  toggleBtnActive: { backgroundColor: colors.white },
  toggleText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.muted },
  toggleTextActive: { color: colors.foreground },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground, marginBottom: spacing.sm },
  selectorWrap: { marginBottom: spacing.lg },
  hint: { fontSize: fontSize.sm, color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.foreground, fontSize: fontSize.sm },
  chipTextActive: { color: colors.white },
  error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.md },
});
