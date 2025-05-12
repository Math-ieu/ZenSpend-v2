import React from 'react';
import { cn, getInitials } from '../../lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  name?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = '', size = 'md', name, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);
    
    const sizeClasses = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-14 w-14 text-base',
    };

    const handleError = () => {
      setImageError(true);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex shrink-0 overflow-hidden rounded-full bg-surface',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            onError={handleError}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-primary-light text-white font-medium">
            {name ? getInitials(name) : alt ? getInitials(alt) : 'U'}
          </div>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export default Avatar;