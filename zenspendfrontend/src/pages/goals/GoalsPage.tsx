import React from 'react';
import { Plus, Target, TrendingUp, Calculator } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import SavingsGoalCard from '../../components/dashboard/SavingsGoalCard';
import { savingsGoals } from '../../lib/mockData';
import { formatCurrency } from '../../lib/utils';

const GoalsPage: React.FC = () => {
  // Calculate total savings progress
  const totalTargetAmount = savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalRemaining = totalTargetAmount - totalCurrentAmount;
  
  // Calculate average monthly savings needed
  const monthlyTargetSavings = totalRemaining / 12;

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Objectifs d'épargne</h1>
            <p className="text-muted">Suivez et atteignez vos objectifs financiers</p>
          </div>
          <Button leftIcon={<Plus size={16} />}>
            Nouvel objectif
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                  <Target size={20} />
                </div>
                <div>
                  <CardTitle className="text-base">Total épargné</CardTitle>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(totalCurrentAmount)}
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
                  <CardTitle className="text-base">Objectif total</CardTitle>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(totalTargetAmount)}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center text-warning mr-3">
                  <Calculator size={20} />
                </div>
                <div>
                  <CardTitle className="text-base">Épargne mensuelle suggérée</CardTitle>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(monthlyTargetSavings)}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Goals List */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savingsGoals.map(goal => (
                <SavingsGoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          </div>

          {/* Suggestions and Tips */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Suggestions d'optimisation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-success/10 rounded-lg">
                    <h3 className="text-sm font-medium text-success mb-2">
                      Augmentez votre épargne
                    </h3>
                    <p className="text-sm text-muted">
                      En épargnant 50€ de plus par mois, vous atteindrez votre objectif 3 mois plus tôt.
                    </p>
                  </div>

                  <div className="p-4 bg-primary/10 rounded-lg">
                    <h3 className="text-sm font-medium text-primary mb-2">
                      Conseil d'investissement
                    </h3>
                    <p className="text-sm text-muted">
                      Pensez à diversifier votre épargne avec un livret A pour plus de sécurité.
                    </p>
                  </div>

                  <div className="p-4 bg-warning/10 rounded-lg">
                    <h3 className="text-sm font-medium text-warning mb-2">
                      Attention
                    </h3>
                    <p className="text-sm text-muted">
                      Vous êtes en retard sur votre objectif "Vacances". Ajustez votre épargne mensuelle.
                    </p>
                  </div>
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
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculateur d'épargne
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Analyser mes objectifs
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="h-4 w-4 mr-2" />
                    Définir un nouvel objectif
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

export default GoalsPage;