import React from 'react';
import { Lock, Crown, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import Card, { CardContent } from '../ui/Card';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FeatureAccess } from '../../types/subscription';

interface FeatureGateProps {
  feature: keyof FeatureAccess;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredPlan?: string;
  showUpgrade?: boolean;
}

const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  requiredPlan = 'premium',
  showUpgrade = true
}) => {
  const { hasFeature, availablePlans } = useSubscription();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const hasAccess = hasFeature(feature);
  const plan = availablePlans.find(p => p.id === requiredPlan);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgrade) {
    return null;
  }

  return (
    <Card className="border-2 border-dashed border-border">
      <CardContent className="text-center py-8">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Crown className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Fonctionnalité Premium
        </h3>
        
        <p className="text-muted mb-4">
          Cette fonctionnalité nécessite un abonnement {plan?.name || 'Premium'} ou supérieur.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {!isAuthenticated && (
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
            >
              <Lock className="h-4 w-4 mr-2" />
              Se connecter
            </Button>
          )}
          
          <Button
            onClick={() => navigate('/subscription')}
          >
            Voir les plans
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureGate;