import React from 'react';
import { cn, createColorShade } from '../../lib/utils';

interface ProgressBarProps {
  value: number;
  max: number;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error' | 'default';
  className?: string;
  animate?: boolean;
}

const ProgressBar = ({
  value,
  max,
  showPercentage = false,
  size = 'md',
  color = 'default',
  className,
  animate = true,
}: ProgressBarProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };
  
  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    default: color === 'default' 
      ? createColorShade(percentage) 
      : `bg-${color}`,
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between mb-1">
        {showPercentage && (
          <span className="text-sm font-medium text-foreground">
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
      <div className={cn("w-full bg-surface rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className={cn(
            "rounded-full transition-all duration-500 ease-out",
            colorClasses[color],
            animate && "animate-pulse", 
            sizeClasses[size]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;