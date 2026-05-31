import React from 'react';
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Sparkles } from 'lucide-react';
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
  
  if (!transactions || transactions.length === 0) {
    return (
      <div className="py-8 text-center flex flex-col items-center justify-center text-muted">
        <Sparkles size={24} className="text-muted/40 mb-2" />
        <p className="text-xs font-bold uppercase tracking-wider">Aucune transaction récente</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/30">
      {displayedTransactions.map((transaction) => {
        const isIncome = transaction.type === 'income';
        
        return (
          <div 
            key={transaction.id}
            className="flex items-center justify-between p-3.5 hover:bg-surface/50 rounded-xl transition-all duration-200 cursor-pointer group mt-1 first:mt-0"
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                isIncome 
                  ? 'bg-success/10 text-success group-hover:bg-success/20' 
                  : 'bg-error/10 text-error group-hover:bg-error/20'
              }`}>
                {isIncome ? (
                  <ArrowUpRight className="h-5 w-5" />
                ) : (
                  <ArrowDownLeft className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors duration-150">
                  {transaction.description}
                </h3>
                <p className="text-[11px] text-muted font-medium mt-0.5">{formatDate(transaction.date)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-extrabold ${
                isIncome ? 'text-success' : 'text-foreground'
              }`}>
                {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
              </span>
              <ChevronRight className="h-4 w-4 text-muted/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
            </div>
          </div>
        );
      })}
      
      {showViewAll && transactions.length > limit && (
        <div className="pt-3 pb-1 px-1">
          <button 
            className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-primary bg-primary/5 hover:bg-primary/10 transition-colors text-center"
            onClick={onViewAllClick}
          >
            Voir toutes les transactions
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;