import React from 'react';
import { Check, Star, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { SubscriptionPlan } from '../../types/subscription';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency as formatCurrencyUtil } from '../../lib/utils';
import { useCurrency } from '../../contexts/CurrencyContext';
import toast from 'react-hot-toast';

interface SubscriptionPlansProps {
  onPlanSelect?: (planId: string) => void;
  showCurrentPlan?: boolean;
} 

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ 
  onPlanSelect,
  showCurrentPlan = true 
}) => {
  const { availablePlans, subscribeToPlan, currentPlan, isLoading, setPendingPlanId } = useSubscription();
  // Subscribe to the active currency so amounts re-render on currency change.
  const { currency } = useCurrency();
  const formatCurrency = (amount: number, override?: string) => formatCurrencyUtil(amount, override ?? currency);
  const navigate = useNavigate();

  const handlePlanSelect = async (plan: SubscriptionPlan) => {
    if (plan.id === 'free') {
      toast('Vous utilisez déjà le plan gratuit');
      return;
    }

    try {
      if (onPlanSelect) {
        onPlanSelect(plan.id);
        return;
      }

      await subscribeToPlan(plan.id);
    } catch (error: any) {
      if (error.message === 'authentication_required') {
        // Store the intended plan and redirect to login
        setPendingPlanId(plan.id);
        toast('Veuillez vous connecter pour souscrire à cet abonnement');
        navigate('/login', { state: { from: { pathname: '/subscription' } } });
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {availablePlans.map((plan) => {
        const isCurrentPlan = currentPlan?.id === plan.id;
        const isFree = plan.id === 'free';
        
        return (
          <Card 
            key={plan.id}
            className={`relative ${plan.isPopular ? 'ring-2 ring-primary' : ''} ${
              isCurrentPlan ? 'bg-primary/5 border-primary' : ''
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  Populaire
                </div>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold text-foreground">
                  {isFree ? 'Gratuit' : formatCurrency(plan.price)}
                </span>
                {!isFree && (
                  <span className="text-muted text-sm">/{plan.interval === 'monthly' ? 'mois' : 'an'}</span>
                )}
              </div>
              {isCurrentPlan && showCurrentPlan && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                    <Check className="h-3 w-3 mr-1" />
                    Plan actuel
                  </span>
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-4 w-4 text-success mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                className="w-full"
                variant={plan.isPopular ? 'primary' : 'outline'}
                onClick={() => handlePlanSelect(plan)}
                disabled={isLoading || isCurrentPlan}
                isLoading={isLoading}
              >
                {isCurrentPlan ? (
                  'Plan actuel'
                ) : isFree ? (
                  'Commencer gratuitement'
                ) : (
                  <>
                    Choisir ce plan
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SubscriptionPlans;