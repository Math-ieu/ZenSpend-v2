import React from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { formatCurrency } from '../../lib/utils';
import { Account } from '../../types';

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onClick }) => {
  const { name, balance, type, currency } = account;
  
  const getAccountIcon = () => {
    switch (type) {
      case 'credit':
        return <CreditCard className="h-5 w-5 text-error" />;
      case 'savings':
        return <CreditCard className="h-5 w-5 text-success" />;
      case 'investment':
        return <CreditCard className="h-5 w-5 text-warning" />;
      default:
        return <CreditCard className="h-5 w-5 text-primary" />;
    }
  };
  
  const getAccountTypeLabel = () => {
    switch (type) {
      case 'credit':
        return 'Crédit';
      case 'savings':
        return 'Épargne';
      case 'investment':
        return 'Investissement';
      default:
        return 'Compte courant';
    }
  };

  return (
    <Card hoverable onClick={onClick} className="h-full transition-all duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {getAccountIcon()}
            <CardTitle className="ml-2 text-base">{name}</CardTitle>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-surface text-muted">
            {getAccountTypeLabel()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-1">
          <p className={`text-xl font-semibold ${balance < 0 ? 'text-error' : 'text-foreground'}`}>
            {formatCurrency(balance, currency)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export const AddAccountCard: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <Card 
      hoverable 
      onClick={onClick} 
      className="h-full border-dashed border-2 flex flex-col items-center justify-center p-6"
    >
      <Plus size={24} className="text-muted mb-2" />
      <p className="text-muted text-sm font-medium">Ajouter un compte</p>
    </Card>
  );
};

export default AccountCard;