import React, { useEffect, useState } from 'react';
import { Plus, Wallet, Clock, CalendarClock, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import AccountCard, { AddAccountCard } from '../components/dashboard/AccountCard';
import BudgetCard from '../components/dashboard/BudgetCard';
import SavingsGoalCard from '../components/dashboard/SavingsGoalCard';
import TransactionsList from '../components/dashboard/TransactionsList';
import ExpenseChart from '../components/dashboard/ExpenseChart';
import CategoryChart from '../components/dashboard/CategoryChart';
import FeatureGate from '../components/subscription/FeatureGate';
import UsageLimits from '../components/subscription/UsageLimits';
import { formatCurrency } from '../lib/utils';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext'


const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    fetchAccounts,
    fetchBudgets,
    fetchMonthlyExpenses,
    fetchTransactions,
    fetchGoals,
    fetchDashboardData,
  } = useAuth();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log('Dashboard: Fetching data components...');
        const [
          fetchedAccounts,
          fetchedBudgets,
          fetchedMonthlyExpenses,
          fetchedTransactions,
          fetchedGoals,
          fetchedSummary
        ] = await Promise.all([
          fetchAccounts().catch(e => { console.error('Accounts fetch failed', e); return []; }),
          fetchBudgets().catch(e => { console.error('Budgets fetch failed', e); return []; }),
          fetchMonthlyExpenses().catch(e => { console.error('Monthly expenses fetch failed', e); return []; }),
          fetchTransactions().catch(e => { console.error('Transactions fetch failed', e); return []; }),
          fetchGoals().catch(e => { console.error('Goals fetch failed', e); return []; }),
          fetchDashboardData().catch(e => { console.error('Summary fetch failed', e); return { totalBalance: 0, monthlyIncome: 0, monthlyExpenses: 0 }; })
        ]);

        console.log('Dashboard: Data fetched successfully');
        setAccounts(fetchedAccounts || []);
        setBudgets(fetchedBudgets || []);
        setMonthlyExpenses(fetchedMonthlyExpenses || []);
        setTransactions(fetchedTransactions || []);
        setSavingsGoals(fetchedGoals || []);
        setSummary(fetchedSummary || { totalBalance: 0, monthlyIncome: 0, monthlyExpenses: 0 });
      } catch (error) {
        console.error('Error in Dashboard fetchData:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, fetchAccounts, fetchBudgets, fetchMonthlyExpenses, fetchTransactions, fetchGoals, fetchDashboardData]);

  if (!user) {
    return <div className="text-center py-8">Veuillez vous connecter pour accéder à votre tableau de bord.</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const {
    totalBalance = 0,
    monthlyIncome: currentMonthIncome = 0,
    monthlyExpenses: currentMonthExpenses = 0
  } = summary || {};


  return (
    <div className="py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-muted">Bienvenue sur votre espace personnel ZenSpend</p>
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={() => navigate('/transactions/new')}>
            Nouvelle transaction
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                  <Wallet size={20} />
                </div>
                <div>
                  <CardTitle className="text-base">Solde total</CardTitle>
                  <p className={`text-2xl font-bold ${totalBalance < 0 ? 'text-error' : 'text-foreground'}`}>
                    {formatCurrency(totalBalance)}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success mr-3">
                  <ArrowUpCircle size={20} />
                </div>
                <div>
                  <CardTitle className="text-base">Revenus (ce mois)</CardTitle>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(currentMonthIncome)}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-error/10 flex items-center justify-center text-error mr-3">
                  <ArrowDownCircle size={20} />
                </div>
                <div>
                  <CardTitle className="text-base">Dépenses (ce mois)</CardTitle>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(currentMonthExpenses)}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Aperçu financier</CardTitle>
                  <FeatureGate feature="canAccessAdvancedReports" showUpgrade={false}>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full">Par mois</button>
                      <button className="px-3 py-1 text-xs text-muted hover:bg-surface rounded-full">Par année</button>
                    </div>
                  </FeatureGate>
                </div>
              </CardHeader>
              <CardContent>
                <ExpenseChart data={monthlyExpenses} />
              </CardContent>
            </Card>

            {/* Accounts Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-foreground">Vos comptes</h2>
                <Button variant="outline" size="sm" leftIcon={<Plus size={16} />} onClick={() => navigate('/accounts/new')}>
                  Ajouter
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map(account => (
                  <AccountCard key={account.id} account={account} onClick={() => navigate(`/accounts/${account.id}`)} />
                ))}
                <AddAccountCard onClick={() => navigate('/accounts/new')} />
              </div>
            </div>

            {/* Budgets Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-foreground">Budgets</h2>
                <Button variant="outline" size="sm" leftIcon={<Plus size={16} />} onClick={() => navigate('/budgets/new')}>
                  Créer
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {budgets.slice(0, 4).map(budget => (
                  <BudgetCard key={budget.id} budget={budget} onClick={() => navigate(`/budgets/${budget.id}`)} />
                ))}
              </div>
            </div>

            {/* Savings Goals */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-foreground">Objectifs d'épargne</h2>
                <Button variant="outline" size="sm" leftIcon={<Plus size={16} />} onClick={() => navigate('/goals/new')}>
                  Ajouter
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savingsGoals.map(goal => (
                  <SavingsGoalCard key={goal.id} goal={goal} onClick={() => navigate(`/goals/${goal.id}`)} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Usage Limits */}
            <UsageLimits type="accounts" currentCount={accounts.length} label="Comptes" />
            <UsageLimits type="budgets" currentCount={budgets.length} label="Budgets" />
            <UsageLimits type="goals" currentCount={savingsGoals.length} label="Objectifs" />

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Transactions récentes</CardTitle>
                  <Button variant="link" onClick={() => navigate('/transactions')}>
                    Voir tout
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TransactionsList
                  transactions={transactions.slice(0, 5)}
                  onViewAllClick={() => navigate('/transactions')}
                />
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition des dépenses</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryChart />
              </CardContent>
            </Card>

            {/* Upcoming Bills */}
            <Card>
              <CardHeader>
                <CardTitle>Prochaines échéances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-surface rounded-md">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center text-warning mr-3">
                        <Clock size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Loyer</h3>
                        <p className="text-xs text-muted">Échéance le 5 avril</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      850,00 €
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-surface rounded-md">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center text-warning mr-3">
                        <CalendarClock size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Électricité</h3>
                        <p className="text-xs text-muted">Échéance le 15 avril</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      75,00 €
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-surface rounded-md">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center text-warning mr-3">
                        <CalendarClock size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Abonnement Internet</h3>
                        <p className="text-xs text-muted">Échéance le 22 avril</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      39,99 €
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;