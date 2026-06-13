import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import { FloatingStickers } from '../../src/components/FloatingStickers';
import { useAuth } from '../../src/context/AuthContext';
import { colors, spacing, fontSize, radius } from '../../src/theme';

// Warm cream background that matches the auth design mockups.
const CREAM = '#FDF6EF';
const pill = { borderRadius: radius.full } as const;

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError('Veuillez renseigner votre email et votre mot de passe.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      // Navigation is handled by the root auth guard.
    } catch (e: any) {
      setError(e?.message || 'Échec de la connexion.');
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
          <MotionView index={0} style={styles.hero}>
            <FloatingStickers />
          </MotionView>

          <MotionView index={1} style={styles.header}>
            <Text style={styles.title}>Se connecter</Text>
            <Text style={styles.subtitle}>Heureux de vous revoir sur votre compte !</Text>
          </MotionView>

          <MotionView index={2} style={styles.form}>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="vous@exemple.com"
              containerStyle={pill}
            />
            <Field
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              containerStyle={pill}
            />

            <Link href="/(auth)/forgot-password" style={styles.forgot}>
              Mot de passe oublié ?
            </Link>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button title="Se connecter" onPress={onSubmit} loading={loading} style={pill} />
          </MotionView>

          <MotionView index={3} style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte ? </Text>
            <Link href="/(auth)/signup" style={styles.link}>
              Créer un compte
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
  container: { padding: spacing.xl, flexGrow: 1, justifyContent: 'center' },
  hero: { marginBottom: spacing.sm },

  header: { marginBottom: spacing.xl },
  title: { fontSize: 28, fontWeight: '800', color: colors.foreground, letterSpacing: -0.5 },
  subtitle: { fontSize: fontSize.sm, color: colors.muted, marginTop: spacing.xs },

  form: { gap: spacing.xs },
  forgot: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: spacing.lg,
  },
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
