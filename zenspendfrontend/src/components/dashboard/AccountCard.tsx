import React from 'react';
import { CreditCard, Plus, Landmark, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { Account } from '../../types';

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onClick }) => {
  const { id, name, balance, type, currency } = account;
  
  const getCardTheme = () => {
    switch (type) {
      case 'credit':
        return 'bg-gradient-to-br from-[#FF5E62] to-[#FF9966] text-white glow-accent border border-white/10';
      case 'savings':
        return 'bg-gradient-to-br from-[#8A2387] via-[#E94057] to-[#F27121] text-white glow-primary border border-white/10';
      case 'investment':
        return 'bg-gradient-to-br from-[#11998e] to-[#38ef7d] text-white glow-success border border-white/10';
      default: // checking
        return 'bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364] text-white glow-secondary border border-white/10';
    }
  };

  const getAccountIcon = () => {
    switch (type) {
      case 'credit':
        return <CreditCard className="h-5 w-5 text-white" />;
      case 'savings':
        return <Sparkles className="h-5 w-5 text-white animate-pulse" />;
      case 'investment':
        return <Landmark className="h-5 w-5 text-white" />;
      default:
        return <CreditCard className="h-5 w-5 text-white" />;
    }
  }; 
  
  const getAccountTypeLabel = () => {
    switch (type) {
      case 'credit':
        return 'Crédit';
      case 'savings':
        return 'Épargne';
      case 'investment':
        return 'Investissement';
      default:
        return 'Courant';
    }
  };

  // Safe masking for the account number
  const maskedId = String(id || 'checking').slice(-4);

  return (
    <div 
      onClick={onClick} 
      className={`h-40 rounded-2xl p-5 cursor-pointer select-none transition-all duration-300 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] relative overflow-hidden flex flex-col justify-between ${getCardTheme()}`}
    >
      {/* Gloss glow background */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
      
      {/* Header */}
      <div className="flex justify-between items-start z-10">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-white/70 font-semibold bg-white/10 px-2 py-0.5 rounded-full">
            {getAccountTypeLabel()}
          </span>
          <h4 className="text-sm font-bold text-white mt-1.5 truncate max-w-[130px]">{name}</h4>
        </div>
        <div className="h-8 w-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
          {getAccountIcon()}
        </div>
      </div>

      {/* Chip and Masked Number */}
      <div className="flex items-center space-x-3 opacity-80 z-10">
        {/* Simulating a gold/silver chip */}
        <div className="w-7 h-5 bg-gradient-to-br from-slate-300 via-slate-100 to-slate-400 rounded-md border border-slate-500/10 shadow-inner"></div>
        <span className="font-mono text-xs text-white/80">•••• {maskedId}</span>
      </div>

      {/* Balance */}
      <div className="flex justify-between items-baseline z-10">
        <p className="text-2xl font-extrabold tracking-tight">
          {formatCurrency(balance, currency)}
        </p>
        <span className="text-[10px] text-white/60 font-mono font-medium">ZENSPEND</span>
      </div>
    </div>
  );
};

export const AddAccountCard: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <div 
      onClick={onClick} 
      className="h-40 rounded-2xl border-dashed border-2 border-border/70 hover:border-primary/50 bg-surface/30 hover:bg-surface/50 cursor-pointer flex flex-col items-center justify-center p-6 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] hover:shadow-md select-none group"
    >
      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white flex items-center justify-center mb-2.5 transition-all duration-300 shadow-sm">
        <Plus size={20} />
      </div>
      <p className="text-muted group-hover:text-foreground text-xs font-bold uppercase tracking-wider transition-colors duration-200">Ajouter un compte</p>
    </div>
  );
};

export default AccountCard;