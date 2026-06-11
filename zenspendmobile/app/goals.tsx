import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Card, EmptyState, ProgressBar } from '../src/components/ui';
import { useFetch } from '../src/lib/useFetch';
import { goalsApi } from '../src/api/resources';
import { formatCurrency, formatDate } from '../src/lib/format';
import { useAuth } from '../src/context/AuthContext';
import type { SavingsGoal } from '../src/types';
import { colors, spacing, fontSize, radius } from '../src/theme';

export default function GoalsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const currency = user?.preferred_currency || 'EUR';
  const { data, loading, error, refetch } = useFetch<SavingsGoal[]>(() => goalsApi.list(), []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ title: 'Objectifs', headerShown: true }} />
      <View style={styles.content}>
        <ScreenHeader
          title="Objectifs"
          action={
            <Pressable style={styles.addBtn} onPress={() => router.push('/new-goal')}>
              <Ionicons name="add" size={24} color={colors.white} />
            </Pressable>
          }
        />
        <FlatList
          data={data || []}
          keyExtractor={(g) => String(g.id)}
          onRefresh={refetch}
          refreshing={loading}
          renderItem={({ item }) => {
            const ratio = item.targetAmount > 0 ? item.currentAmount / item.targetAmount : 0;
            return (
              <Card style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.pct}>{Math.round(ratio * 100)}%</Text>
                </View>
                <ProgressBar progress={ratio} color={colors.secondary} />
                <View style={styles.goalFooter}>
                  <Text style={styles.amounts}>
                    {formatCurrency(item.currentAmount, currency)} /{' '}
                    {formatCurrency(item.targetAmount, currency)}
                  </Text>
                  {item.targetDate ? (
                    <Text style={styles.date}>Échéance {formatDate(item.targetDate)}</Text>
                  ) : null}
                </View>
              </Card>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          contentContainerStyle={!data?.length && styles.emptyWrap}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                title={error || 'Aucun objectif'}
                message={error ? undefined : "Définissez un objectif d'épargne à atteindre."}
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
  goalCard: { paddingVertical: spacing.lg },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.foreground },
  pct: { fontSize: fontSize.sm, fontWeight: '700', color: colors.secondary },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  amounts: { fontSize: fontSize.sm, color: colors.muted },
  date: { fontSize: fontSize.xs, color: colors.muted },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
});
