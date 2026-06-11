import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Card, EmptyState, ProgressBar } from '../src/components/ui';
import { useFetch } from '../src/lib/useFetch';
import { debtsApi } from '../src/api/resources';
import { formatCurrency } from '../src/lib/format';
import { useAuth } from '../src/context/AuthContext';
import type { DebtTracker } from '../src/types';
import { colors, spacing, fontSize } from '../src/theme';

export default function DebtsScreen() {
  const { user } = useAuth();
  const currency = user?.preferred_currency || 'EUR';
  const { data, loading, error, refetch } = useFetch<DebtTracker[]>(() => debtsApi.list(), []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ title: 'Dettes', headerShown: true }} />
      <View style={styles.content}>
        <ScreenHeader title="Dettes" subtitle="Suivez vos remboursements" />
        <FlatList
          data={data || []}
          keyExtractor={(d) => String(d.id)}
          onRefresh={refetch}
          refreshing={loading}
          renderItem={({ item }) => {
            const total = parseFloat(item.total_amount) || 0;
            const remaining = parseFloat(item.remaining_amount) || 0;
            const repaid = total > 0 ? (total - remaining) / total : 0;
            return (
              <Card style={styles.card}>
                <View style={styles.header}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.remaining}>{formatCurrency(remaining, currency)}</Text>
                </View>
                <ProgressBar progress={repaid} color={colors.warning} />
                <Text style={styles.meta}>
                  Remboursé {formatCurrency(total - remaining, currency)} sur{' '}
                  {formatCurrency(total, currency)}
                </Text>
              </Card>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          contentContainerStyle={!data?.length && styles.emptyWrap}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                title={error || 'Aucune dette'}
                message={error ? undefined : "Vous n'avez aucune dette enregistrée."}
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
  card: { paddingVertical: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.foreground },
  remaining: { fontSize: fontSize.md, fontWeight: '700', color: colors.warning },
  meta: { fontSize: fontSize.xs, color: colors.muted, marginTop: spacing.sm },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
});
