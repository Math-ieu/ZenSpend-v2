import React from 'react';
import { useNavigate } from 'react-router-dom';
import TransactionForm from '../../components/forms/TransactionForm';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const NewTransactionPage: React.FC = () => {
  const navigate = useNavigate();
  const { fetchCategories, fetchAccounts, createTransaction } = useAuth();

  const [categories, setCategories] = React.useState<any[]>([]);
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedCategories, fetchedAccounts] = await Promise.all([
          fetchCategories(),
          fetchAccounts()
        ]);
        setCategories(fetchedCategories);
        setAccounts(fetchedAccounts);
      } catch (error) {
        console.error('Error fetching form data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [fetchCategories, fetchAccounts]);

  const formattedCategories = categories.map(cat => ({
    value: cat.id,
    label: cat.name
  }));

  const formattedAccounts = accounts.map(acc => ({
    value: acc.id,
    label: acc.name
  }));

  const handleSubmit = async (values: any) => {
    try {
      await createTransaction(values);
      toast.success('Transaction créée avec succès');
      navigate('/transactions');
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('Erreur lors de la création de la transaction');
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center">Chargement...</div>;
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 md:px-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
          Nouvelle transaction
        </h1>

        <TransactionForm
          onSubmit={handleSubmit}
          categories={formattedCategories}
          accounts={formattedAccounts}
        />
      </div>
    </div>
  );
};

export default NewTransactionPage;