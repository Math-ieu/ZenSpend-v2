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
import { accountsApi } from '../src/api/resources';
import { colors, spacing, fontSize, radius } from '../src/theme';

const TYPES = [
  { value: 'checking', label: 'Compte courant' },
  { value: 'savings', label: 'Épargne' },
  { value: 'credit', label: 'Crédit' },
  { value: 'investment', label: 'Investissement' },
];
const CURRENCIES = ['EUR', 'USD', 'XOF', 'CAD'];

export default function NewAccountScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState('checking');
  const [currency, setCurrency] = useState('EUR');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Veuillez nommer le compte.');
      return;
    }
    setSaving(true);
    try {
      await accountsApi.create({
        name: name.trim(),
        account_type: type,
        balance: parseFloat(balance.replace(',', '.')) || 0,
        currency,
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
      <Stack.Screen options={{ title: 'Nouveau compte', presentation: 'modal' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Nouveau compte</Text>

          <Field label="Nom du compte" value={name} onChangeText={setName} placeholder="Ex: Compte courant" />
          <Field
            label="Solde initial"
            value={balance}
            onChangeText={setBalance}
            keyboardType="decimal-pad"
            placeholder="0,00"
          />

          <Text style={styles.label}>Type</Text>
          <View style={styles.chips}>
            {TYPES.map((t) => (
              <Pressable
                key={t.value}
                onPress={() => setType(t.value)}
                style={[styles.chip, type === t.value && styles.chipActive]}
              >
                <Text style={[styles.chipText, type === t.value && styles.chipTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Devise</Text>
          <View style={styles.chips}>
            {CURRENCIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCurrency(c)}
                style={[styles.chip, currency === c && styles.chipActive]}
              >
                <Text style={[styles.chipText, currency === c && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>

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
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground, marginBottom: spacing.sm },
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
