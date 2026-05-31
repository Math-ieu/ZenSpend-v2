import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  shouldConfirmClose?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  shouldConfirmClose = false
}) => {
  const handleClose = useCallback(() => {
    if (shouldConfirmClose) {
      if (window.confirm("Voulez-vous vraiment annuler ? Les informations saisies seront perdues.")) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [shouldConfirmClose, onClose]);

  // Handle Esc key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click closer */}
      <div className="absolute inset-0" onClick={handleClose}></div>
      
      {/* Modal Container */}
      <div 
        className={cn(
          "bg-background border border-border/50 rounded-3xl shadow-2xl w-full max-w-lg md:max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-up z-10 glass-panel",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <button 
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-surface text-muted hover:text-foreground transition-all duration-200"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
