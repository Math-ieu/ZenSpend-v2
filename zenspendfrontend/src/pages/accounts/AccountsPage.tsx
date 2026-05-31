import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, TrendingUp, CreditCard, Wallet, Link2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import AccountCard, { AddAccountCard } from '../../components/dashboard/AccountCard';
import ExpenseChart from '../../components/dashboard/ExpenseChart';
import Modal from '../../components/ui/Modal';
import AccountForm from '../../components/forms/AccountForm';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AccountsPage: React.FC = () => {
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    fetchAccounts,
    fetchMonthlyExpenses,
    fetchTransactions,
    fetchBankIntegrationStatus,
    createBankLinkSession,
    processBankConnectionCallback,
    syncBankConnectionFromProvider,
    createAccount,
  } = useAuth();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [monthlyExpenses, setMonthlyExpenses] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bankIntegration, setBankIntegration] = useState<any>(null);
  const [isConnectingBank, setIsConnectingBank] = useState(false);
  const [isProcessingBankCallback, setIsProcessingBankCallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const callbackHandledRef = useRef(false);

  useEffect(() => {
    if (!isModalOpen) {
      setIsFormDirty(false);
    }
  }, [isModalOpen]);

  const handleCreateAccountSubmit = async (values: any) => {
    try {
      const accountData = {
        name: values.name,
        account_type: values.type,
        balance: values.balance,
        currency: values.currency,
        account_number: values.accountNumber,
        institution: values.institution,
      };

      await createAccount(accountData);
      toast.success('Compte créé avec succès !');
      setIsModalOpen(false);
      await fetchData();
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la création du compte');
      throw error;
    }
  };

  const handleSyncAccounts = async () => {
    try {
      setIsConnectingBank(true);
      const response = await createBankLinkSession({
        redirect_uri: `${window.location.origin}/accounts`,
        state: `accounts_${Date.now()}`,
      });

      const linkUrl = response?.link_session?.link_url;
      if (!linkUrl) {
        throw new Error('URL de connexion bancaire introuvable.');
      }

      toast.success('Redirection vers la connexion bancaire...');
      window.location.assign(linkUrl);
    } catch (error: any) {
      toast.error(error?.message || 'Impossible de démarrer la synchronisation bancaire.');
    } finally {
      setIsConnectingBank(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [fetchedAccounts, fetchedMonthlyExpenses, fetchedTransactions, fetchedBankIntegration] = await Promise.all([
        fetchAccounts(),
        fetchMonthlyExpenses(),
        fetchTransactions(),
        fetchBankIntegrationStatus().catch(() => null),
      ]);
      setAccounts(fetchedAccounts);
      setMonthlyExpenses(fetchedMonthlyExpenses);
      setTransactions(fetchedTransactions);
      setBankIntegration(fetchedBankIntegration);
    } catch (error) {
      console.error('Error fetching accounts data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAccounts, fetchMonthlyExpenses, fetchTransactions, fetchBankIntegrationStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (callbackHandledRef.current) {
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
          toast.success(`Connexion bancaire terminee. ${createdCount} transaction(s) importee(s).`);
        } else {
          toast.success('Connexion bancaire terminee.');
        }

        await fetchData();
      } catch (error: any) {
        console.error('Accounts callback processing failed:', error);
        toast.error(error?.message || 'Echec de la connexion bancaire.');
      } finally {
        setIsProcessingBankCallback(false);
        navigate(location.pathname, { replace: true });
      }
    };

    processCallback();
  }, [
    location.search,
    location.pathname,
    navigate,
    bankIntegration?.integration?.provider,
    processBankConnectionCallback,
    syncBankConnectionFromProvider,
    fetchData,
  ]);

  if (isLoading) {
    return <div className="py-8 text-center">Chargement...</div>;
  }

  // Calculate total balance across all accounts (returned already converted by backend)
  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);

  // Get recent transactions
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Comptes</h1>
            <p className="text-muted">Gerez vos comptes bancaires</p>
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
            Ajouter un compte
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
                  <TrendingUp size={20} />
                </div>
                <div>
                  <CardTitle className="text-base">Comptes courants</CardTitle>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(
                      accounts.filter(a => a.type === 'checking').reduce((sum, a) => sum + Number(a.balance || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center text-warning mr-3">
                  <CreditCard size={20} />
                </div>
                <div>
                  <CardTitle className="text-base">Epargne totale</CardTitle>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(
                      accounts.filter(a => a.type === 'savings').reduce((sum, a) => sum + Number(a.balance || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Accounts List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {accounts.map(account => (
                <AccountCard key={account.id} account={account} />
              ))}
              <AddAccountCard onClick={() => setIsModalOpen(true)} />
            </div>

            {/* Balance Evolution */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution des soldes</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseChart data={monthlyExpenses} />
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map(transaction => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-surface rounded-md transition-colors">
                      <div>
                        <p className="text-sm font-medium text-foreground">{transaction.description}</p>
                        <p className="text-xs text-muted">{transaction.date}</p>
                      </div>
                      <span className={`text-sm font-medium ${transaction.type === 'income' ? 'text-success' : 'text-error'
                        }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleSyncAccounts}
                    isLoading={isConnectingBank || isProcessingBankCallback}
                    disabled={bankIntegration?.capabilities?.create_link_session === false || isProcessingBankCallback}
                    leftIcon={<Link2 className="h-4 w-4" />}
                  >
                    Synchroniser les comptes
                  </Button>
                  {bankIntegration?.integration?.provider && (
                    <p className="text-xs text-muted px-1">
                      Provider actif: {String(bankIntegration.integration.provider).toUpperCase()}
                    </p>
                  )}
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Voir les analyses
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Wallet className="h-4 w-4 mr-2" />
                    Gérer les virements
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Nouveau Compte Bancaire"
        shouldConfirmClose={isFormDirty}
      >
        <AccountForm 
          onSubmit={handleCreateAccountSubmit}
          onCancel={() => setIsModalOpen(false)}
          onDirtyChange={setIsFormDirty}
        />
      </Modal>
    </div>
  );
};

export default AccountsPage;