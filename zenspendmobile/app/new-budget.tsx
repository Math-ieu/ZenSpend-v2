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
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '../src/components/ui';
import { MotionView } from '../src/components/motion';
import { StickerBadge, StickerScatter, STICKER_TINTS } from '../src/components/FloatingStickers';
import { useFetch } from '../src/lib/useFetch';
import { budgetsApi, categoriesApi } from '../src/api/resources';
import type { Category } from '../src/types';
import { colors, spacing, fontSize, radius } from '../src/theme';

// Default a new budget to the current calendar month.
function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

export default function NewBudgetScreen() {
  const router = useRouter();
  const categories = useFetch<Category[]>(() => categoriesApi.list(), []);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleCategory = (id: number) =>
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const onSubmit = async () => {
    setError(null);
    const numeric = parseFloat(amount.replace(',', '.'));
    if (!name.trim() || !numeric || Number.isNaN(numeric)) {
      setError('Renseignez un nom et un montant valide.');
      return;
    }
    setSaving(true);
    try {
      const { start, end } = monthRange();
      await budgetsApi.create({
        name: name.trim(),
        amount: numeric,
        start_date: start,
        end_date: end,
        categories: categoryIds,
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
      <Stack.Screen options={{ title: 'Nouveau budget', presentation: 'modal' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <MotionView index={0} style={styles.titleRow}>
            <View style={styles.titleFlex}>
              <Text style={styles.title}>Nouveau budget</Text>
              <Text style={styles.subtitle}>Période : mois en cours</Text>
            </View>
            <StickerBadge emoji="📊" tint={STICKER_TINTS.chart} />
          </MotionView>

          <MotionView index={1}>
            <Field label="Nom" value={name} onChangeText={setName} placeholder="Ex: Alimentation" />
          </MotionView>
          <MotionView index={2}>
            <Field
              label="Montant mensuel"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0,00"
            />
          </MotionView>

          <MotionView index={3}>
          <Text style={styles.label}>Catégories (optionnel)</Text>
          {categories.data?.length ? (
            <View style={styles.chips}>
              {categories.data.map((c) => {
                const id = Number(c.id);
                const active = categoryIds.includes(id);
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => toggleCategory(id)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.hint}>Aucune catégorie disponible</Text>
          )}
          </MotionView>

          <View style={styles.filler}>
            <StickerScatter
              left={{ emoji: '🏦', tint: STICKER_TINTS.bank }}
              right={{ emoji: '🪙', tint: STICKER_TINTS.coin }}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <MotionView index={4}>
            <Button title="Enregistrer" onPress={onSubmit} loading={saving} />
            <Button title="Annuler" variant="ghost" onPress={() => router.back()} />
          </MotionView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { padding: spacing.xl, flexGrow: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  titleFlex: { flex: 1 },
  filler: { flex: 1, justifyContent: 'center', minHeight: 170 },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.foreground },
  subtitle: { fontSize: fontSize.sm, color: colors.muted, marginBottom: spacing.xl, marginTop: spacing.xs },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground, marginBottom: spacing.sm },
  hint: { fontSize: fontSize.sm, color: colors.muted, marginBottom: spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
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
