import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import { formatCurrency, calculateProgress } from '../../lib/utils';
import { SavingsGoal } from '../../types';
import { Calendar, Target, Palmtree, Laptop, Shield, Heart } from 'lucide-react';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onClick?: () => void;
}

const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({ goal, onClick }) => {
  const { name, targetAmount, currentAmount, targetDate, iconName } = goal;
  const progress = calculateProgress(currentAmount, targetAmount);
  const remaining = targetAmount - currentAmount;
  
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
      default:
        return <Target className="h-5 w-5" />;
    }
  };

  return (
    <Card hoverable onClick={onClick} className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {getGoalIcon()}
            </div>
            <CardTitle className="ml-2 text-base">{name}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-sm text-muted">
              {formatCurrency(currentAmount)} <span className="text-xs">sur {formatCurrency(targetAmount)}</span>
            </span>
            <span className="text-sm text-success font-medium">
              {progress.toFixed(0)}%
            </span>
          </div>
          <ProgressBar 
            value={currentAmount} 
            max={targetAmount} 
            color="primary"
            animate={false}
          />
        </div>
        <div className="flex items-center text-xs text-muted mt-2">
          <Calendar className="h-3 w-3 mr-1" />
          <span>Objectif: {formattedTargetDate}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SavingsGoalCard;