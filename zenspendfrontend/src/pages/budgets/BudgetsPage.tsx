import React from 'react';
import { Plus, TrendingUp, AlertTriangle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import BudgetCard from '../../components/dashboard/BudgetCard';
import CategoryChart from '../../components/dashboard/CategoryChart';
import { budgets } from '../../lib/mockData';

const BudgetsPage: React.FC = () => {
  // Calculate total budget and spent amounts
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const remainingBudget = totalBudget - totalSpent;

  // Find budgets that are close to or exceeding their limits
  const warningBudgets = budgets.filter(budget => {
    const percentage = (budget.spent / budget.amount) * 100;
    return percentage >= 80;
  });

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Budgets</h1>
            <p className="text-muted">Gérez vos budgets mensuels</p>
          </div>
          <Button leftIcon={<Plus size={16} />}>
            Nouveau budget
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <CardTitle className="text-base">Budget total</CardTitle>
                  <p className="text-2xl font-bold text-foreground">
                    {totalBudget.toFixed(2)} €
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-error/10 flex items-center justify-center text-error mr-3">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <CardTitle className="text-base">Dépensé</CardTitle>
                  <p className="text-2xl font-bold text-error">
                    {totalSpent.toFixed(2)} €
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
                  <CardTitle className="text-base">Restant</CardTitle>
                  <p className="text-2xl font-bold text-success">
                    {remainingBudget.toFixed(2)} €
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Budgets List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgets.map(budget => (
                <BudgetCard key={budget.id} budget={budget} />
              ))}
            </div>
          </div>

          {/* Charts and Alerts */}
          <div className="space-y-6">
            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition des budgets</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryChart />
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Alertes budgétaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {warningBudgets.map(budget => (
                    <div key={budget.id} className="flex items-center p-3 bg-error/10 rounded-md">
                      <AlertTriangle className="h-5 w-5 text-error mr-3" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {budget.name}
                        </p>
                        <p className="text-xs text-muted">
                          {((budget.spent / budget.amount) * 100).toFixed(0)}% du budget utilisé
                        </p>
                      </div>
                    </div>
                  ))}
                  {warningBudgets.length === 0 && (
                    <p className="text-sm text-muted text-center py-4">
                      Aucune alerte budgétaire pour le moment
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetsPage;