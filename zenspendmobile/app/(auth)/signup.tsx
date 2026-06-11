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
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import type { UserSegment } from '../../src/types';
import { colors, spacing, fontSize, radius } from '../../src/theme';

const SEGMENTS: { value: UserSegment; label: string }[] = [
  { value: 'young_professionals', label: 'Jeune actif' },
  { value: 'couples', label: 'Couple' },
  { value: 'families', label: 'Famille' },
];

const CURRENCIES = ['EUR', 'USD', 'XOF', 'CAD'];

export default function SignupScreen() {
  const { signup, login } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    password_confirm: '',
  });
  const [currency, setCurrency] = useState('EUR');
  const [segment, setSegment] = useState<UserSegment>('young_professionals');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const onSubmit = async () => {
    setError(null);
    if (Object.values(form).some((v) => !v.trim())) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (form.password !== form.password_confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await signup({
        ...form,
        email: form.email.trim(),
        preferred_currency: currency,
        user_segment: segment,
      });
      // Auto-login right after a successful registration.
      await login(form.email.trim(), form.password);
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Créer un compte</Text>

          <Field label="Prénom" value={form.first_name} onChangeText={set('first_name')} />
          <Field label="Nom" value={form.last_name} onChangeText={set('last_name')} />
          <Field
            label="Email"
            value={form.email}
            onChangeText={set('email')}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Field
            label="Téléphone"
            value={form.phone_number}
            onChangeText={set('phone_number')}
            keyboardType="phone-pad"
          />

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

          <Text style={styles.label}>Profil</Text>
          <View style={styles.chips}>
            {SEGMENTS.map((s) => (
              <Pressable
                key={s.value}
                onPress={() => setSegment(s.value)}
                style={[styles.chip, segment === s.value && styles.chipActive]}
              >
                <Text style={[styles.chipText, segment === s.value && styles.chipTextActive]}>
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Field
            label="Mot de passe"
            value={form.password}
            onChangeText={set('password')}
            secureTextEntry
          />
          <Field
            label="Confirmer le mot de passe"
            value={form.password_confirm}
            onChangeText={set('password_confirm')}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="S'inscrire" onPress={onSubmit} loading={loading} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ? </Text>
            <Link href="/(auth)/login" style={styles.link}>
              Se connecter
            </Link>
          </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.foreground, fontSize: fontSize.sm, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.md, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { color: colors.muted, fontSize: fontSize.sm },
  link: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
});
