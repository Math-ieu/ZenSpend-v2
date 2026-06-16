// Bank connection flow (DSP2 / Open Banking, read-only import).
//
// Flow:
//   1. POST link-session -> hosted bank consent URL (link_url).
//   2. Open it; the provider redirects back to a `zenspend://connect-bank`
//      deep link carrying the connection id (handled by expo-router + useURL).
//   3. POST callback to register the connection, then sync-from-provider to
//      import the transactions (deduplicated server-side).
//
// Manual entry stays the guaranteed core; this is an optional convenience.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { MotionView } from '../src/components/motion';
import { Button, Card } from '../src/components/ui';
import { bankApi } from '../src/api/resources';
import { colors, spacing, fontSize, radius } from '../src/theme';

type Phase = 'idle' | 'connecting' | 'processing' | 'done' | 'error';

const BENEFITS = [
  { icon: 'sync-outline', text: 'Import automatique de vos transactions' },
  { icon: 'lock-closed-outline', text: 'Accès en lecture seule — aucun paiement possible' },
  { icon: 'shield-checkmark-outline', text: 'Connexion sécurisée via votre banque (DSP2)' },
];

export default function ConnectBankScreen() {
  const router = useRouter();
  const incomingUrl = Linking.useURL();

  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);

  // Guard so a given consent return is processed only once.
  const handledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    bankApi
      .status()
      .then((res: any) => setConfigured(Boolean(res?.capabilities?.create_link_session)))
      .catch(() => setConfigured(false));
  }, []);

  const handleConnect = useCallback(async () => {
    setPhase('connecting');
    setMessage(null);
    try {
      const redirectUri = Linking.createURL('connect-bank');
      const res = await bankApi.createLinkSession({
        redirect_uri: redirectUri,
        state: `mobile_${Date.now()}`,
      });
      const linkUrl = res?.link_session?.link_url;
      if (!linkUrl) {
        throw new Error('URL de connexion bancaire introuvable.');
      }
      await Linking.openURL(linkUrl);
      // Stay on this screen; the deep-link return is picked up by `incomingUrl`.
      setPhase('idle');
    } catch (e: any) {
      setPhase('error');
      setMessage(e?.message || 'Impossible de démarrer la connexion bancaire.');
    }
  }, []);

  // Process the consent return (deep link with the connection identifier).
  useEffect(() => {
    if (!incomingUrl) return;

    const { queryParams } = Linking.parse(incomingUrl);
    const externalConnectionId = String(
      queryParams?.external_connection_id || queryParams?.session_id || '',
    );
    if (!externalConnectionId || handledRef.current.has(externalConnectionId)) return;
    handledRef.current.add(externalConnectionId);

    const provider = String(queryParams?.provider || 'mock').toLowerCase();
    const state = String(queryParams?.state || '');

    (async () => {
      setPhase('processing');
      setMessage(null);
      try {
        const callbackRes: any = await bankApi.processCallback({
          external_connection_id: externalConnectionId,
          provider,
          institution_name: `${provider.toUpperCase()}`,
          status: 'connected',
          metadata: { source: 'mobile_redirect', callback_state: state },
          // Accounts are discovered server-side during provider sync; we don't
          // fabricate them here.
          accounts: [],
        });

        const connectionId = callbackRes?.bank_connection?.id;
        if (connectionId) {
          const syncRes: any = await bankApi.syncFromProvider({ connection_id: connectionId });
          const created = syncRes?.sync_result?.created ?? 0;
          setMessage(`Banque connectée. ${created} transaction(s) importée(s).`);
        } else {
          setMessage('Banque connectée.');
        }
        setPhase('done');
      } catch (e: any) {
        setPhase('error');
        setMessage(e?.message || 'Échec de la connexion bancaire.');
      }
    })();
  }, [incomingUrl]);

  const busy = phase === 'connecting' || phase === 'processing';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <MotionView index={0}>
          <ScreenHeader
            eyebrow="Open Banking"
            title="Connecter ma banque"
            subtitle="Importez vos transactions automatiquement, en lecture seule."
            action={
              <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.foreground} />
              </Pressable>
            }
          />
        </MotionView>

        <MotionView index={1}>
          <Card style={styles.benefitsCard}>
            {BENEFITS.map((b) => (
              <View key={b.text} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name={b.icon as any} size={18} color={colors.primary} />
                </View>
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </Card>
        </MotionView>

        {phase === 'done' || phase === 'error' ? (
          <MotionView index={2}>
            <Card style={[styles.statusCard, phase === 'error' ? styles.statusError : styles.statusOk]}>
              <Ionicons
                name={phase === 'error' ? 'alert-circle' : 'checkmark-circle'}
                size={22}
                color={phase === 'error' ? colors.error : colors.success}
              />
              <Text style={styles.statusText}>{message}</Text>
            </Card>
          </MotionView>
        ) : null}

        {configured === false ? (
          <MotionView index={2}>
            <Text style={styles.notice}>
              La connexion bancaire n'est pas encore disponible. Vous pouvez ajouter vos
              transactions manuellement en attendant.
            </Text>
          </MotionView>
        ) : null}

        <MotionView index={3} style={styles.actions}>
          <Button
            title={phase === 'processing' ? 'Import en cours…' : phase === 'done' ? 'Reconnecter une banque' : 'Connecter ma banque'}
            onPress={handleConnect}
            loading={busy}
            disabled={configured === false}
          />
          <Text style={styles.legal}>
            En continuant, vous autorisez ZenSpend à consulter vos comptes en lecture seule.
            Vous pouvez révoquer cet accès à tout moment.
          </Text>
        </MotionView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, flexGrow: 1 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitsCard: { gap: spacing.md, marginBottom: spacing.lg },
  benefitRow: { flexDirection: 'row', alignItems: 'center' },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  benefitText: { flex: 1, fontSize: fontSize.sm, color: colors.foreground, lineHeight: 20 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  statusOk: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  statusError: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  statusText: { flex: 1, fontSize: fontSize.sm, color: colors.foreground },
  notice: {
    fontSize: fontSize.sm,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  actions: { marginTop: 'auto', gap: spacing.md },
  legal: { fontSize: fontSize.xs, color: colors.muted, lineHeight: 18, textAlign: 'center' },
});
