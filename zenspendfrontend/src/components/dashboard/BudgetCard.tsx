import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import { formatCurrency } from '../../lib/utils';
import { Budget } from '../../types';

interface BudgetCardProps {
  budget: Budget;
  onClick?: () => void;
}

const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onClick }) => {
  const { name, amount, spent, category } = budget;
  const percentage = (spent / amount) * 100;
  const remaining = amount - spent;
  
  const getStatusColor = () => { 
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  return (
    <Card hoverable onClick={onClick} className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">{name}</CardTitle>
          <span className="text-xs px-2 py-1 rounded-full bg-surface text-muted">
            {category}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-sm text-muted">
              {formatCurrency(spent)} <span className="text-xs">sur {formatCurrency(amount)}</span>
            </span>
            <span className={`text-sm font-medium ${remaining < 0 ? 'text-error' : 'text-success'}`}>
              {remaining < 0 ? '-' : ''}{formatCurrency(Math.abs(remaining))}
            </span>
          </div>
          <ProgressBar 
            value={spent} 
            max={amount} 
            color={getStatusColor()}
            animate={false}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetCard;