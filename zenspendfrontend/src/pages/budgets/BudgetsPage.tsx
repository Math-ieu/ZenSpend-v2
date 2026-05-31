import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, TrendingUp, AlertTriangle, Pencil, Trash2, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import BudgetCard from '../../components/dashboard/BudgetCard';
import CategoryChart from '../../components/dashboard/CategoryChart';
import { budgets } from '../../lib/mockData';
import { formatCurrency } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUserSegment } from '../../hooks/useUserSegment';
import { useCurrency } from '../../contexts/CurrencyContext';
import toast from 'react-hot-toast';
import { Household, HouseholdMember, HouseholdRole, SharedBudget } from '../../types';


import Modal from '../../components/ui/Modal';
import BudgetForm from '../../components/forms/BudgetForm';

const MANAGER_ROLES: HouseholdRole[] = ['owner', 'parent', 'partner'];

type CategoryOption = {
  id: number;
  name: string;
};

const toIsoStartDate = (date: string) => `${date}T00:00:00Z`;
const toIsoEndDate = (date: string) => `${date}T23:59:59Z`;

const BudgetsPage: React.FC = () => {
  const { currency } = useCurrency();
  const {
    user,
    fetchBudgets,
    fetchSharedBudgets,
    createSharedBudget,
    updateSharedBudget,
    deleteSharedBudget,
    fetchHouseholds,
    fetchHouseholdMembers,
    fetchCategories,
    createBudget,
    fetchTransactions,
  } = useAuth();
  const { segment } = useUserSegment();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!isModalOpen) {
      setIsFormDirty(false);
    }
  }, [isModalOpen]);

  const historicalAverages = useMemo(() => {
    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === 'expense' && t.category) {
        totals[t.category] = (totals[t.category] || 0) + parseFloat(t.amount);
        counts[t.category] = (counts[t.category] || 0) + 1;
      }
    });
    const averages: Record<string, number> = {};
    Object.keys(totals).forEach(cat => {
      averages[cat] = totals[cat] / Math.max(1, counts[cat]);
    });
    const defaults: Record<string, number> = {
      'Alimentation': 120.00,
      'Transport': 45.00,
      'Logement': 650.00,
      'Loisirs': 60.00,
      'Santé': 30.00,
      'Factures': 85.00,
      'Abonnements': 15.00,
      'Autres': 50.00
    };
    return { ...defaults, ...averages };
  }, [transactions]);

  const [localBudgets, setLocalBudgets] = useState<any[]>([]);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);
  const [sharedBudgets, setSharedBudgets] = useState<SharedBudget[]>([]);
  const [isLoadingSharedBudgets, setIsLoadingSharedBudgets] = useState(false);
  const [isSavingSharedBudget, setIsSavingSharedBudget] = useState(false);
  const [deletingBudgetId, setDeletingBudgetId] = useState<number | null>(null);

  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<number | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  const [sharedBudgetName, setSharedBudgetName] = useState('');
  const [sharedBudgetAmount, setSharedBudgetAmount] = useState('');
  const [sharedBudgetStartDate, setSharedBudgetStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [sharedBudgetEndDate, setSharedBudgetEndDate] = useState('');
  const [editingSharedBudgetId, setEditingSharedBudgetId] = useState<number | null>(null);

  const [isLoadingFamilyConfig, setIsLoadingFamilyConfig] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const categoryOptions = useMemo(() => {
    return categories.map((cat) => ({
      value: String(cat.id),
      label: cat.name,
    }));
  }, [categories]);

  const loadBudgets = useCallback(async () => {
    try {
      setIsLoadingBudgets(true);
      const data = await fetchBudgets();
      setLocalBudgets(data || []);
    } catch (error) {
      console.error('Failed to load budgets', error);
    } finally {
      setIsLoadingBudgets(false);
    }
  }, [fetchBudgets]);

  const handleCreateBudgetSubmit = async (values: any) => {
    try {
      const budgetData = {
        name: values.name,
        amount: values.amount,
        start_date: values.startDate.toISOString(),
        end_date: values.endDate.toISOString(),
        category: values.category,
        alert_threshold: values.alertThreshold,
        is_recurring: values.isRecurring
      };

      await createBudget(budgetData);
      toast.success('Budget créé avec succès !');
      setIsModalOpen(false);
      await loadBudgets();
      if (segment === 'families') {
        await loadSharedBudgets();
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la création du budget');
      throw error;
    }
  };

  useEffect(() => {
    const loadCategoriesOnly = async () => {
      try {
        const fetchedCategories = await fetchCategories();
        const normalizedCategories = (fetchedCategories || [])
          .map((item: any) => ({
            id: Number(item?.id),
            name: String(item?.name || 'Categorie'),
          }))
          .filter((item: CategoryOption) => Number.isInteger(item.id) && item.id > 0);
        setCategories(normalizedCategories);
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    };
    const loadTransactions = async () => {
      try {
        const fetchedTransactions = await fetchTransactions();
        setTransactions(fetchedTransactions || []);
      } catch (error) {
        console.error('Failed to load transactions', error);
      }
    };
    loadCategoriesOnly();
    loadTransactions();
    loadBudgets();
  }, [fetchCategories, fetchTransactions, loadBudgets]);

  const activeBudgets = localBudgets.length > 0 ? localBudgets : budgets;

  // Calculate total budget and spent amounts
  const totalBudget = activeBudgets.reduce((sum, budget) => sum + (Number(budget.amount) || 0), 0);
  const totalSpent = activeBudgets.reduce((sum, budget) => {
    const spentVal = Number(budget.current_amount !== undefined ? budget.current_amount : budget.spent || 0);
    return sum + spentVal;
  }, 0);
  const remainingBudget = totalBudget - totalSpent;
  const navigate = useNavigate();

  // Find budgets that are close to or exceeding their limits
  const warningBudgets = activeBudgets.filter((budget) => {
    const spentVal = Number(budget.current_amount !== undefined ? budget.current_amount : budget.spent || 0);
    const amountVal = Number(budget.amount || 0);
    const percentage = amountVal > 0 ? (spentVal / amountVal) * 100 : 0;
    return percentage >= 80;
  });

  const resetSharedBudgetForm = useCallback(() => {
    setEditingSharedBudgetId(null);
    setSharedBudgetName('');
    setSharedBudgetAmount('');
    setSharedBudgetStartDate(new Date().toISOString().slice(0, 10));
    setSharedBudgetEndDate('');
    setSelectedMemberIds((previous) => {
      if (previous.length > 0 && householdMembers.length > 0) {
        return householdMembers.map((member) => member.user);
      }
      return previous;
    });
  }, [householdMembers]);

  const loadSharedBudgets = useCallback(async () => {
    try {
      setIsLoadingSharedBudgets(true);
      const data = await fetchSharedBudgets();
      setSharedBudgets(data);
    } catch (error: any) {
      toast.error(error?.message || 'Impossible de charger les budgets partages.');
    } finally {
      setIsLoadingSharedBudgets(false);
    }
  }, [fetchSharedBudgets]);

  useEffect(() => {
    if (segment !== 'families') {
      setSharedBudgets([]);
      return;
    }

    loadSharedBudgets();
  }, [segment, loadSharedBudgets]);

  useEffect(() => {
    if (segment !== 'families') {
      setHouseholds([]);
      setSelectedHouseholdId(null);
      setHouseholdMembers([]);
      setCategories([]);
      setSelectedMemberIds([]);
      setSelectedCategoryIds([]);
      setEditingSharedBudgetId(null);
      return;
    }

    const loadFamilyConfig = async () => {
      try {
        setIsLoadingFamilyConfig(true);
        const [fetchedHouseholds, fetchedCategories] = await Promise.all([
          fetchHouseholds(),
          fetchCategories(),
        ]);

        setHouseholds(fetchedHouseholds);
        setSelectedHouseholdId((previous) => {
          if (previous && fetchedHouseholds.some((household) => household.id === previous)) {
            return previous;
          }
          return fetchedHouseholds[0]?.id ?? null;
        });

        const normalizedCategories = (fetchedCategories || [])
          .map((item: any) => ({
            id: Number(item?.id),
            name: String(item?.name || 'Categorie'),
          }))
          .filter((item: CategoryOption) => Number.isInteger(item.id) && item.id > 0);

        setCategories(normalizedCategories);
        setSelectedCategoryIds((previous) => {
          if (previous.length > 0) {
            return previous.filter((id) => normalizedCategories.some((category) => category.id === id));
          }
          return normalizedCategories.length > 0 ? [normalizedCategories[0].id] : [];
        });
      } catch (error: any) {
        toast.error(error?.message || 'Impossible de charger la configuration foyer.');
      } finally {
        setIsLoadingFamilyConfig(false);
      }
    };

    loadFamilyConfig();
  }, [segment, fetchCategories, fetchHouseholds]);

  useEffect(() => {
    if (segment !== 'families' || !selectedHouseholdId) {
      setHouseholdMembers([]);
      setSelectedMemberIds([]);
      return;
    }

    const loadMembers = async () => {
      try {
        setIsLoadingMembers(true);
        const members = await fetchHouseholdMembers(selectedHouseholdId);
        const activeMembers = members.filter((member) => member.is_active);
        setHouseholdMembers(activeMembers);

        setSelectedMemberIds((previous) => {
          if (previous.length > 0) {
            return previous.filter((id) => activeMembers.some((member) => member.user === id));
          }
          return activeMembers.map((member) => member.user);
        });
      } catch (error: any) {
        toast.error(error?.message || 'Impossible de charger les membres du foyer.');
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadMembers();
  }, [segment, selectedHouseholdId, fetchHouseholdMembers]);

  const selectedHousehold = useMemo(
    () => households.find((household) => household.id === selectedHouseholdId) ?? null,
    [households, selectedHouseholdId]
  );

  const numericUserId = useMemo(() => {
    if (!user) {
      return null;
    }
    const parsedId = Number(user.id);
    return Number.isFinite(parsedId) ? parsedId : null;
  }, [user]);

  const currentUserRole = useMemo<HouseholdRole | null>(() => {
    if (!selectedHousehold || numericUserId === null) {
      return null;
    }

    if (selectedHousehold.owner === numericUserId) {
      return 'owner';
    }

    return householdMembers.find((member) => member.user === numericUserId)?.role || null;
  }, [selectedHousehold, householdMembers, numericUserId]);

  const canManageSelectedHousehold = Boolean(currentUserRole && MANAGER_ROLES.includes(currentUserRole));

  const canManageBudget = useCallback(
    (budget: SharedBudget) => {
      if (numericUserId === null) {
        return false;
      }

      const budgetHousehold = households.find((household) => household.id === budget.household);
      if (budgetHousehold?.owner === numericUserId) {
        return true;
      }

      if (budget.household === selectedHouseholdId) {
        return canManageSelectedHousehold;
      }

      return false;
    },
    [numericUserId, households, selectedHouseholdId, canManageSelectedHousehold]
  );

  const toggleSelection = (
    currentIds: number[],
    id: number,
    setIds: React.Dispatch<React.SetStateAction<number[]>>
  ) => {
    setIds(currentIds.includes(id) ? currentIds.filter((item) => item !== id) : [...currentIds, id]);
  };

  const handleSubmitSharedBudget = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedHouseholdId) {
      toast.error('Selectionnez un foyer.');
      return;
    }

    const name = sharedBudgetName.trim();
    const amount = Number(sharedBudgetAmount);

    if (!name) {
      toast.error('Saisissez un nom de budget partage.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Saisissez un montant valide superieur a 0.');
      return;
    }

    if (selectedCategoryIds.length === 0) {
      toast.error('Selectionnez au moins une categorie.');
      return;
    }

    if (!canManageSelectedHousehold) {
      toast.error('Votre role ne permet pas de gerer un budget partage dans ce foyer.');
      return;
    }

    const payload = {
      name,
      household: selectedHouseholdId,
      members: selectedMemberIds,
      amount: amount.toFixed(2),
      start_date: toIsoStartDate(sharedBudgetStartDate),
      end_date: sharedBudgetEndDate ? toIsoEndDate(sharedBudgetEndDate) : null,
      categories: selectedCategoryIds,
    };

    try {
      setIsSavingSharedBudget(true);

      if (editingSharedBudgetId !== null) {
        await updateSharedBudget(editingSharedBudgetId, payload);
        toast.success('Budget partage mis a jour.');
      } else {
        await createSharedBudget(payload);
        toast.success('Budget partage cree avec succes.');
      }

      resetSharedBudgetForm();
      await loadSharedBudgets();
    } catch (error: any) {
      toast.error(error?.message || 'Impossible de sauvegarder le budget partage.');
    } finally {
      setIsSavingSharedBudget(false);
    }
  };

  const handleStartEdit = (budget: SharedBudget) => {
    setEditingSharedBudgetId(budget.id);
    setSelectedHouseholdId(budget.household);
    setSharedBudgetName(budget.name);
    setSharedBudgetAmount(String(Number(budget.amount) || 0));
    setSharedBudgetStartDate((budget.start_date || '').slice(0, 10));
    setSharedBudgetEndDate((budget.end_date || '').slice(0, 10));
    setSelectedMemberIds(budget.members || []);
    setSelectedCategoryIds(budget.categories || []);
  };

  const handleDelete = async (budget: SharedBudget) => {
    if (!canManageBudget(budget)) {
      toast.error('Vous ne pouvez pas supprimer ce budget partage.');
      return;
    }

    if (!window.confirm(`Supprimer le budget partage "${budget.name}" ?`)) {
      return;
    }

    try {
      setDeletingBudgetId(budget.id);
      await deleteSharedBudget(budget.id);
      toast.success('Budget partage supprime.');

      if (editingSharedBudgetId === budget.id) {
        resetSharedBudgetForm();
      }

      await loadSharedBudgets();
    } catch (error: any) {
      toast.error(error?.message || 'Suppression impossible.');
    } finally {
      setDeletingBudgetId(null);
    }
  };

  const sharedTotal = sharedBudgets.reduce((sum, budget) => sum + (Number(budget.amount) || 0), 0);
  const sharedSpent = sharedBudgets.reduce((sum, budget) => sum + (Number(budget.current_amount) || 0), 0);

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Budgets</h1>
            <p className="text-muted">Gerez vos budgets mensuels</p>
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
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
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(totalBudget)}</p>
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
                  <CardTitle className="text-base">Depense</CardTitle>
                  <p className="text-2xl font-bold text-error">{formatCurrency(totalSpent)}</p>
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
                  <p className="text-2xl font-bold text-success">{formatCurrency(remainingBudget)}</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {segment === 'families' && (
          <Card className="mb-8 border-secondary/30">
            <CardHeader>
              <CardTitle>Budgets partages du foyer</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingFamilyConfig ? (
                <p className="text-sm text-muted mb-4">Chargement de la configuration foyer...</p>
              ) : (
                <form onSubmit={handleSubmitSharedBudget} className="mb-6 rounded-md border border-border/60 p-4 bg-background/30">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      {editingSharedBudgetId ? 'Modifier un budget partage' : 'Creer un budget partage'}
                    </h3>
                    {editingSharedBudgetId && (
                      <Button type="button" variant="ghost" size="sm" leftIcon={<X size={14} />} onClick={resetSharedBudgetForm}>
                        Annuler
                      </Button>
                    )}
                  </div>

                  {households.length === 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted">
                        Aucun foyer actif. Creez votre foyer dans le profil avant de creer un budget partage.
                      </p>
                      <Button type="button" variant="outline" onClick={() => navigate('/profile')}>
                        Aller au profil
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <input
                          className="input"
                          placeholder="Nom du budget partage"
                          value={sharedBudgetName}
                          onChange={(event) => setSharedBudgetName(event.target.value)}
                        />
                        <input
                          className="input"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Montant"
                          value={sharedBudgetAmount}
                          onChange={(event) => setSharedBudgetAmount(event.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <select
                          className="input"
                          value={selectedHouseholdId ?? ''}
                          onChange={(event) => {
                            const nextId = Number(event.target.value);
                            setSelectedHouseholdId(Number.isFinite(nextId) ? nextId : null);
                          }}
                        >
                          {households.map((household) => (
                            <option key={household.id} value={household.id}>
                              {household.name}
                            </option>
                          ))}
                        </select>

                        <input
                          className="input"
                          type="date"
                          value={sharedBudgetStartDate}
                          onChange={(event) => setSharedBudgetStartDate(event.target.value)}
                        />

                        <input
                          className="input"
                          type="date"
                          value={sharedBudgetEndDate}
                          onChange={(event) => setSharedBudgetEndDate(event.target.value)}
                        />
                      </div>

                      <div className="mb-3">
                        <p className="text-xs uppercase tracking-wide text-muted mb-2">Membres inclus</p>
                        {isLoadingMembers ? (
                          <p className="text-sm text-muted">Chargement des membres...</p>
                        ) : householdMembers.length === 0 ? (
                          <p className="text-sm text-muted">Aucun membre actif dans ce foyer.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {householdMembers.map((member) => (
                              <label key={member.id} className="flex items-center gap-2 text-sm text-foreground">
                                <input
                                  type="checkbox"
                                  checked={selectedMemberIds.includes(member.user)}
                                  onChange={() => toggleSelection(selectedMemberIds, member.user, setSelectedMemberIds)}
                                />
                                <span>{member.user_full_name || member.user_email}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mb-3">
                        <p className="text-xs uppercase tracking-wide text-muted mb-2">Categories</p>
                        {categories.length === 0 ? (
                          <p className="text-sm text-muted">Aucune categorie disponible.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {categories.map((category) => (
                              <label key={category.id} className="flex items-center gap-2 text-sm text-foreground">
                                <input
                                  type="checkbox"
                                  checked={selectedCategoryIds.includes(category.id)}
                                  onChange={() => toggleSelection(selectedCategoryIds, category.id, setSelectedCategoryIds)}
                                />
                                <span>{category.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {!canManageSelectedHousehold && (
                        <p className="text-sm text-error mb-3">
                          Votre role actuel ({currentUserRole || 'inconnu'}) ne permet pas la gestion de budget partage sur ce foyer.
                        </p>
                      )}

                      <Button
                        type="submit"
                        isLoading={isSavingSharedBudget}
                        disabled={!canManageSelectedHousehold || categories.length === 0}
                      >
                        {editingSharedBudgetId ? 'Enregistrer les modifications' : 'Creer le budget partage'}
                      </Button>
                    </>
                  )}
                </form>
              )}

              {isLoadingSharedBudgets ? (
                <p className="text-sm text-muted">Chargement des budgets partages...</p>
              ) : sharedBudgets.length === 0 ? (
                <p className="text-sm text-muted">Aucun budget partage pour le moment.</p>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="rounded-md border border-border/60 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted">Total partage</p>
                      <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(sharedTotal)}</p>
                    </div>
                    <div className="rounded-md border border-border/60 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted">Depense partagee</p>
                      <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(sharedSpent)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sharedBudgets.map((sharedBudget) => {
                      const amount = Number(sharedBudget.amount) || 0;
                      const spent = Number(sharedBudget.current_amount) || 0;
                      const usage = amount > 0 ? Math.round((spent / amount) * 100) : 0;
                      const isManager = canManageBudget(sharedBudget);

                      return (
                        <Card key={sharedBudget.id} className="h-full border border-border/70">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <CardTitle className="text-base">{sharedBudget.name}</CardTitle>
                                <p className="text-xs text-muted mt-1">
                                  {sharedBudget.household_name ? `Foyer: ${sharedBudget.household_name}` : 'Budget partage'}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  leftIcon={<Pencil size={14} />}
                                  onClick={() => handleStartEdit(sharedBudget)}
                                  disabled={!isManager}
                                >
                                  Editer
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  leftIcon={<Trash2 size={14} />}
                                  onClick={() => handleDelete(sharedBudget)}
                                  isLoading={deletingBudgetId === sharedBudget.id}
                                  disabled={!isManager}
                                >
                                  Supprimer
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <p className="text-sm text-muted">
                                {formatCurrency(spent)} sur {formatCurrency(amount)}
                              </p>
                              <div className="h-2 rounded-full bg-surface overflow-hidden">
                                <div
                                  className={`h-full ${usage >= 90 ? 'bg-error' : usage >= 75 ? 'bg-warning' : 'bg-success'}`}
                                  style={{ width: `${Math.max(0, Math.min(100, usage))}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted">
                                <span>{usage}% utilise</span>
                                <span>{sharedBudget.members.length} membre(s)</span>
                              </div>
                              {!isManager && (
                                <p className="text-xs text-muted">Lecture seule pour votre role sur ce foyer.</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Budgets List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBudgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} />
              ))}
            </div>
          </div>

          {/* Charts and Alerts */}
          <div className="space-y-6">
            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Repartition des budgets</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryChart />
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Alertes budgetaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {warningBudgets.map((budget) => (
                    <div key={budget.id} className="flex items-center p-3 bg-error/10 rounded-md">
                      <AlertTriangle className="h-5 w-5 text-error mr-3" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{budget.name}</p>
                        <p className="text-xs text-muted">
                          {((budget.spent / budget.amount) * 100).toFixed(0)}% du budget utilise
                        </p>
                      </div>
                    </div>
                  ))}
                  {warningBudgets.length === 0 && (
                    <p className="text-sm text-muted text-center py-4">Aucune alerte budgetaire pour le moment</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Nouveau Budget"
        shouldConfirmClose={isFormDirty}
      >
        <BudgetForm 
          onSubmit={handleCreateBudgetSubmit}
          onCancel={() => setIsModalOpen(false)}
          categoryOptions={categoryOptions}
          onDirtyChange={setIsFormDirty}
          historicalAverages={historicalAverages}
        />
      </Modal>
    </div>
  );
};

export default BudgetsPage;