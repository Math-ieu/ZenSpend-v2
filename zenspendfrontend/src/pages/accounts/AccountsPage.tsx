import React from 'react';
import { Plus, TrendingUp, CreditCard, Wallet } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import AccountCard, { AddAccountCard } from '../../components/dashboard/AccountCard';
import ExpenseChart from '../../components/dashboard/ExpenseChart';
import { accounts, monthlyExpenses, transactions } from '../../lib/mockData';
import { formatCurrency } from '../../lib/utils';

const AccountsPage: React.FC = () => {
  // Calculate total balance across all accounts
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  
  // Get recent transactions
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Comptes</h1>
            <p className="text-muted">Gérez vos comptes bancaires</p>
          </div>
          <Button leftIcon={<Plus size={16} />}>
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
                    {formatCurrency(accounts.filter(a => a.type === 'checking').reduce((sum, a) => sum + a.balance, 0))}
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
                  <CardTitle className="text-base">Épargne totale</CardTitle>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(accounts.filter(a => a.type === 'savings').reduce((sum, a) => sum + a.balance, 0))}
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
              <AddAccountCard />
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
                      <span className={`text-sm font-medium ${
                        transaction.type === 'income' ? 'text-success' : 'text-error'
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
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Synchroniser les comptes
                  </Button>
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
    </div>
  );
};

export default AccountsPage;