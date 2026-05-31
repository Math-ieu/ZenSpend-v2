import React, { useState, useEffect } from 'react';
import { Plus, MinusCircle, PlusCircle, Info, Calendar } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'react-hot-toast';

const DebtPage: React.FC = () => {
    const { currency } = useCurrency();
    const { fetchDebts } = useAuth();
    const [debts, setDebts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadDebtsData = async () => {
        try {
            const response = await fetchDebts();
            setDebts(response);
        } catch (error) {
            console.error('Error fetching debts:', error);
            toast.error('Impossible de charger les dettes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDebtsData();
    }, []);

    if (isLoading) {
        return <div className="py-8 text-center">Chargement...</div>;
    }

    const totalOwed = debts
        .filter(d => d.debt_type === 'owed_to_others')
        .reduce((sum, d) => sum + parseFloat(d.remaining_amount), 0);

    const totalDue = debts
        .filter(d => d.debt_type === 'owed_by_others')
        .reduce((sum, d) => sum + parseFloat(d.remaining_amount), 0);

    return (
        <div className="py-8">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dettes et Prêts</h1>
                        <p className="text-muted">Suivez ce que vous devez et ce qu'on vous doit</p>
                    </div>
                    <Button leftIcon={<Plus size={16} />}>
                        Nouvelle dette
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card className="bg-error/5 border-error/20">
                        <CardHeader className="pb-2">
                            <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-error/10 flex items-center justify-center text-error mr-3">
                                    <MinusCircle size={20} />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Ce que je dois</CardTitle>
                                    <p className="text-2xl font-bold text-error">
                                        {formatCurrency(totalOwed)}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card className="bg-success/5 border-success/20">
                        <CardHeader className="pb-2">
                            <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success mr-3">
                                    <PlusCircle size={20} />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Ce qu'on me doit</CardTitle>
                                    <p className="text-2xl font-bold text-success">
                                        {formatCurrency(totalDue)}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Liste des dettes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {debts.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="h-16 w-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 text-muted">
                                        <Info size={32} />
                                    </div>
                                    <p className="text-muted">Aucune dette enregistrée pour le moment.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-surface">
                                                <th className="text-left py-3 px-4 text-sm font-medium text-muted">Nom</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-muted">Type</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-muted">Montant Initial</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-muted">Restant</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-muted">Échéance</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-muted">Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {debts.map(debt => (
                                                <tr key={debt.id} className="border-b border-surface hover:bg-surface/50 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <p className="font-medium text-foreground">{debt.creditor_debtor_name}</p>
                                                        <p className="text-xs text-muted">{debt.description}</p>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${debt.debt_type === 'owed_to_others' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
                                                            }`}>
                                                            {debt.debt_type === 'owed_to_others' ? 'Dette' : 'Prêt'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-foreground">{formatCurrency(debt.total_amount)}</td>
                                                    <td className="py-3 px-4 text-sm font-bold text-foreground">{formatCurrency(debt.remaining_amount)}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center text-sm text-muted">
                                                            <Calendar size={14} className="mr-1" />
                                                            {debt.due_date || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${debt.is_paid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                                                            }`}>
                                                            {debt.is_paid ? 'Payé' : 'En cours'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DebtPage;
