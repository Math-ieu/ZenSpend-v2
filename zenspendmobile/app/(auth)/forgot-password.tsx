import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '../../src/components/ui';
import { authApi } from '../../src/api/auth';
import { colors, spacing, fontSize } from '../../src/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!email) {
      setError('Veuillez renseigner votre email.');
      return;
    }
    setLoading(true);
    try {
      await authApi.requestPasswordReset(email.trim());
      setSent(true);
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Mot de passe oublié</Text>
        <Text style={styles.subtitle}>
          Saisissez votre email pour recevoir un lien de réinitialisation.
        </Text>

        {sent ? (
          <Text style={styles.success}>
            Si un compte existe pour cette adresse, un email vient d'être envoyé.
          </Text>
        ) : (
          <>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Envoyer le lien" onPress={onSubmit} loading={loading} />
          </>
        )}

        <View style={styles.footer}>
          <Link href="/(auth)/login" style={styles.link}>
            Retour à la connexion
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.foreground, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.sm, color: colors.muted, marginBottom: spacing.xl },
  success: { color: colors.success, fontSize: fontSize.sm, marginBottom: spacing.lg },
  error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.md },
  footer: { alignItems: 'center', marginTop: spacing.xl },
  link: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
});
