import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card, EmptyState, ProgressBar } from '../../src/components/ui';
import { useFetch } from '../../src/lib/useFetch';
import { dashboardApi } from '../../src/api/resources';
import { formatCurrency } from '../../src/lib/format';
import { useAuth } from '../../src/context/AuthContext';
import { colors, spacing, fontSize } from '../../src/theme';

interface CategoryDist {
  labels: string[];
  data: number[];
  colors: string[];
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const currency = user?.preferred_currency || 'EUR';

  const summary = useFetch(() => dashboardApi.summary(), []);
  const categories = useFetch(() => dashboardApi.categoryDistribution(), []);

  const s: any = summary.data || {};
  const cat = (categories.data as CategoryDist) || { labels: [], data: [], colors: [] };
  const catTotal = cat.data?.reduce((a, b) => a + b, 0) || 0;

  const refreshing = summary.loading || categories.loading;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              summary.refetch();
              categories.refetch();
            }}
          />
        }
      >
        <ScreenHeader
          title={`Bonjour${user?.first_name ? `, ${user.first_name}` : ''}`}
          subtitle="Voici votre situation financière"
        />

        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Solde total</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(Number(s.totalBalance) || 0, s.currency || currency)}
          </Text>
        </Card>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={styles.statIconRow}>
              <Ionicons name="arrow-down-circle" size={20} color={colors.success} />
              <Text style={styles.statLabel}>Revenus (mois)</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {formatCurrency(Number(s.monthlyIncome) || 0, s.currency || currency)}
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statIconRow}>
              <Ionicons name="arrow-up-circle" size={20} color={colors.error} />
              <Text style={styles.statLabel}>Dépenses (mois)</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.error }]}>
              {formatCurrency(Number(s.monthlyExpenses) || 0, s.currency || currency)}
            </Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Dépenses par catégorie</Text>
        <Card>
          {summary.error ? (
            <Text style={styles.error}>{summary.error}</Text>
          ) : cat.labels?.length ? (
            cat.labels.map((label, i) => {
              const value = cat.data[i] || 0;
              const ratio = catTotal > 0 ? value / catTotal : 0;
              return (
                <View key={`${label}-${i}`} style={styles.catRow}>
                  <View style={styles.catHeader}>
                    <Text style={styles.catName}>{label}</Text>
                    <Text style={styles.catValue}>
                      {formatCurrency(value, s.currency || currency)}
                    </Text>
                  </View>
                  <ProgressBar progress={ratio} color={cat.colors[i] || colors.primary} />
                </View>
              );
            })
          ) : (
            <EmptyState
              title="Aucune dépense ce mois-ci"
              message="Ajoutez des transactions pour voir la répartition."
            />
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  balanceCard: { backgroundColor: colors.primary, borderColor: colors.primary, marginBottom: spacing.lg },
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: fontSize.sm },
  balanceValue: { color: colors.white, fontSize: fontSize.xxl, fontWeight: '800', marginTop: spacing.xs },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statCard: { flex: 1 },
  statIconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  statLabel: { fontSize: fontSize.xs, color: colors.muted },
  statValue: { fontSize: fontSize.lg, fontWeight: '800' },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.foreground, marginBottom: spacing.md },
  catRow: { marginBottom: spacing.md },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  catName: { fontSize: fontSize.sm, color: colors.foreground, fontWeight: '600' },
  catValue: { fontSize: fontSize.sm, color: colors.muted },
  error: { color: colors.error, fontSize: fontSize.sm },
});
