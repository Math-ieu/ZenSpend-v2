import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  Plus, Wallet, Clock, CalendarClock, ArrowUpCircle, ArrowDownCircle, 
  Link2, RefreshCw, HeartHandshake, Rocket, Users, UserPlus, 
  TrendingUp, ShieldCheck, CheckCircle2, ChevronRight, Activity, CreditCard,
  Calendar, AlertTriangle
} from 'lucide-react';

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
import Modal from '../components/ui/Modal';
import TransactionForm from '../components/forms/TransactionForm';
import AccountForm from '../components/forms/AccountForm';
import BudgetForm from '../components/forms/BudgetForm';
import GoalForm from '../components/forms/GoalForm';
import { formatCurrency } from '../lib/utils';
import { useCurrency } from '../contexts/CurrencyContext';

import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useAuth } from '../contexts/AuthContext'
import { UserSegment } from '../types';
import { useUserSegment } from '../hooks/useUserSegment';
import { getDashboardPathForSegment, parseSegmentRouteSlug } from '../lib/segmentRouting';


const Dashboard: React.FC = () => {
  const { currency } = useCurrency();
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
    fetchCategories,
    createAccount,
    createBudget,
    createGoal,
    createTransaction
  } = useAuth();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  });
  const [bankIntegration, setBankIntegration] = useState<any>(null);
  const [isConnectingBank, setIsConnectingBank] = useState(false);
  const [isProcessingBankCallback, setIsProcessingBankCallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<'transaction' | 'account' | 'budget' | 'goal' | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [selectedChartCategory, setSelectedChartCategory] = useState<string | null>(null);
  const [selectedChartMonth, setSelectedChartMonth] = useState<string | null>(null);

  useEffect(() => {
    if (activeModal === null) {
      setIsFormDirty(false);
    }
  }, [activeModal]);

  const historicalAverages = React.useMemo(() => {
    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === 'expense' && t.category) {
        totals[t.category] = (totals[t.category] || 0) + parseFloat(t.amount);
        counts[t.category] = (counts[t.category] || 0) + 1;
      }
    });
    const averages: Record<string, number> = {};
    Object.keys(totals).forEach(cat => {
      averages[cat] = totals[cat] / Math.max(1, counts[cat]);
    });
    const defaults: Record<string, number> = {
      'Alimentation': 120.00,
      'Transport': 45.00,
      'Logement': 650.00,
      'Loisirs': 60.00,
      'Santé': 30.00,
      'Factures': 85.00,
      'Abonnements': 15.00,
      'Autres': 50.00
    };
    return { ...defaults, ...averages };
  }, [transactions]);

  const filteredDashboardTransactions = React.useMemo(() => {
    let result = [...transactions];
    if (selectedChartCategory) {
      result = result.filter(t => {
        const catName = t.category_name || t.category?.name || t.category || 'Autres';
        return catName.toLowerCase() === selectedChartCategory.toLowerCase();
      });
    }
    if (selectedChartMonth) {
      const monthsFrench: Record<string, string> = {
        '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
        '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
        '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
      };
      result = result.filter(t => {
        if (!t.date) return false;
        const parts = t.date.split('-');
        const monthNum = parts[1];
        return monthsFrench[monthNum] === selectedChartMonth;
      });
    }
    return result;
  }, [transactions, selectedChartCategory, selectedChartMonth]);

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
        fetchedCategories,
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
        fetchCategories().catch(e => { console.error('Categories fetch failed', e); return []; }),
      ]);

      console.log('Dashboard: Data fetched successfully');
      setAccounts(fetchedAccounts || []);
      setBudgets(fetchedBudgets || []);
      setMonthlyExpenses(fetchedMonthlyExpenses || []);
      setTransactions(fetchedTransactions || []);
      setSavingsGoals(fetchedGoals || []);
      setSummary(fetchedSummary || { totalBalance: 0, monthlyIncome: 0, monthlyExpenses: 0 });
      setBankIntegration(fetchedBankIntegration);
      setAllCategories(fetchedCategories || []);
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
    fetchCategories,
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
      primaryAction: () => setActiveModal('budget'),
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
      primaryAction: () => setActiveModal('goal'),
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
      primaryAction: () => setActiveModal('account'),
    },
  };

  const activePlaybook = segmentPlaybooks[activeSegment];

  const categoryOptions = allCategories.map((cat: any) => ({
    value: cat.id,
    label: cat.name
  }));

  const transactionCategoryOptions = allCategories.map((cat: any) => ({
    value: cat.id,
    label: cat.name
  }));

  const transactionAccountOptions = accounts.map((acc: any) => ({
    value: acc.id,
    label: acc.name
  }));



  const handleCreateAccountSubmit = async (values: any, { setSubmitting, resetForm }: any) => {
    try {
      const accountData = {
        name: values.name,
        account_type: values.type,
        balance: values.balance,
        currency: values.currency,
        account_number: values.accountNumber,
        institution: values.institution,
        user: user.id
      };
      await createAccount(accountData);
      toast.success('Compte créé avec succès');
      setActiveModal(null);
      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Erreur lors de la création du compte');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBudgetSubmit = async (values: any, { setSubmitting, resetForm }: any) => {
    try {
      const budgetData = {
        name: values.name,
        amount: values.amount,
        start_date: values.startDate.toISOString(),
        end_date: values.endDate.toISOString(),
        alert_threshold: values.alertThreshold,
        is_recurring: values.isRecurring,
        categories: [values.category],
        user: user.id,
        accounts: []
      };
      await createBudget(budgetData);
      toast.success('Budget créé avec succès');
      setActiveModal(null);
      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Error creating budget:', error);
      toast.error('Erreur lors de la création du budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateGoalSubmit = async (values: any, { setSubmitting, resetForm }: any) => {
    try {
      const goalData = {
        name: values.name,
        target_amount: values.targetAmount,
        current_amount: values.initialAmount || 0,
        deadline: values.targetDate.toISOString(),
        auto_save: values.automaticSaving,
        auto_save_frequency: values.savingFrequency || null,
        auto_save_amount: values.savingAmount || 0,
        notes: values.notes,
        user: user.id
      };
      await createGoal(goalData);
      toast.success('Objectif créé avec succès');
      setActiveModal(null);
      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Erreur lors de la création de l\'objectif');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTransactionSubmit = async (values: any) => {
    const transactionData = {
      amount: values.type === 'expense' ? -Math.abs(parseFloat(values.amount)) : Math.abs(parseFloat(values.amount)),
      description: values.description,
      date: values.date.toISOString(),
      category: values.category,
      account: values.account,
      type: values.type,
      tags: values.tags,
      is_recurring: values.isRecurring,
      recurring_frequency: values.recurringFrequency || null,
      recurring_end_date: values.recurringEndDate ? values.recurringEndDate.toISOString() : null,
      notes: values.notes,
      status: values.status,
      user: user.id
    };
    await createTransaction(transactionData);
    setActiveModal(null);
    await fetchData();
  };


  return (
    <div className="py-8 bg-background/50 min-h-screen">
      <div className="w-full max-w-[1600px] px-4 sm:px-6 md:px-8 xl:px-12 mx-auto animate-fade-in">
        {/* Header Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold mb-2">
              <Activity size={12} className="animate-pulse" />
              <span>Tableau de bord intelligent</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">Vue d'ensemble</h1>
            <p className="text-muted mt-1 text-base">
              Heureux de vous revoir, <span className="font-semibold text-primary">{user?.first_name || 'Utilisateur'}</span>
            </p>
          </div>
          <Button 
            leftIcon={<Plus size={18} />} 
            onClick={() => setActiveModal('transaction')} 
            size="lg" 
            className="shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all rounded-full px-6 bg-gradient-to-r from-primary to-primary-light text-white font-bold"
          >
            Nouvelle transaction
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Solde Total Card (Style Carte Bancaire Virtuelle) */}
          <div className="hologram-card rounded-2xl p-6 text-white shadow-xl glow-primary border border-white/10 relative overflow-hidden transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-2">
                <Wallet className="h-6 w-6 text-primary-light" />
                <span className="text-xs uppercase tracking-widest text-slate-300 font-semibold">Portefeuille</span>
              </div>
              {/* Puce dorée simulée */}
              <div className="w-8 h-6 bg-gradient-to-br from-amber-400 to-amber-200 rounded-md opacity-90 flex items-center justify-center border border-amber-600/30 shadow-inner">
                <div className="w-6 h-4 border border-amber-700/20 rounded-sm"></div>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Solde total</p>
            <h3 className={`text-3xl font-extrabold tracking-tight mt-1 mb-6 ${totalBalance < 0 ? 'text-error' : 'text-white'}`}>
              {formatCurrency(totalBalance)}
            </h3>
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span className="font-semibold">{user?.first_name} {user?.last_name || ''}</span>
              <span className="font-mono text-slate-400">•••• {accounts.length > 0 ? String(accounts[0].id).slice(-4) : '2026'}</span>
            </div>
          </div>

          {/* Revenus Card (Style Epuré Glassmorphic) */}
          <div className="glass-card rounded-2xl p-6 border border-border/40 hover:border-success/30 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-md glow-success flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                <ArrowUpCircle size={20} className="animate-pulse" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-success/10 text-success flex items-center gap-1">
                <TrendingUp size={12} />
                +12% ce mois
              </span>
            </div>
            <div>
              <p className="text-xs text-muted font-semibold uppercase tracking-wider">Revenus (ce mois)</p>
              <p className="text-3xl font-extrabold text-foreground mt-1 tracking-tight">
                {formatCurrency(currentMonthIncome)}
              </p>
            </div>
          </div>

          {/* Depenses Card (Style Epuré Glassmorphic) */}
          <div className="glass-card rounded-2xl p-6 border border-border/40 hover:border-error/30 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-md flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <div className="h-10 w-10 rounded-xl bg-error/10 flex items-center justify-center text-error">
                <ArrowDownCircle size={20} />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-error/10 text-error">
                Budgetisé
              </span>
            </div>
            <div>
              <p className="text-xs text-muted font-semibold uppercase tracking-wider">Dépenses (ce mois)</p>
              <p className="text-3xl font-extrabold text-foreground mt-1 tracking-tight">
                {formatCurrency(currentMonthExpenses)}
              </p>
            </div>
          </div>
        </div>

        {/* ==================== ZONE 1: TRESORERIE (TOP) ==================== */}
        <div className="space-y-6 mb-10">
          {/* Accounts Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
                <h2 className="text-xl font-bold text-foreground">Vos comptes</h2>
              </div>
              <Button variant="outline" size="sm" leftIcon={<Plus size={16} />} onClick={() => setActiveModal('account')} className="rounded-lg text-foreground">
                Ajouter
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {accounts.map(account => (
                <AccountCard key={account.id} account={account} onClick={() => navigate(`/accounts/${account.id}`)} />
              ))}
              <AddAccountCard onClick={() => setActiveModal('account')} />
            </div>
          </div>

          {/* Bank Connection */}
          <div className="glass-card border border-border/40 rounded-2xl p-6 relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center shadow-md">
                  <Link2 size={22} className="rotate-45" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg font-bold text-foreground">Connexion bancaire automatique</h3>
                    {hasConnectedBankAccount ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-success/15 text-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping"></span>
                        Synchronisé
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-muted/20 text-muted">
                        Non connecté
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-1 flex items-center gap-1 flex-wrap">
                    Sécurité de niveau bancaire : 
                    <span className="font-semibold text-foreground flex items-center gap-0.5 text-[11px] bg-background/50 px-2 py-0.5 rounded border border-border/40">
                      <ShieldCheck size={13} className="text-primary mr-0.5" /> Chiffrement AES-256 & DSP2
                    </span>
                  </p>
                  <p className="text-sm text-muted mt-2">
                    {hasConnectedBankAccount
                      ? `Votre synchronisation bancaire est active (Provider : ${providerName}). Vos opérations sont actualisées en arrière-plan.`
                      : 'Connectez votre établissement financier pour importer automatiquement vos transactions en temps réel.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  variant={hasConnectedBankAccount ? 'outline' : 'primary'}
                  leftIcon={<RefreshCw size={16} className={isConnectingBank || isProcessingBankCallback ? 'animate-spin' : ''} />}
                  isLoading={isConnectingBank || isProcessingBankCallback}
                  onClick={handleConnectBank}
                  disabled={bankIntegration?.capabilities?.create_link_session === false || isProcessingBankCallback}
                  className="shadow-sm font-semibold rounded-xl hover:scale-[1.02] transition-transform duration-200 py-2.5 text-foreground"
                >
                  {hasConnectedBankAccount ? 'Resynchroniser mes comptes' : 'Connecter ma banque'}
                </Button>
              </div>
            </div>
            {bankIntegration?.capabilities?.create_link_session === false && (
              <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-xs text-foreground flex items-center gap-2">
                <Activity size={14} className="text-warning" />
                <span>Le provider bancaire n'est pas configuré côté backend. Renseignez les variables <code>BANK_PROVIDER_*</code> puis redémarrez le service backend.</span>
              </div>
            )}
          </div>
        </div>

        {/* ==================== ZONE 2: ANALYTIQUE (MILIEU) ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Grand graphique d'évolution */}
          <div className="lg:col-span-2 glass-card rounded-2xl border border-border/40 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="p-6 pb-3 border-b border-border/30 flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                <h3 className="font-bold text-lg text-foreground">Aperçu financier</h3>
                {selectedChartMonth && (
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
                    Mois : {selectedChartMonth}
                  </span>
                )}
              </div>
              <FeatureGate feature="canAccessAdvancedReports" showUpgrade={false}>
                <div className="flex space-x-1.5 bg-background/50 p-1 rounded-lg border border-border/40">
                  <button className="px-3 py-1 text-xs font-semibold bg-primary text-white rounded-md transition-all shadow-sm">Par mois</button>
                  <button className="px-3 py-1 text-xs font-semibold text-muted hover:text-foreground rounded-md transition-all">Par année</button>
                </div>
              </FeatureGate>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center">
              <ExpenseChart 
                data={monthlyExpenses} 
                onMonthClick={(month) => setSelectedChartMonth(prev => prev === month ? null : month)}
              />
              <p className="text-[10px] text-muted text-center mt-2 italic">Astuce : Cliquez sur un point du graphique pour filtrer les transactions récentes par mois.</p>
            </div>
          </div>

          {/* Doughnut de répartition des dépenses */}
          <div className="lg:col-span-1 glass-card rounded-2xl border border-border/40 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="p-6 pb-3 border-b border-border/30 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
                <h3 className="font-bold text-lg text-foreground">Répartition</h3>
                {selectedChartCategory && (
                  <span className="text-xs bg-error/10 text-error px-2.5 py-0.5 rounded-full font-bold">
                    Catégorie : {selectedChartCategory}
                  </span>
                )}
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center">
              <CategoryChart 
                transactions={transactions} 
                onCategoryClick={(cat) => setSelectedChartCategory(prev => prev === cat ? null : cat)}
              />
              <p className="text-[10px] text-muted text-center mt-2 italic">Astuce : Cliquez sur une tranche de l'anneau pour filtrer les transactions par catégorie.</p>
            </div>
          </div>
        </div>

        {/* ==================== ZONE 3: ACTIONNABLE & TIMELINE (BAS) ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Block (Segment Playbook + Budgets + Goals) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Segment Playbook (Coach) */}
            <div className="glass-card border border-border/40 rounded-2xl p-6 relative overflow-hidden transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-border/40 gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1 bg-primary/10 px-3 py-1 rounded-full">
                    {activePlaybook.icon}
                    <span>Espace {segmentLabels[activeSegment]}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-foreground mt-1">{activePlaybook.title}</h3>
                  <p className="text-sm text-muted mt-1">{activePlaybook.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 text-xs bg-background/50 px-3 py-1.5 rounded-full border border-border/40">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-muted">Coach Actif</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Segment Metrics */}
                <div className="lg:col-span-1 flex flex-col justify-between gap-4 bg-background/40 p-4 rounded-xl border border-border/30">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Indicateurs clés</h4>
                    <div className="space-y-4">
                      {activePlaybook.metrics.map((metric) => (
                        <div key={metric.label} className="border-b border-border/30 pb-2 last:border-0 last:pb-0">
                          <p className="text-[11px] text-muted uppercase tracking-wider">{metric.label}</p>
                          <p className="text-xl font-extrabold text-foreground mt-0.5">{metric.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Custom Action Steps */}
                <div className="lg:col-span-2 flex flex-col justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Plan d'action recommandé</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {activePlaybook.steps.map((step, index) => (
                        <div key={step} className="bg-surface/50 border border-border/30 rounded-xl p-4 flex flex-col justify-between hover:border-primary/20 transition-colors duration-200">
                          <div className="flex justify-between items-center mb-3">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                              0{index + 1}
                            </span>
                            <CheckCircle2 size={16} className="text-muted/40" />
                          </div>
                          <p className="text-xs font-medium text-foreground leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-border/30">
                    <Button 
                      leftIcon={<UserPlus size={16} />} 
                      onClick={activePlaybook.primaryAction}
                      className="rounded-xl shadow-sm hover:scale-[1.02] transition-transform duration-200 py-2 text-white font-bold"
                    >
                      {activePlaybook.primaryActionLabel}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/profile')}
                      className="rounded-xl hover:scale-[1.02] transition-transform duration-200 py-2 text-foreground"
                    >
                      Ajuster mon profil
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Budgets list */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
                  <h2 className="text-xl font-bold text-foreground">Budgets actifs</h2>
                </div>
                <Button variant="outline" size="sm" leftIcon={<Plus size={16} />} onClick={() => setActiveModal('budget')} className="rounded-lg text-foreground">
                  Créer
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {budgets.slice(0, 4).map(budget => (
                  <BudgetCard key={budget.id} budget={budget} onClick={() => navigate(`/budgets/${budget.id}`)} />
                ))}
              </div>
            </div>

            {/* Savings Goals list */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
                  <h2 className="text-xl font-bold text-foreground">Objectifs d'épargne</h2>
                </div>
                <Button variant="outline" size="sm" leftIcon={<Plus size={16} />} onClick={() => setActiveModal('goal')} className="rounded-lg text-foreground">
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

          {/* Right Block (Timeline & Upcomings & Limits) */}
          <div className="lg:col-span-1 space-y-8">
            {/* Recent Transactions ledger */}
            <div className="glass-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
              <div className="p-6 pb-3 border-b border-border/30 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
                  <h3 className="font-bold text-lg text-foreground">Transactions récentes</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {(selectedChartCategory || selectedChartMonth) && (
                    <button 
                      onClick={() => { setSelectedChartCategory(null); setSelectedChartMonth(null); }}
                      className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 rounded-full font-bold transition-all duration-200 border border-primary/20"
                    >
                      Réinitialiser
                    </button>
                  )}
                  <Button variant="link" onClick={() => navigate('/transactions')} className="text-primary hover:text-primary-dark font-semibold text-xs p-0">
                    Voir tout
                  </Button>
                </div>
              </div>
              <div className="p-4">
                {(selectedChartCategory || selectedChartMonth) && (
                  <div className="mb-3 px-3 py-2 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between text-[11px] text-primary/80">
                    <span>
                      Filtré sur : <span className="font-bold">{[selectedChartMonth, selectedChartCategory].filter(Boolean).join(' • ')}</span>
                    </span>
                    <span className="font-mono font-semibold">({filteredDashboardTransactions.length})</span>
                  </div>
                )}
                <TransactionsList
                  transactions={filteredDashboardTransactions.slice(0, 5)}
                  onViewAllClick={() => navigate('/transactions')}
                />
              </div>
            </div>

            {/* Usage Limits */}
            <div className="glass-card rounded-2xl border border-border/40 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-foreground border-b border-border/30 pb-2">Limites d'utilisation</h3>
              <div className="space-y-4">
                <UsageLimits type="accounts" currentCount={accounts.length} label="Comptes" />
                <UsageLimits type="budgets" currentCount={budgets.length} label="Budgets" />
                <UsageLimits type="goals" currentCount={savingsGoals.length} label="Objectifs" />
              </div>
            </div>

            {/* Upcoming Bills */}
            <div className="glass-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
              <div className="p-6 pb-3 border-b border-border/30">
                <h3 className="font-bold text-lg text-foreground">Prochaines échéances</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Bill 1 */}
                  <div className="flex items-center justify-between p-3 bg-surface hover:bg-background/80 border border-border/20 rounded-xl transition-all duration-200 group cursor-pointer">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning mr-3 group-hover:bg-warning/20 transition-colors">
                        <Clock size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Loyer</h3>
                        <p className="text-xs text-muted">Échéance le 5 mai</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-foreground">{formatCurrency(850.00)}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-error/15 text-error">Urgent</span>
                    </div>
                  </div>

                  {/* Bill 2 */}
                  <div className="flex items-center justify-between p-3 bg-surface hover:bg-background/80 border border-border/20 rounded-xl transition-all duration-200 group cursor-pointer">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning mr-3 group-hover:bg-warning/20 transition-colors">
                        <CalendarClock size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Électricité</h3>
                        <p className="text-xs text-muted">Échéance le 15 mai</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-foreground">{formatCurrency(75.00)}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/15 text-warning">Prévu</span>
                    </div>
                  </div>

                  {/* Bill 3 */}
                  <div className="flex items-center justify-between p-3 bg-surface hover:bg-background/80 border border-border/20 rounded-xl transition-all duration-200 group cursor-pointer">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning mr-3 group-hover:bg-warning/20 transition-colors">
                        <CalendarClock size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Abonnement Internet</h3>
                        <p className="text-xs text-muted">Échéance le 22 mai</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-foreground">{formatCurrency(39.99)}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success">Planifié</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pop-up Modals for Add/Create actions */}
      
      {/* Transaction Modal */}
      <Modal 
        isOpen={activeModal === 'transaction'} 
        onClose={() => setActiveModal(null)} 
        title="Nouvelle Transaction"
        shouldConfirmClose={isFormDirty}
      >
        <TransactionForm 
          onSubmit={handleCreateTransactionSubmit}
          onCancel={() => setActiveModal(null)}
          categories={transactionCategoryOptions}
          accounts={transactionAccountOptions}
          onDirtyChange={setIsFormDirty}
        />
      </Modal>

      {/* Account Modal */}
      <Modal 
        isOpen={activeModal === 'account'} 
        onClose={() => setActiveModal(null)} 
        title="Nouveau Compte Bancaire"
        shouldConfirmClose={isFormDirty}
      >
        <AccountForm 
          onSubmit={handleCreateAccountSubmit}
          onCancel={() => setActiveModal(null)}
          onDirtyChange={setIsFormDirty}
        />
      </Modal>

      {/* Budget Modal */}
      <Modal 
        isOpen={activeModal === 'budget'} 
        onClose={() => setActiveModal(null)} 
        title="Nouveau Budget"
        shouldConfirmClose={isFormDirty}
      >
        <BudgetForm 
          onSubmit={handleCreateBudgetSubmit}
          onCancel={() => setActiveModal(null)}
          categoryOptions={categoryOptions}
          onDirtyChange={setIsFormDirty}
          historicalAverages={historicalAverages}
        />
      </Modal>

      {/* Goal Modal */}
      <Modal 
        isOpen={activeModal === 'goal'} 
        onClose={() => setActiveModal(null)} 
        title="Nouvel Objectif d'Épargne"
        shouldConfirmClose={isFormDirty}
      >
        <GoalForm 
          onSubmit={handleCreateGoalSubmit}
          onCancel={() => setActiveModal(null)}
          onDirtyChange={setIsFormDirty}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;