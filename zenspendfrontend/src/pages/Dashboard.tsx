import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Wallet, Clock, CalendarClock, ArrowUpCircle, ArrowDownCircle, Link2, RefreshCw, HeartHandshake, Rocket, Users, UserPlus } from 'lucide-react';
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

import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useAuth } from '../contexts/AuthContext'
import { UserSegment } from '../types';
import { useUserSegment } from '../hooks/useUserSegment';
import { getDashboardPathForSegment, parseSegmentRouteSlug } from '../lib/segmentRouting';


const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { segmentSlug } = useParams<{ segmentSlug?: string }>();
  const { segment: storedSegment, setSegment } = useUserSegment();
  const {
    user,
    fetchAccounts,
    fetchBudgets,
    fetchMonthlyExpenses,
    fetchTransactions,
    fetchGoals,
    fetchDashboardData,
    fetchBankIntegrationStatus,
    createBankLinkSession,
    processBankConnectionCallback,
    syncBankConnectionFromProvider,
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
  const [bankIntegration, setBankIntegration] = useState<any>(null);
  const [isConnectingBank, setIsConnectingBank] = useState(false);
  const [isProcessingBankCallback, setIsProcessingBankCallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const callbackHandledRef = useRef(false);

  const routeSegment = parseSegmentRouteSlug(segmentSlug);
  const preferredSegment: UserSegment = user?.user_segment || storedSegment;
  const activeSegment: UserSegment = routeSegment || preferredSegment;

  useEffect(() => {
    if (storedSegment !== preferredSegment) {
      setSegment(preferredSegment);
    }
  }, [storedSegment, preferredSegment, setSegment]);

  if (!routeSegment || routeSegment !== preferredSegment) {
    return <Navigate to={getDashboardPathForSegment(preferredSegment)} replace />;
  }

  const hasConnectedBankAccount = accounts.some(account => {
    const details = account?.connection_details || {};
    return Boolean(details.external_connection_id);
  });

  const providerName = String(bankIntegration?.integration?.provider || 'banking').toUpperCase();

  const handleConnectBank = async () => {
    try {
      setIsConnectingBank(true);
      const response = await createBankLinkSession({
        redirect_uri: `${window.location.origin}${location.pathname}`,
        state: `dashboard_${Date.now()}`,
      });

      const linkUrl = response?.link_session?.link_url;
      if (!linkUrl) {
        throw new Error('URL de connexion bancaire introuvable.');
      }

      toast.success('Redirection vers la connexion bancaire...');
      window.location.assign(linkUrl);
    } catch (error: any) {
      toast.error(error?.message || 'Impossible de démarrer la connexion bancaire.');
    } finally {
      setIsConnectingBank(false);
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Dashboard: Fetching data components...');
      const [
        fetchedAccounts,
        fetchedBudgets,
        fetchedMonthlyExpenses,
        fetchedTransactions,
        fetchedGoals,
        fetchedSummary,
        fetchedBankIntegration,
      ] = await Promise.all([
        fetchAccounts().catch(e => { console.error('Accounts fetch failed', e); return []; }),
        fetchBudgets().catch(e => { console.error('Budgets fetch failed', e); return []; }),
        fetchMonthlyExpenses().catch(e => { console.error('Monthly expenses fetch failed', e); return []; }),
        fetchTransactions().catch(e => { console.error('Transactions fetch failed', e); return []; }),
        fetchGoals().catch(e => { console.error('Goals fetch failed', e); return []; }),
        fetchDashboardData().catch(e => { console.error('Summary fetch failed', e); return { totalBalance: 0, monthlyIncome: 0, monthlyExpenses: 0 }; }),
        fetchBankIntegrationStatus().catch(e => {
          console.error('Bank integration status fetch failed', e);
          return null;
        }),
      ]);

      console.log('Dashboard: Data fetched successfully');
      setAccounts(fetchedAccounts || []);
      setBudgets(fetchedBudgets || []);
      setMonthlyExpenses(fetchedMonthlyExpenses || []);
      setTransactions(fetchedTransactions || []);
      setSavingsGoals(fetchedGoals || []);
      setSummary(fetchedSummary || { totalBalance: 0, monthlyIncome: 0, monthlyExpenses: 0 });
      setBankIntegration(fetchedBankIntegration);
    } catch (error) {
      console.error('Error in Dashboard fetchData:', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    fetchAccounts,
    fetchBudgets,
    fetchMonthlyExpenses,
    fetchTransactions,
    fetchGoals,
    fetchDashboardData,
    fetchBankIntegrationStatus,
  ]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  useEffect(() => {
    if (!user || callbackHandledRef.current) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const externalConnectionId = params.get('external_connection_id') || params.get('session_id');
    const hasCallbackHint = params.get('mock_bank_link') === '1' || Boolean(externalConnectionId);

    if (!hasCallbackHint) {
      return;
    }

    if (!externalConnectionId) {
      callbackHandledRef.current = true;
      toast.error('Retour bancaire incomplet: identifiant de connexion manquant.');
      navigate(location.pathname, { replace: true });
      return;
    }

    callbackHandledRef.current = true;

    const provider = String(
      params.get('provider') || bankIntegration?.integration?.provider || 'mock'
    ).toLowerCase();
    const state = params.get('state') || '';
    const accountExternalId = `${externalConnectionId}_main`;

    const processCallback = async () => {
      try {
        setIsProcessingBankCallback(true);

        const callbackResponse = await processBankConnectionCallback({
          external_connection_id: externalConnectionId,
          provider,
          institution_name: `${provider.toUpperCase()} Bank`,
          status: 'connected',
          metadata: {
            source: 'web_redirect',
            callback_state: state,
          },
          accounts: [
            {
              external_account_id: accountExternalId,
              name: 'Compte principal',
              account_type: 'checking',
              currency: 'EUR',
              balance: '1500.00',
            },
          ],
        });

        const connectionId = callbackResponse?.bank_connection?.id;
        if (connectionId) {
          const syncResponse = await syncBankConnectionFromProvider({
            connection_id: connectionId,
          });

          const createdCount = syncResponse?.sync_result?.created || 0;
          toast.success(`Banque connectee et ${createdCount} transaction(s) importee(s).`);
        } else {
          toast.success('Banque connectee.');
        }

        await fetchData();
      } catch (error: any) {
        console.error('Bank callback processing failed:', error);
        toast.error(error?.message || 'La connexion bancaire a echoue.');
      } finally {
        setIsProcessingBankCallback(false);
        navigate(location.pathname, { replace: true });
      }
    };

    processCallback();
  }, [
    user,
    location.search,
    location.pathname,
    navigate,
    bankIntegration?.integration?.provider,
    processBankConnectionCallback,
    syncBankConnectionFromProvider,
    fetchData,
  ]);

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

  const monthlySavingsPotential = Math.max(0, Number(currentMonthIncome) - Number(currentMonthExpenses));
  const totalBudgetAmount = budgets.reduce((acc, budget) => acc + (Number(budget.amount) || 0), 0);
  const totalBudgetSpent = budgets.reduce((acc, budget) => acc + (Number(budget.spent) || 0), 0);
  const budgetUsageRate = totalBudgetAmount > 0 ? Math.round((totalBudgetSpent / totalBudgetAmount) * 100) : 0;
  const connectedAccountsCount = accounts.filter(account => {
    const details = account?.connection_details || {};
    return Boolean(details.external_connection_id);
  }).length;
  const estimatedHouseholdProfiles = Math.max(1, Math.min(6, Math.ceil(accounts.length / 2)));

  const segmentLabels: Record<UserSegment, string> = {
    couples: 'Couples',
    young_professionals: 'Jeunes actifs',
    families: 'Familles',
  };

  const segmentPlaybooks: Record<
    UserSegment,
    {
      title: string;
      subtitle: string;
      icon: React.ReactNode;
      metrics: Array<{ label: string; value: string }>;
      steps: string[];
      primaryActionLabel: string;
      primaryAction: () => void;
    }
  > = {
    couples: {
      title: 'Pilotage couple et budget partage',
      subtitle: 'Cadrez un budget commun tout en gardant la visibilite sur les contributions individuelles.',
      icon: <HeartHandshake size={18} />,
      metrics: [
        { label: 'Budgets actifs', value: String(budgets.length) },
        { label: 'Utilisation budget global', value: `${budgetUsageRate}%` },
        { label: 'Comptes connectes', value: String(connectedAccountsCount) },
      ],
      steps: [
        'Creer un budget menage dedie aux charges communes.',
        'Assigner un objectif commun (voyage, apport, travaux).',
        'Programmer une revue hebdomadaire des ecarts budgetaires.',
      ],
      primaryActionLabel: 'Creer un budget partage',
      primaryAction: () => navigate('/budgets/new'),
    },
    young_professionals: {
      title: 'Acceleration de l epargne des jeunes actifs',
      subtitle: 'Convertissez votre reste a vivre en trajectoire d objectifs mesurables.',
      icon: <Rocket size={18} />,
      metrics: [
        { label: 'Capacite d epargne mensuelle', value: formatCurrency(monthlySavingsPotential) },
        { label: 'Objectifs d epargne', value: String(savingsGoals.length) },
        { label: 'Transactions analysees', value: String(transactions.length) },
      ],
      steps: [
        'Fixer un objectif principal sur 90 jours.',
        'Bloquer un versement automatique en debut de mois.',
        'Rediriger les depenses variables vers votre objectif prioritaire.',
      ],
      primaryActionLabel: 'Ajouter un objectif prioritaire',
      primaryAction: () => navigate('/goals/new'),
    },
    families: {
      title: 'Organisation familiale multi-comptes',
      subtitle: 'Structurez une vue foyer avec plusieurs enveloppes et profils de suivi.',
      icon: <Users size={18} />,
      metrics: [
        { label: 'Comptes suivis', value: String(accounts.length) },
        { label: 'Profils recommandes', value: String(estimatedHouseholdProfiles) },
        { label: 'Objectifs foyer', value: String(savingsGoals.length) },
      ],
      steps: [
        'Distinguer les budgets courses, logement, enfants et loisirs.',
        'Associer chaque depense a une enveloppe familiale.',
        'Mettre en place une revue mensuelle parentale de pilotage.',
      ],
      primaryActionLabel: 'Ajouter un compte du foyer',
      primaryAction: () => navigate('/accounts/new'),
    },
  };

  const activePlaybook = segmentPlaybooks[activeSegment];


  return (
    <div className="py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">Vue d'ensemble</h1>
            <p className="text-muted mt-2 text-lg">Heureux de vous revoir, <span className="font-semibold text-foreground">{user?.first_name || 'Utilisateur'}</span> </p>
          </div>
          <Button leftIcon={<Plus size={18} />} onClick={() => navigate('/transactions/new')} size="lg" className="shadow-md hover:shadow-lg transition-all rounded-full px-6">
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

        {/* Bank Connection */}
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Link2 size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg">Connexion bancaire automatique</CardTitle>
                  <p className="text-sm text-muted mt-1">
                    Provider: <span className="font-medium text-foreground">{providerName}</span>
                  </p>
                  <p className="text-sm text-muted">
                    {hasConnectedBankAccount
                      ? 'Votre synchronisation bancaire est active.'
                      : 'Connectez votre banque pour importer vos opérations automatiquement.'}
                  </p>
                </div>
              </div>

              <Button
                variant={hasConnectedBankAccount ? 'outline' : 'primary'}
                leftIcon={<RefreshCw size={16} />}
                isLoading={isConnectingBank || isProcessingBankCallback}
                onClick={handleConnectBank}
                disabled={bankIntegration?.capabilities?.create_link_session === false || isProcessingBankCallback}
              >
                {hasConnectedBankAccount ? 'Resynchroniser ma banque' : 'Connecter ma banque'}
              </Button>
            </div>
          </CardHeader>
          {bankIntegration?.capabilities?.create_link_session === false && (
            <CardContent>
              <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
                Le provider bancaire n'est pas configuré côté backend. Renseignez les variables BANK_PROVIDER_* puis redémarrez le service backend.
              </div>
            </CardContent>
          )}
        </Card>

        {/* Segment Space */}
        <Card className="mb-8 border-secondary/20">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div>
                <CardTitle className="text-lg">Espace {segmentLabels[activeSegment]}</CardTitle>
                <p className="text-sm text-muted mt-1">
                  Tableau de bord dedie a votre profil financier.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/70 bg-surface p-5">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-primary mb-2">
                    {activePlaybook.icon}
                    <span>{segmentLabels[activeSegment]}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{activePlaybook.title}</h3>
                  <p className="text-sm text-muted mt-1">{activePlaybook.subtitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                {activePlaybook.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-md bg-background p-3 border border-border/60">
                    <p className="text-xs uppercase tracking-wide text-muted">{metric.label}</p>
                    <p className="text-xl font-bold text-foreground mt-1">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-5">
                {activePlaybook.steps.map((step, index) => (
                  <div key={step} className="flex items-start text-sm text-foreground">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-semibold mr-2 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button leftIcon={<UserPlus size={16} />} onClick={activePlaybook.primaryAction}>
                  {activePlaybook.primaryActionLabel}
                </Button>
                <Button variant="outline" onClick={() => navigate('/profile')}>
                  Ajuster mon profil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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