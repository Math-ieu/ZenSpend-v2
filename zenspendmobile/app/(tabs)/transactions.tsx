import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { EmptyState } from '../../src/components/ui';
import { useFetch } from '../../src/lib/useFetch';
import { transactionsApi } from '../../src/api/resources';
import { formatCurrency, formatDate } from '../../src/lib/format';
import { useAuth } from '../../src/context/AuthContext';
import type { Transaction } from '../../src/types';
import { colors, spacing, fontSize, radius } from '../../src/theme';

export default function TransactionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const currency = user?.preferred_currency || 'EUR';
  const { data, loading, error, refetch } = useFetch<Transaction[]>(
    () => transactionsApi.list(),
    [],
  );

  const renderItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'income';
    return (
      <View style={styles.row}>
        <View style={[styles.iconBubble, { backgroundColor: isIncome ? '#DCFCE7' : '#FEE2E2' }]}>
          <Ionicons
            name={isIncome ? 'arrow-down' : 'arrow-up'}
            size={18}
            color={isIncome ? colors.success : colors.error}
          />
        </View>
        <View style={styles.flex}>
          <Text style={styles.desc} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.meta}>
            {item.category || 'Sans catégorie'} · {formatDate(item.date)}
          </Text>
        </View>
        <Text style={[styles.amount, { color: isIncome ? colors.success : colors.error }]}>
          {isIncome ? '+' : '-'}
          {formatCurrency(item.amount, currency)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <ScreenHeader
          title="Transactions"
          action={
            <Pressable style={styles.addBtn} onPress={() => router.push('/new-transaction')}>
              <Ionicons name="add" size={24} color={colors.white} />
            </Pressable>
          }
        />
        <FlatList
          data={data || []}
          keyExtractor={(t) => String(t.id)}
          renderItem={renderItem}
          onRefresh={refetch}
          refreshing={loading}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={!data?.length && styles.emptyWrap}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                title={error || 'Aucune transaction'}
                message={error ? undefined : 'Appuyez sur + pour ajouter votre première transaction.'}
              />
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  desc: { fontSize: fontSize.md, fontWeight: '600', color: colors.foreground },
  meta: { fontSize: fontSize.xs, color: colors.muted, marginTop: 2 },
  amount: { fontSize: fontSize.md, fontWeight: '700' },
  sep: { height: 1, backgroundColor: colors.border },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
});
