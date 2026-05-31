import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import { formatCurrency, calculateProgress } from '../../lib/utils';
import { SavingsGoal } from '../../types';
import { Calendar, Target, Palmtree, Laptop, Shield, Heart, Sparkles } from 'lucide-react';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onClick?: () => void;
}

const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({ goal, onClick }) => {
  const { name, targetAmount, currentAmount, targetDate, iconName } = goal;
  const progress = calculateProgress(currentAmount, targetAmount);
  const remaining = targetAmount - currentAmount;
  const isCompleted = remaining <= 0;
  
  // Convert targetDate to a more readable format
  const formattedTargetDate = new Date(targetDate).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const getGoalIcon = () => {
    switch (iconName) {
      case 'Palmtree':
        return <Palmtree className="h-5 w-5" />;
      case 'Laptop':
        return <Laptop className="h-5 w-5" />;
      case 'Shield':
        return <Shield className="h-5 w-5" />;
      case 'Heart':
        return <Heart className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };

  const getIconColorClass = () => {
    switch (iconName) {
      case 'Palmtree':
        return 'bg-teal-500/10 text-teal-600 border border-teal-500/20';
      case 'Laptop':
        return 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
      case 'Shield':
        return 'bg-purple-500/10 text-purple-600 border border-purple-500/20';
      case 'Heart':
        return 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
      default:
        return 'bg-primary/10 text-primary border border-primary/20';
    }
  };

  return (
    <Card 
      hoverable 
      onClick={onClick} 
      className="glass-card border border-border/40 hover:border-success/20 hover:scale-[1.01] transition-all duration-300 shadow-sm rounded-2xl flex flex-col justify-between overflow-hidden"
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center space-x-2.5">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${getIconColorClass()}`}>
              {getGoalIcon()}
            </div>
            <CardTitle className="text-sm font-bold text-foreground truncate max-w-[130px]">{name}</CardTitle>
          </div>
          {isCompleted && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success flex items-center gap-0.5">
              <Sparkles size={10} className="animate-spin" />
              Atteint
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="mb-2">
          <div className="flex justify-between items-baseline mb-2">
            <div className="text-xs text-muted font-medium">
              <span className="text-foreground font-bold">{formatCurrency(currentAmount)}</span>
              <span className="mx-1">/</span>
              <span>{formatCurrency(targetAmount)}</span>
            </div>
            <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
              {progress.toFixed(0)}%
            </span>
          </div>
          
          <ProgressBar 
            value={currentAmount} 
            max={targetAmount} 
            color="success"
            animate={true}
          />
          
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/30 text-[10px] text-muted font-semibold">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Cible : {formattedTargetDate}</span>
            </div>
            {!isCompleted && (
              <span className="text-foreground font-bold bg-background/50 px-2 py-0.5 rounded border border-border/40">
                Restant : {formatCurrency(remaining)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SavingsGoalCard;