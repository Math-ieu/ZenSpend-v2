import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowRight, CheckCircle2, PlusCircle, UploadCloud, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useUserSegment } from '../../hooks/useUserSegment';
import { getDashboardPathForSegment } from '../../lib/segmentRouting';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, createAccount, completeOnboarding } = useAuth();
  const { segment } = useUserSegment();

  const [step, setStep] = useState<number>(1);
  const [accountName, setAccountName] = useState('Compte courant');
  const [accountType, setAccountType] = useState('checking');
  const [currency, setCurrency] = useState(user?.preferred_currency || 'EUR');
  const [isSaving, setIsSaving] = useState(false);

  const dashboardPath = getDashboardPathForSegment(user?.user_segment || segment);

  const finish = async () => {
    try {
      await completeOnboarding();
    } catch {
      // Non-blocking: even if persisting the flag fails, let the user in.
    }
    navigate(dashboardPath, { replace: true });
  };

  const handleCreateAccount = async () => {
    if (!user) {
      toast.error('Vous devez être connecté.');
      return;
    }
    if (accountName.trim().length < 3) {
      toast.error('Le nom du compte doit contenir au moins 3 caractères.');
      return;
    }
    setIsSaving(true);
    try {
      await createAccount({
        name: accountName.trim(),
        account_type: accountType,
        currency,
        user: user.id,
      });
      toast.success('Compte créé !');
      setStep(3);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création du compte.');
    } finally {
      setIsSaving(false);
    }
  };

  const goTo = async (path: string) => {
    try {
      await completeOnboarding();
    } catch {
      /* non-blocking */
    }
    navigate(path);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8" aria-hidden="true">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step ? 'w-8 bg-primary' : s < step ? 'w-8 bg-primary/40' : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>

        <div className="card p-8">
          {step === 1 && (
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Bienvenue{user?.first_name ? `, ${user.first_name}` : ''} 👋
              </h1>
              <p className="text-muted mb-8">
                Configurons l'essentiel en deux minutes : votre premier compte, puis vos premières
                transactions. Vous pourrez tout modifier plus tard.
              </p>
              <Button className="w-full justify-center" rightIcon={<ArrowRight size={18} />} onClick={() => setStep(2)}>
                Commencer
              </Button>
              <button
                onClick={finish}
                className="mt-4 text-sm text-muted hover:text-primary transition-colors"
              >
                Passer pour l'instant
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <Wallet className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Créez votre premier compte</h2>
              <p className="text-muted mb-6 text-sm">
                Un compte regroupe vos transactions (compte courant, épargne, espèces…).
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="onboarding-account-name" className="label">Nom du compte</label>
                  <input
                    id="onboarding-account-name"
                    className="input"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Ex : Compte courant"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="onboarding-account-type" className="label">Type</label>
                    <select
                      id="onboarding-account-type"
                      className="input"
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                    >
                      <option value="checking">Compte courant</option>
                      <option value="savings">Épargne</option>
                      <option value="credit">Carte de crédit</option>
                      <option value="cash">Espèces</option>
                      <option value="investment">Investissement</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="onboarding-account-currency" className="label">Devise</label>
                    <select
                      id="onboarding-account-currency"
                      className="input"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CHF">CHF</option>
                      <option value="CAD">CAD</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8">
                <button onClick={() => setStep(1)} className="text-sm text-muted hover:text-primary transition-colors">
                  Retour
                </button>
                <Button onClick={handleCreateAccount} isLoading={isSaving} rightIcon={<ArrowRight size={18} />}>
                  Créer le compte
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Tout est prêt !</h2>
              <p className="text-muted mb-8 text-sm">
                Ajoutez vos premières dépenses pour voir votre tableau de bord prendre vie.
              </p>

              <div className="grid gap-3">
                <button
                  onClick={() => goTo('/transactions/new')}
                  className="flex items-center p-4 rounded-xl border border-border hover:border-primary/60 hover:bg-primary/5 transition-colors text-left"
                >
                  <PlusCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>
                    <span className="block font-medium text-foreground">Ajouter une transaction</span>
                    <span className="block text-sm text-muted">Saisissez une dépense ou un revenu</span>
                  </span>
                </button>
                <button
                  onClick={() => goTo('/transactions/import')}
                  className="flex items-center p-4 rounded-xl border border-border hover:border-primary/60 hover:bg-primary/5 transition-colors text-left"
                >
                  <UploadCloud className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>
                    <span className="block font-medium text-foreground">Importer un relevé CSV</span>
                    <span className="block text-sm text-muted">Importez plusieurs transactions d'un coup</span>
                  </span>
                </button>
              </div>

              <Button variant="ghost" className="mt-6" onClick={finish}>
                Aller au tableau de bord
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
