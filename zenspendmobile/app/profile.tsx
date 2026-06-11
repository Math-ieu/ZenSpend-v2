import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Button, Card, Field } from '../src/components/ui';
import { useAuth } from '../src/context/AuthContext';
import { colors, spacing, fontSize, radius } from '../src/theme';

export default function ProfileScreen() {
  const { user, updateUser, logout } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const initials =
    `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || '?';

  const onSave = async () => {
    setStatus(null);
    setError(null);
    setSaving(true);
    try {
      await updateUser({ first_name: firstName, last_name: lastName, phone_number: phone });
      setStatus('Profil mis à jour.');
    } catch (e: any) {
      setError(e?.message || 'Échec de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ title: 'Profil', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <Card>
          <Field label="Prénom" value={firstName} onChangeText={setFirstName} />
          <Field label="Nom" value={lastName} onChangeText={setLastName} />
          <Field label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          {status ? <Text style={styles.success}>{status}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Enregistrer" onPress={onSave} loading={saving} />
        </Card>

        <View style={styles.logoutWrap}>
          <Button title="Se déconnecter" variant="secondary" onPress={logout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  container: { padding: spacing.lg },
  avatarWrap: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { color: colors.white, fontSize: fontSize.xxl, fontWeight: '800' },
  name: { fontSize: fontSize.lg, fontWeight: '700', color: colors.foreground },
  email: { fontSize: fontSize.sm, color: colors.muted, marginTop: 2 },
  success: { color: colors.success, fontSize: fontSize.sm, marginBottom: spacing.md },
  error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.md },
  logoutWrap: { marginTop: spacing.xl },
});
