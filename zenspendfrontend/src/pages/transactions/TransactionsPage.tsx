import React, { useState } from 'react';
import { Plus, Search, ArrowUpDown } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import TransactionsList from '../../components/dashboard/TransactionsList';
import ExpenseChart from '../../components/dashboard/ExpenseChart';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const TransactionsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const navigate = useNavigate();

  const { fetchTransactions, fetchMonthlyExpenses, fetchCategories } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedTransactions, fetchedMonthlyExpenses, fetchedCategories] = await Promise.all([
          fetchTransactions(),
          fetchMonthlyExpenses(),
          fetchCategories()
        ]);
        setTransactions(fetchedTransactions);
        setMonthlyExpenses(fetchedMonthlyExpenses);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching transactions data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [fetchTransactions, fetchMonthlyExpenses, fetchCategories]);

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
    const matchesType = selectedType === 'all' || transaction.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  if (isLoading) {
    return <div className="py-8 text-center">Chargement...</div>;
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted">Gérez et analysez vos transactions</p>
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={() => navigate('/transactions/new')}>
            Nouvelle transaction
          </Button>
        </div>

        {/* Filters Section */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="overflow-x-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-[800px]">
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
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
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

                {/* Date Range */}
                <div className="flex space-x-2">
                  <input
                    type="date"
                    className="input flex-1"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                  <input
                    type="date"
                    className="input flex-1"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
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
    </div>
  );
};

export default TransactionsPage;