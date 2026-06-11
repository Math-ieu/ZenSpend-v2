import React, { useState } from 'react';
import { Plus, Search, ArrowUpDown, Upload } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import TransactionsList from '../../components/dashboard/TransactionsList';
import ExpenseChart from '../../components/dashboard/ExpenseChart';
import Modal from '../../components/ui/Modal';
import TransactionForm from '../../components/forms/TransactionForm';
import { formatCurrency as formatCurrencyUtil } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const TransactionsPage: React.FC = () => {
  // Subscribe to the active currency so amounts re-render on currency change.
  const { currency } = useCurrency();
  const formatCurrency = (amount: number, override?: string) => formatCurrencyUtil(amount, override ?? currency);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [selectedType, setSelectedType] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const navigate = useNavigate();

  const { 
    fetchTransactions, 
    fetchMonthlyExpenses, 
    fetchCategories, 
    fetchAccounts,
    createTransaction 
  } = useAuth();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);

  React.useEffect(() => {
    if (!isModalOpen) {
      setIsFormDirty(false);
    }
  }, [isModalOpen]);

  const fetchData = async () => {
    try {
      const [fetchedTransactions, fetchedMonthlyExpenses, fetchedCategories, fetchedAccounts] = await Promise.all([
        fetchTransactions(),
        fetchMonthlyExpenses(),
        fetchCategories(),
        fetchAccounts()
      ]);
      setTransactions(fetchedTransactions);
      setMonthlyExpenses(fetchedMonthlyExpenses);
      setCategories(fetchedCategories);
      setAccounts(fetchedAccounts);
    } catch (error) {
      console.error('Error fetching transactions data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [fetchTransactions, fetchMonthlyExpenses, fetchCategories, fetchAccounts]);

  const handleCreateTransactionSubmit = async (values: any) => {
    try {
      const transactionData = {
        amount: String(values.amount),
        description: values.description,
        date: values.date.toISOString().slice(0, 10),
        category: Number(values.category),
        account: Number(values.account),
        type: values.type,
        tags: values.tags || [],
        notes: values.notes || '',
        status: values.status || 'pending',
      };

      await createTransaction(transactionData);
      toast.success('Transaction ajoutée avec succès !');
      setIsModalOpen(false);
      await fetchData();
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la création de la transaction');
      throw error;
    }
  };

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchQuery || 
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.payee && transaction.payee.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesCategory = true;
    if (selectedCategory !== 'all') {
      const txCat = transaction.category;
      const txCatId = txCat && (typeof txCat === 'object' ? (txCat as any).id : txCat);
      matchesCategory = String(txCatId) === String(selectedCategory);
    }
    
    const matchesType = selectedType === 'all' || transaction.type === selectedType;

    let matchesDate = true;
    if (dateRange.start) {
      matchesDate = matchesDate && new Date(transaction.date) >= new Date(dateRange.start);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(transaction.date) <= endDate;
    }

    return matchesSearch && matchesCategory && matchesType && matchesDate;
  });

  if (isLoading) {
    return <div className="py-8 text-center">Chargement...</div>;
  }

  const transactionCategoryOptions = categories.map((cat: any) => ({
    value: String(cat.id),
    label: cat.name
  }));

  const transactionAccountOptions = accounts.map((acc: any) => ({
    value: String(acc.id),
    label: acc.name
  }));

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted">Gérez et analysez vos transactions</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" leftIcon={<Upload size={16} />} onClick={() => navigate('/transactions/import')}>
              Importer
            </Button>
            <Button leftIcon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
              Nouvelle transaction
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted h-4 w-4" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="input pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  className="input"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">Toutes les catégories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  className="input"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="all">Tous les types</option>
                  <option value="income">Revenus</option>
                  <option value="expense">Dépenses</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <input
                  type="date"
                  className="input w-full"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>

              {/* End Date */}
              <div>
                <input
                  type="date"
                  className="input w-full"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transactions List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Liste des transactions</CardTitle>
                  <Button variant="outline" size="sm" leftIcon={<ArrowUpDown size={16} />}>
                    Trier
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TransactionsList
                  transactions={filteredTransactions}
                  showViewAll={false}
                />
              </CardContent>
            </Card>
          </div>

          {/* Charts and Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Aperçu mensuel</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseChart data={monthlyExpenses} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted">Total des dépenses</p>
                    <p className="text-2xl font-semibold text-error">
                      -{formatCurrency(filteredTransactions
                        .filter(tx => tx.type === 'expense')
                        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted">Total des revenus</p>
                    <p className="text-2xl font-semibold text-success">
                      +{formatCurrency(filteredTransactions
                        .filter(tx => tx.type === 'income')
                        .reduce((sum, tx) => sum + tx.amount, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted">Solde net</p>
                    <p className="text-2xl font-semibold text-primary">
                      {formatCurrency(filteredTransactions.reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -Math.abs(tx.amount)), 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Nouvelle Transaction"
        shouldConfirmClose={isFormDirty}
      >
        <TransactionForm 
          onSubmit={handleCreateTransactionSubmit}
          onCancel={() => setIsModalOpen(false)}
          categories={transactionCategoryOptions}
          accounts={transactionAccountOptions}
          onDirtyChange={setIsFormDirty}
        />
      </Modal>
    </div>
  );
};

export default TransactionsPage;