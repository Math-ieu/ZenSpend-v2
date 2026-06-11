import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '../src/components/ui';
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
          <Text style={styles.title}>Nouvel objectif</Text>

          <Field label="Nom" value={name} onChangeText={setName} placeholder="Ex: Vacances" />
          <Field
            label="Montant cible"
            value={target}
            onChangeText={setTarget}
            keyboardType="decimal-pad"
            placeholder="0,00"
          />
          <Field
            label="Échéance (optionnel)"
            value={deadline}
            onChangeText={setDeadline}
            placeholder="AAAA-MM-JJ"
            autoCapitalize="none"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Enregistrer" onPress={onSubmit} loading={saving} />
          <Button title="Annuler" variant="ghost" onPress={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { padding: spacing.xl },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.foreground, marginBottom: spacing.xl },
  error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.md },
});
