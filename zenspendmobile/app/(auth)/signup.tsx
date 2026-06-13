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
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Field } from '../../src/components/ui';
import { MotionView } from '../../src/components/motion';
import { useAuth } from '../../src/context/AuthContext';
import type { UserSegment } from '../../src/types';
import { colors, spacing, fontSize, radius } from '../../src/theme';

// Warm cream background that matches the auth design mockups.
const CREAM = '#FDF6EF';
const pill = { borderRadius: radius.full } as const;

const SEGMENTS: { value: UserSegment; label: string }[] = [
  { value: 'young_professionals', label: 'Jeune actif' },
  { value: 'couples', label: 'Couple' },
  { value: 'families', label: 'Famille' },
];

const CURRENCIES = ['EUR', 'USD', 'XOF', 'CAD'];

export default function SignupScreen() {
  const { signup, login } = useAuth();

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
    // Le téléphone est facultatif (l'API ne l'exige pas).
    const required = [form.first_name, form.last_name, form.email, form.password, form.password_confirm];
    if (required.some((v) => !v.trim())) {
      setError('Veuillez remplir tous les champs obligatoires.');
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
          <MotionView index={0} style={styles.header}>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Gérez vos finances en quelques secondes</Text>
          </MotionView>

          <MotionView index={1} style={styles.form}>
            <View style={styles.nameRow}>
              <View style={styles.flex}>
                <Field label="Prénom" value={form.first_name} onChangeText={set('first_name')} containerStyle={pill} />
              </View>
              <View style={styles.flex}>
                <Field label="Nom" value={form.last_name} onChangeText={set('last_name')} containerStyle={pill} />
              </View>
            </View>
            <Field
              label="Email"
              value={form.email}
              onChangeText={set('email')}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="vous@exemple.com"
              containerStyle={pill}
            />
            <Field
              label="Téléphone (optionnel)"
              value={form.phone_number}
              onChangeText={set('phone_number')}
              keyboardType="phone-pad"
              placeholder="06 12 34 56 78"
              containerStyle={pill}
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
              placeholder="••••••••"
              containerStyle={pill}
            />
            <Field
              label="Confirmer le mot de passe"
              value={form.password_confirm}
              onChangeText={set('password_confirm')}
              secureTextEntry
              placeholder="••••••••"
              containerStyle={pill}
            />

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button title="S'inscrire" onPress={onSubmit} loading={loading} style={pill} />
          </MotionView>

          <MotionView index={2} style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ? </Text>
            <Link href="/(auth)/login" style={styles.link}>
              Se connecter
            </Link>
          </MotionView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CREAM },
  flex: { flex: 1 },
  container: { padding: spacing.xl },

  header: { marginBottom: spacing.xl },
  title: { fontSize: 28, fontWeight: '800', color: colors.foreground, letterSpacing: -0.5 },
  subtitle: { fontSize: fontSize.sm, color: colors.muted, marginTop: spacing.xs },

  form: { gap: spacing.xs },
  nameRow: { flexDirection: 'row', gap: spacing.md },

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

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.error, fontSize: fontSize.sm, flex: 1 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxl },
  footerText: { color: colors.muted, fontSize: fontSize.sm },
  link: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
});
