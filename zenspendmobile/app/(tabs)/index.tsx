import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Avatar, Card, EmptyState, ProgressBar } from '../../src/components/ui';
import { DonutChart } from '../../src/components/DonutChart';
import { useFetch } from '../../src/lib/useFetch';
import { dashboardApi, accountsApi, transactionsApi } from '../../src/api/resources';
import { formatCurrency, formatDate } from '../../src/lib/format';
import { useAuth } from '../../src/context/AuthContext';
import { colors, spacing, fontSize, radius } from '../../src/theme';
import type { Account, Transaction } from '../../src/types';

interface CategoryDist {
  labels: string[];
  data: number[];
  colors: string[];
}

const QUICK_ACTIONS = [
  { label: 'Transaction', icon: 'swap-horizontal' as const, route: '/new-transaction' },
  { label: 'Budget', icon: 'pie-chart' as const, route: '/new-budget' },
  { label: 'Objectif', icon: 'flag' as const, route: '/new-goal' },
  { label: 'Compte', icon: 'wallet' as const, route: '/new-account' },
];

const ACCOUNT_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  checking: { label: 'Compte courant', icon: 'card' },
  savings: { label: 'Épargne', icon: 'wallet' },
  credit: { label: 'Crédit', icon: 'card-outline' },
  investment: { label: 'Investissement', icon: 'trending-up' },
};

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Logement: 'home',
  Alimentation: 'cart',
  Transport: 'car',
  Loisirs: 'game-controller',
  Santé: 'medkit',
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const currency = user?.preferred_currency || 'EUR';
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const summary = useFetch(() => dashboardApi.summary(), []);
  const categories = useFetch(() => dashboardApi.categoryDistribution(), []);
  const accounts = useFetch(() => accountsApi.list(), []);
  const transactions = useFetch(() => transactionsApi.list(), []);

  const s: any = summary.data || {};
  const cat = (categories.data as CategoryDist) || { labels: [], data: [], colors: [] };
  const catTotal = cat.data?.reduce((a, b) => a + b, 0) || 0;
  const accountList = (accounts.data as Account[]) || [];
  const recentTx = ((transactions.data as Transaction[]) || [])
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

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
              accounts.refetch();
              transactions.refetch();
            }}
          />
        }
      >
        <ScreenHeader
          eyebrow={today}
          title={`Bonjour${user?.first_name ? `, ${user.first_name}` : ''}`}
          subtitle="Voici votre situation financière"
          action={
            <Avatar name={fullName} uri={user?.avatar} onPress={() => router.push('/profile')} />
          }
        />

        {/* Solde total */}
        <Card style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <Text style={styles.balanceLabel}>Solde total</Text>
            <View style={styles.balanceIcon}>
              <Ionicons name="wallet-outline" size={18} color={colors.white} />
            </View>
          </View>
          <Text style={styles.balanceValue}>
            {formatCurrency(Number(s.totalBalance) || 0, s.currency || currency)}
          </Text>
          {s.savingsRate != null ? (
            <View style={styles.savingsChip}>
              <Ionicons name="trending-up" size={14} color={colors.white} />
              <Text style={styles.savingsText}>
                {Math.round(Number(s.savingsRate) * 100)}% d'épargne ce mois
              </Text>
            </View>
          ) : null}
        </Card>

        {/* Actions rapides */}
        <View style={styles.actionsRow}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable
              key={a.route}
              style={styles.action}
              onPress={() => router.push(a.route as any)}
            >
              <View style={styles.actionIcon}>
                <Ionicons name={a.icon} size={22} color={colors.primary} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Revenus / Dépenses */}
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

        {/* Carrousel de comptes */}
        {accountList.length > 0 ? (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Mes comptes</Text>
              <Pressable onPress={() => router.push('/accounts')}>
                <Text style={styles.link}>Voir tout</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
            >
              {accountList.map((acc) => {
                const meta = ACCOUNT_META[acc.type] || { label: acc.type, icon: 'wallet' as const };
                return (
                  <View key={acc.id} style={styles.accountCard}>
                    <View style={styles.accountIcon}>
                      <Ionicons name={meta.icon} size={18} color={colors.primary} />
                    </View>
                    <Text style={styles.accountName} numberOfLines={1}>
                      {acc.name}
                    </Text>
                    <Text style={styles.accountType}>{meta.label}</Text>
                    <Text style={styles.accountBalance}>
                      {formatCurrency(acc.balance, acc.currency || currency)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </>
        ) : null}

        {/* Transactions récentes */}
        {recentTx.length > 0 ? (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Transactions récentes</Text>
              <Pressable onPress={() => router.push('/transactions')}>
                <Text style={styles.link}>Voir tout</Text>
              </Pressable>
            </View>
            <Card>
              {recentTx.map((tx, i) => {
                const income = tx.type === 'income';
                return (
                  <View
                    key={tx.id}
                    style={[styles.txRow, i < recentTx.length - 1 && styles.txDivider]}
                  >
                    <View style={styles.txIcon}>
                      <Ionicons
                        name={CATEGORY_ICONS[tx.category] || 'pricetag'}
                        size={18}
                        color={colors.muted}
                      />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.txDesc} numberOfLines={1}>
                        {tx.description}
                      </Text>
                      <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: income ? colors.success : colors.foreground }]}>
                      {income ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </Text>
                  </View>
                );
              })}
            </Card>
          </>
        ) : null}

        {/* Dépenses par catégorie (donut) */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Dépenses par catégorie</Text>
        <Card>
          {summary.error ? (
            <Text style={styles.error}>{summary.error}</Text>
          ) : cat.labels?.length ? (
            <View style={styles.donutWrap}>
              <DonutChart data={cat.data} colors={cat.colors}>
                <Text style={styles.donutTotal}>{formatCurrency(catTotal, s.currency || currency)}</Text>
                <Text style={styles.donutCaption}>ce mois</Text>
              </DonutChart>
              <View style={styles.legend}>
                {cat.labels.map((label, i) => (
                  <View key={`${label}-${i}`} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: cat.colors[i] || colors.primary }]} />
                    <Text style={styles.legendLabel} numberOfLines={1}>
                      {label}
                    </Text>
                    <Text style={styles.legendValue}>
                      {formatCurrency(cat.data[i] || 0, s.currency || currency)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
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
  flex: { flex: 1 },

  balanceCard: { backgroundColor: colors.primary, borderColor: colors.primary, marginBottom: spacing.lg },
  balanceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: fontSize.sm },
  balanceIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceValue: { color: colors.white, fontSize: fontSize.xxl, fontWeight: '800', marginTop: spacing.xs },
  savingsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: spacing.md,
  },
  savingsText: { color: colors.white, fontSize: fontSize.xs, fontWeight: '600' },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  action: { alignItems: 'center', flex: 1 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: '#FFF1E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  actionLabel: { fontSize: fontSize.xs, color: colors.foreground, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statCard: { flex: 1 },
  statIconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  statLabel: { fontSize: fontSize.xs, color: colors.muted },
  statValue: { fontSize: fontSize.lg, fontWeight: '800' },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.foreground, marginBottom: spacing.md },
  link: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },

  carousel: { gap: spacing.md, paddingRight: spacing.lg, marginBottom: spacing.lg },
  accountCard: {
    width: 150,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: '#FFF1E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  accountName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.foreground },
  accountType: { fontSize: fontSize.xs, color: colors.muted, marginBottom: spacing.sm },
  accountBalance: { fontSize: fontSize.md, fontWeight: '800', color: colors.foreground },

  txRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  txDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txDesc: { fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground },
  txDate: { fontSize: fontSize.xs, color: colors.muted, marginTop: 2 },
  txAmount: { fontSize: fontSize.sm, fontWeight: '700' },

  donutWrap: { alignItems: 'center', gap: spacing.lg },
  donutTotal: { fontSize: fontSize.lg, fontWeight: '800', color: colors.foreground },
  donutCaption: { fontSize: fontSize.xs, color: colors.muted },
  legend: { alignSelf: 'stretch', gap: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: fontSize.sm, color: colors.foreground },
  legendValue: { fontSize: fontSize.sm, color: colors.muted, fontWeight: '600' },

  error: { color: colors.error, fontSize: fontSize.sm },
});
