import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import { formatCurrency } from '../../lib/utils';
import { Budget } from '../../types';
import { PieChart, AlertTriangle } from 'lucide-react';

interface BudgetCardProps {
  budget: Budget;
  onClick?: () => void;
}

const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onClick }) => {
  const { name, category } = budget;
  const amount = Number(budget.amount || 0);
  const spent = Number(budget.current_amount !== undefined ? budget.current_amount : (budget as any).spent || 0);
  const percentage = amount > 0 ? Math.min(100, (spent / amount) * 100) : 0;
  const remaining = amount - spent;
  const isOverBudget = remaining < 0;
  const isNearLimit = percentage >= 85 && !isOverBudget;
  
  const getStatusColor = () => { 
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  const getCategoryBadgeStyles = () => {
    switch (String(category).toLowerCase()) {
      case 'alimentation':
      case 'nourriture':
      case 'courses':
        return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
      case 'logement':
      case 'loyer':
        return 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
      case 'loisirs':
      case 'divertissement':
      case 'sorties':
        return 'bg-purple-500/10 text-purple-600 border border-purple-500/20';
      default:
        return 'bg-primary/10 text-primary border border-primary/20';
    }
  };

  return (
    <Card 
      hoverable 
      onClick={onClick} 
      className="glass-card border border-border/40 hover:border-primary/20 hover:scale-[1.01] transition-all duration-300 shadow-sm rounded-2xl flex flex-col justify-between overflow-hidden"
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center space-x-2">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isOverBudget ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
              <PieChart size={16} />
            </div>
            <CardTitle className="text-sm font-bold text-foreground truncate max-w-[130px]">{name}</CardTitle>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getCategoryBadgeStyles()}`}>
            {category}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="mb-2">
          <div className="flex justify-between items-baseline mb-2">
            <div className="text-xs text-muted font-medium">
              <span className="text-foreground font-bold">{formatCurrency(spent)}</span>
              <span className="mx-1">/</span>
              <span>{formatCurrency(amount)}</span>
            </div>
            <div className="flex items-center space-x-1">
              {isOverBudget && <AlertTriangle size={12} className="text-error animate-bounce" />}
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isOverBudget 
                  ? 'bg-error/15 text-error' 
                  : isNearLimit 
                    ? 'bg-warning/15 text-warning' 
                    : 'bg-success/15 text-success'
              }`}>
                {isOverBudget ? 'Dépassé' : `${formatCurrency(Math.round(remaining))} restant(s)`}
              </span>
            </div>
          </div>
          
          <ProgressBar 
            value={spent} 
            max={amount} 
            color={getStatusColor()}
            animate={true}
          />
          
          <div className="flex justify-between items-center mt-2.5 text-[10px] text-muted font-semibold">
            <span>Progression</span>
            <span>{percentage.toFixed(0)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetCard;