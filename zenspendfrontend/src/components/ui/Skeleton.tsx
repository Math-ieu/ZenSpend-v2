import React from 'react';

interface SkeletonProps {
  className?: string;
}

/** A single shimmering placeholder block. */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md bg-border/60 ${className}`} />
);

/** A card-shaped skeleton, useful for dashboard widgets and list items. */
export const SkeletonCard: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`card p-6 space-y-4 ${className}`}>
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-2/3" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-5/6" />
  </div>
);

/** A vertical stack of line skeletons, useful for lists. */
export const SkeletonList: React.FC<{ rows?: number; className?: string }> = ({
  rows = 4,
  className = '',
}) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
    ))}
  </div>
);

export default Skeleton;
