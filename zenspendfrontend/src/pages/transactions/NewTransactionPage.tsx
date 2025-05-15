import React from 'react';
import { useNavigate } from 'react-router-dom';
import TransactionForm from '../../components/forms/TransactionForm';
import { categories } from '../../lib/mockData';

const NewTransactionPage: React.FC = () => {
  const navigate = useNavigate();

  const formattedCategories = categories.map(cat => ({
    value: cat.id,
    label: cat.name
  }));

  const accounts = [
    { value: 'account-1', label: 'Compte Courant' },
    { value: 'account-2', label: 'Livret A' },
    { value: 'account-3', label: 'Carte Gold' }
  ];

  const handleSubmit = async (values: any) => {
    // Here you would normally make an API call
    console.log('New transaction:', values);
    navigate('/transactions');
  };

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 md:px-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
          Nouvelle transaction
        </h1>
        
        <TransactionForm
          onSubmit={handleSubmit}
          categories={formattedCategories}
          accounts={accounts}
        />
      </div>
    </div>
  );
};

export default NewTransactionPage;