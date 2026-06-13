import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '../src/components/ui';
import { DateField } from '../src/components/DateField';
import { MotionView } from '../src/components/motion';
import { StickerBadge, StickerScatter, STICKER_TINTS } from '../src/components/FloatingStickers';
import { goalsApi } from '../src/api/resources';
import { colors, spacing, fontSize } from '../src/theme';

export default function NewGoalScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async () => {
    setError(null);
    const numeric = parseFloat(target.replace(',', '.'));
    if (!name.trim() || !numeric || Number.isNaN(numeric)) {
      setError('Renseignez un nom et un montant cible valide.');
      return;
    }
    if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      setError('La date doit être au format AAAA-MM-JJ.');
      return;
    }
    setSaving(true);
    try {
      await goalsApi.create({
        name: name.trim(),
        target_amount: numeric,
        deadline: deadline || null,
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
      <Stack.Screen options={{ title: 'Nouvel objectif', presentation: 'modal' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <MotionView index={0} style={styles.titleRow}>
            <Text style={[styles.title, styles.titleFlex]}>Nouvel objectif</Text>
            <StickerBadge emoji="🎯" tint={STICKER_TINTS.target} />
          </MotionView>

          <MotionView index={1}>
            <Field label="Nom" value={name} onChangeText={setName} placeholder="Ex: Vacances" />
          </MotionView>
          <MotionView index={2}>
            <Field
              label="Montant cible"
              value={target}
              onChangeText={setTarget}
              keyboardType="decimal-pad"
              placeholder="0,00"
            />
          </MotionView>
          <MotionView index={3}>
            <DateField
              label="Échéance (optionnel)"
              value={deadline}
              onChange={setDeadline}
              placeholder="Choisir une date"
              clearable
              minimumDate={new Date()}
            />
          </MotionView>

          <View style={styles.filler}>
            <StickerScatter
              left={{ emoji: '🏦', tint: STICKER_TINTS.bank }}
              right={{ emoji: '💰', tint: STICKER_TINTS.bag }}
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
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.xl },
  titleFlex: { flex: 1, marginBottom: 0 },
  filler: { flex: 1, justifyContent: 'center', minHeight: 170 },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.foreground, marginBottom: spacing.xl },
  error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.md },
});
