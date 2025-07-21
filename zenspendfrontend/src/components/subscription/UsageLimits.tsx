import React from 'react';
import { AlertTriangle, Crown } from 'lucide-react';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';

interface UsageLimitsProps {
  type: 'accounts' | 'transactions' | 'budgets' | 'goals';
  currentCount: number;
  label: string;
}

const UsageLimits: React.FC<UsageLimitsProps> = ({ type, currentCount, label }) => {
  const { featureAccess, canCreateMore, currentPlan } = useSubscription();
  const navigate = useNavigate();

  const limits = {
    accounts: featureAccess.maxAccounts,
    transactions: featureAccess.maxTransactions,
    budgets: featureAccess.maxBudgets,
    goals: featureAccess.maxGoals
  };

  const limit = limits[type];
  const canCreate = canCreateMore(type, currentCount);
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : (currentCount / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = !canCreate && !isUnlimited;

  if (isUnlimited) {
    return null; // Don't show limits for unlimited plans
  }

  return (
    <Card className={`${isAtLimit ? 'border-error' : isNearLimit ? 'border-warning' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center">
            {isAtLimit && <AlertTriangle className="h-4 w-4 text-error mr-2" />}
            Utilisation - {label}
          </CardTitle>
          <span className="text-sm text-muted">
            {currentCount} / {limit}
          </span>
        </div>
      </CardHeader>
      
      <CardContent>
        <ProgressBar
          value={currentCount}
          max={limit}
          color={isAtLimit ? 'error' : isNearLimit ? 'warning' : 'success'}
          className="mb-3"
        />
        
        {isAtLimit && (
          <div className="bg-error/10 border border-error/20 rounded-md p-3">
            <p className="text-sm text-error mb-2">
              Vous avez atteint la limite de votre plan {currentPlan?.name}.
            </p>
            <Button
              size="sm"
              onClick={() => navigate('/subscription')}
            >
              <Crown className="h-4 w-4 mr-2" />
              Mettre à niveau
            </Button>
          </div>
        )}
        
        {isNearLimit && !isAtLimit && (
          <div className="bg-warning/10 border border-warning/20 rounded-md p-3">
            <p className="text-sm text-warning">
              Vous approchez de la limite de votre plan. Pensez à mettre à niveau.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageLimits;