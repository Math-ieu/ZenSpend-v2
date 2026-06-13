import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { MotionView } from '../../src/components/motion';
import { Card, EmptyState, ProgressBar } from '../../src/components/ui';
import { useFetch } from '../../src/lib/useFetch';
import { budgetsApi } from '../../src/api/resources';
import { formatCurrency } from '../../src/lib/format';
import { useAuth } from '../../src/context/AuthContext';
import type { Budget } from '../../src/types';
import { colors, spacing, fontSize, radius } from '../../src/theme';

export default function BudgetsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const currency = user?.preferred_currency || 'EUR';
  const { data, loading, error, refetch } = useFetch<Budget[]>(() => budgetsApi.list(), []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <MotionView index={0}>
          <ScreenHeader
            title="Budgets"
            action={
              <Pressable style={styles.addBtn} onPress={() => router.push('/new-budget')}>
                <Ionicons name="add" size={24} color={colors.white} />
              </Pressable>
            }
          />
        </MotionView>
        <FlatList
          data={data || []}
          keyExtractor={(b) => String(b.id)}
          onRefresh={refetch}
          refreshing={loading}
          renderItem={({ item, index }) => {
            const ratio = item.amount > 0 ? item.spent / item.amount : 0;
            const over = ratio > 1;
            return (
              <MotionView index={Math.min(index, 8)}>
              <Card style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.amounts}>
                    {formatCurrency(item.spent, currency)} / {formatCurrency(item.amount, currency)}
                  </Text>
                </View>
                <ProgressBar progress={ratio} color={over ? colors.error : colors.primary} />
                <Text style={[styles.remaining, over && { color: colors.error }]}>
                  {over
                    ? `Dépassé de ${formatCurrency(item.spent - item.amount, currency)}`
                    : `Reste ${formatCurrency(item.amount - item.spent, currency)}`}
                </Text>
              </Card>
              </MotionView>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          contentContainerStyle={!data?.length && styles.emptyWrap}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                title={error || 'Aucun budget'}
                message={error ? undefined : 'Créez un budget pour maîtriser vos dépenses.'}
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
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetCard: { paddingVertical: spacing.lg },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.foreground },
  amounts: { fontSize: fontSize.sm, color: colors.muted },
  remaining: { fontSize: fontSize.xs, color: colors.muted, marginTop: spacing.sm },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
});
