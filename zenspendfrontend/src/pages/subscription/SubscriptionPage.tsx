import React, { useEffect } from 'react';
import { Crown, Check, X, Settings } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import SubscriptionPlans from '../../components/subscription/SubscriptionPlans';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { formatCurrency } from '../../lib/utils';


const SubscriptionPage: React.FC = () => {
  const { currency } = useCurrency();
  const { 
    subscription, 
    currentPlan, 
    featureAccess, 
    isLoading,
    cancelSubscription,
    pendingPlanId,
    setPendingPlanId,
    subscribeToPlan
  } = useSubscription();
  const { user } = useAuth();

  // Handle pending subscription after login
  useEffect(() => {
    if (pendingPlanId && user) {
      const handlePendingSubscription = async () => {
        try {
          await subscribeToPlan(pendingPlanId);
          setPendingPlanId(null);
        } catch (error) {
          console.error('Failed to complete pending subscription:', error);
        }
      };

      handlePendingSubscription();
    }
  }, [pendingPlanId, user, subscribeToPlan, setPendingPlanId]);

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    if (window.confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) {
      try {
        await cancelSubscription();
      } catch (error) {
        console.error('Failed to cancel subscription:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Crown className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Débloquez toutes les fonctionnalités de ZenSpend pour une gestion financière optimale
          </p>
        </div>

        {/* Current Subscription Status */}
        {subscription && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Mon abonnement actuel
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    subscription.status === 'active' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-error/10 text-error'
                  }`}>
                    {subscription.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Plan actuel</h3>
                  <p className="text-2xl font-bold text-primary">{currentPlan?.name}</p>
                  <p className="text-muted">
                    {currentPlan?.price === 0 
                      ? 'Gratuit' 
                      : `${formatCurrency(currentPlan?.price || 0)}/${currentPlan?.interval === 'monthly' ? 'mois' : 'an'}`
                    }
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-foreground mb-2">Période actuelle</h3>
                  <p className="text-foreground">
                    Du {formatDate(subscription.currentPeriodStart)}
                  </p>
                  <p className="text-foreground">
                    Au {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-foreground mb-2">Actions</h3>
                  {subscription.cancelAtPeriodEnd ? (
                    <div className="text-warning">
                      <p className="text-sm">Annulation programmée</p>
                      <p className="text-xs">Se termine le {formatDate(subscription.currentPeriodEnd)}</p>
                    </div>
                  ) : subscription.status === 'active' && currentPlan?.id !== 'free' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelSubscription}
                      isLoading={isLoading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Comparison */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Fonctionnalités incluses dans votre plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center">
                {featureAccess.canAccessAdvancedReports ? (
                  <Check className="h-5 w-5 text-success mr-2" />
                ) : (
                  <X className="h-5 w-5 text-error mr-2" />
                )}
                <span className="text-sm">Rapports avancés</span>
              </div>
              
              <div className="flex items-center">
                {featureAccess.canExportData ? (
                  <Check className="h-5 w-5 text-success mr-2" />
                ) : (
                  <X className="h-5 w-5 text-error mr-2" />
                )}
                <span className="text-sm">Export des données</span>
              </div>
              
              <div className="flex items-center">
                {featureAccess.canUseMultiCurrency ? (
                  <Check className="h-5 w-5 text-success mr-2" />
                ) : (
                  <X className="h-5 w-5 text-error mr-2" />
                )}
                <span className="text-sm">Multi-devises</span>
              </div>
              
              <div className="flex items-center">
                {featureAccess.canUseAutomaticCategorization ? (
                  <Check className="h-5 w-5 text-success mr-2" />
                ) : (
                  <X className="h-5 w-5 text-error mr-2" />
                )}
                <span className="text-sm">Catégorisation automatique</span>
              </div>
              
              <div className="flex items-center">
                {featureAccess.canAccessInvestmentTracking ? (
                  <Check className="h-5 w-5 text-success mr-2" />
                ) : (
                  <X className="h-5 w-5 text-error mr-2" />
                )}
                <span className="text-sm">Suivi des investissements</span>
              </div>
              
              <div className="flex items-center">
                {featureAccess.canAccessPremiumSupport ? (
                  <Check className="h-5 w-5 text-success mr-2" />
                ) : (
                  <X className="h-5 w-5 text-error mr-2" />
                )}
                <span className="text-sm">Support prioritaire</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Tous nos plans
          </h2>
          <SubscriptionPlans />
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Questions fréquentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground mb-2">
                  Puis-je changer de plan à tout moment ?
                </h3>
                <p className="text-muted text-sm">
                  Oui, vous pouvez mettre à niveau ou rétrograder votre plan à tout moment. 
                  Les changements prennent effet immédiatement.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-foreground mb-2">
                  Que se passe-t-il si j'annule mon abonnement ?
                </h3>
                <p className="text-muted text-sm">
                  Votre abonnement restera actif jusqu'à la fin de la période de facturation en cours. 
                  Vous conserverez l'accès à toutes les fonctionnalités premium jusqu'à cette date.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-foreground mb-2">
                  Mes données sont-elles sécurisées ?
                </h3>
                <p className="text-muted text-sm">
                  Absolument. Nous utilisons un chiffrement de niveau bancaire et respectons 
                  toutes les réglementations de protection des données.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionPage;