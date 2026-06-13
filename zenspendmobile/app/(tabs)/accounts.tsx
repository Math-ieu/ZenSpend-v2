import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { MotionView } from '../../src/components/motion';
import { Card, EmptyState } from '../../src/components/ui';
import { useFetch } from '../../src/lib/useFetch';
import { accountsApi } from '../../src/api/resources';
import { formatCurrency } from '../../src/lib/format';
import type { Account } from '../../src/types';
import { colors, spacing, fontSize, radius } from '../../src/theme';

const TYPE_LABELS: Record<string, string> = {
  checking: 'Compte courant',
  savings: 'Épargne',
  credit: 'Crédit',
  investment: 'Investissement',
};

export default function AccountsScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useFetch<Account[]>(() => accountsApi.list(), []);

  const total = (data || []).reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <MotionView index={0}>
          <ScreenHeader
            title="Comptes"
            action={
              <Pressable style={styles.addBtn} onPress={() => router.push('/new-account')}>
                <Ionicons name="add" size={24} color={colors.white} />
              </Pressable>
            }
          />
        </MotionView>
        <FlatList
          data={data || []}
          keyExtractor={(a) => String(a.id)}
          onRefresh={refetch}
          refreshing={loading}
          ListHeaderComponent={
            data && data.length ? (
              <MotionView index={1}>
                <Card style={styles.totalCard}>
                  <Text style={styles.totalLabel}>Patrimoine total</Text>
                  <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                </Card>
              </MotionView>
            ) : null
          }
          renderItem={({ item, index }) => (
            <MotionView index={Math.min(index + 2, 9)}>
            <Card style={styles.accountCard}>
              <View style={styles.accountRow}>
                <View style={styles.iconBubble}>
                  <Ionicons name="card-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.type}>{TYPE_LABELS[item.type] || item.type}</Text>
                </View>
                <Text style={styles.balance}>
                  {formatCurrency(Number(item.balance) || 0, item.currency || 'EUR')}
                </Text>
              </View>
            </Card>
            </MotionView>
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          contentContainerStyle={!data?.length && styles.emptyWrap}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                title={error || 'Aucun compte'}
                message={error ? undefined : 'Ajoutez un compte pour suivre vos soldes.'}
              />
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, padding: spacing.lg },
  flex: { flex: 1 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalCard: { backgroundColor: colors.foreground, borderColor: colors.foreground, marginBottom: spacing.md },
  totalLabel: { color: 'rgba(255,255,255,0.7)', fontSize: fontSize.sm },
  totalValue: { color: colors.white, fontSize: fontSize.xl, fontWeight: '800', marginTop: spacing.xs },
  accountCard: { paddingVertical: spacing.md },
  accountRow: { flexDirection: 'row', alignItems: 'center' },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.foreground },
  type: { fontSize: fontSize.xs, color: colors.muted, marginTop: 2 },
  balance: { fontSize: fontSize.md, fontWeight: '700', color: colors.foreground },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
});
