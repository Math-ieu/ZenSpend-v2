import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Transaction } from '../../types';

interface TransactionsListProps {
  transactions: Transaction[];
  showViewAll?: boolean;
  onViewAllClick?: () => void;
  limit?: number;
}

const TransactionsList: React.FC<TransactionsListProps> = ({ 
  transactions, 
  showViewAll = true,
  onViewAllClick,
  limit = 5
}) => {
  const displayedTransactions = transactions.slice(0, limit);
  
  return (
    <div className="space-y-1">
      {displayedTransactions.map((transaction) => (
        <div 
          key={transaction.id}
          className="flex items-center justify-between p-3 hover:bg-surface rounded-md transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            {transaction.type === 'income' ? (
              <ArrowUpCircle className="h-8 w-8 text-success" />
            ) : (
              <ArrowDownCircle className="h-8 w-8 text-error" />
            )}
            <div>
              <h3 className="text-sm font-medium text-foreground">{transaction.description}</h3>
              <p className="text-xs text-muted">{formatDate(transaction.date)}</p>
            </div>
          </div>
          <div className="flex items-center">
            <span className={`text-sm font-medium ${
              transaction.type === 'income' ? 'text-success' : 'text-error'
            }`}>
              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </span>
            <ChevronRight className="h-4 w-4 text-muted ml-2" />
          </div>
        </div>
      ))}
      
      {showViewAll && transactions.length > limit && (
        <button 
          className="w-full py-2 text-sm text-primary hover:underline mt-2 text-center"
          onClick={onViewAllClick}
        >
          Voir toutes les transactions
        </button>
      )}
    </div>
  );
};

export default TransactionsList;