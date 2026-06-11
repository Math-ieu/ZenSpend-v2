import React, { useEffect, useState } from 'react';
import { Plus, Target, TrendingUp, Calculator } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import SavingsGoalCard from '../../components/dashboard/SavingsGoalCard';
import Modal from '../../components/ui/Modal';
import GoalForm from '../../components/forms/GoalForm';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { formatCurrency as formatCurrencyUtil } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import toast from 'react-hot-toast';

const GoalsPage: React.FC = () => {
  // Subscribe to the active currency so amounts re-render on currency change.
  const { currency } = useCurrency();
  const formatCurrency = (amount: number, override?: string) => formatCurrencyUtil(amount, override ?? currency);
  const { createGoal, fetchGoals } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormDirty, setIsFormDirty] = React.useState(false);
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadGoals = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchGoals();
      setSavingsGoals(data || []);
    } catch {
      setSavingsGoals([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchGoals]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  React.useEffect(() => {
    if (!isModalOpen) {
      setIsFormDirty(false);
    }
  }, [isModalOpen]);

  const handleCreateGoalSubmit = async (values: any) => {
    try {
      const goalData = {
        name: values.name,
        target_amount: values.targetAmount,
        current_amount: values.initialAmount,
        target_date: values.targetDate.toISOString(),
        automatic_saving: values.automaticSaving,
        saving_frequency: values.savingFrequency || null,
        saving_amount: values.savingAmount || null,
        notes: values.notes || ''
      };

      await createGoal(goalData);
      toast.success('Objectif créé avec succès !');
      setIsModalOpen(false);
      loadGoals();
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la création de l\'objectif');
      throw error;
    }
  };

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
          <Button leftIcon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
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
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : savingsGoals.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Target}
                  title="Aucun objectif d'épargne"
                  description="Définissez votre premier objectif (vacances, épargne de précaution…) et suivez votre progression."
                  actionLabel="Créer un objectif"
                  onAction={() => setIsModalOpen(true)}
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savingsGoals.map(goal => (
                  <SavingsGoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            )}
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
                  <Button variant="outline" className="w-full justify-start" onClick={() => setIsModalOpen(true)}>
                    <Target className="h-4 w-4 mr-2" />
                    Définir un nouvel objectif
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
        title="Nouvel Objectif d'Épargne"
        shouldConfirmClose={isFormDirty}
      >
        <GoalForm 
          onSubmit={handleCreateGoalSubmit}
          onCancel={() => setIsModalOpen(false)}
          onDirtyChange={setIsFormDirty}
        />
      </Modal>
    </div>
  );
};

export default GoalsPage;