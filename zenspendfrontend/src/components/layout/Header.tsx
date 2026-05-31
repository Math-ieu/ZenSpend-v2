import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Home, PieChart, Wallet, Banknote, Target, Settings, LogOut, Bell, Coins } from 'lucide-react';
import { Crown } from 'lucide-react';
import Avatar from '../ui/Avatar';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import Logo from '../ui/logo';


interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive, onClick }) => (
  <Link
    to={to}
    className={cn(
      'relative flex items-center px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 group border border-transparent',
      isActive
        ? 'bg-primary/10 border-primary/15 text-primary font-extrabold shadow-[0_0_12px_rgba(99,102,241,0.12)]'
        : 'text-muted-foreground hover:text-foreground hover:bg-primary/5 hover:border-primary/5'
    )}
    onClick={onClick}
  >
    <span className={cn(
      'mr-2 transition-transform duration-300 group-hover:scale-110',
      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
    )}>{icon}</span>
    <span className="relative">
      {label}
    </span>
  </Link>
);

const currencies = [
  { code: 'EUR', symbol: '€', label: 'Euro', flag: '🇪🇺' },
  { code: 'USD', symbol: '$', label: 'Dollar US', flag: '🇺🇸' },
  { code: 'GBP', symbol: '£', label: 'Livre Sterling', flag: '🇬🇧' },
  { code: 'CAD', symbol: 'CA$', label: 'Dollar Canadien', flag: '🇨🇦' },
  { code: 'JPY', symbol: '¥', label: 'Yen Japonais', flag: '🇯🇵' },
  { code: 'CHF', symbol: 'CHF', label: 'Franc Suisse', flag: '🇨🇭' },
];

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout, updateCurrentUser } = useAuth();
  const { currentPlan } = useSubscription();
  const { currency, setCurrency } = useCurrency();

  // Sync context currency with user.preferred_currency when user loads
  useEffect(() => {
    if (user && user.preferred_currency && user.preferred_currency !== currency) {
      setCurrency(user.preferred_currency);
    }
  }, [user]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    setIsCurrencyOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setIsCurrencyOpen(false);
      }
    };

    if (isProfileOpen || isCurrencyOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen, isCurrencyOpen]);

  // Check if current route is authenticated route
  const isAuthPage = location.pathname.startsWith('/login') || location.pathname.startsWith('/signup');
  const isLandingPage = location.pathname === '/';

  // Handle scroll events to change header style
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation items
  const mainNavItems = [
    { to: '/dashboard', icon: <Home size={15} />, label: 'Dashboard' },
    { to: '/transactions', icon: <Banknote size={15} />, label: 'Transactions' },
    { to: '/budgets', icon: <PieChart size={15} />, label: 'Budgets' },
    { to: '/accounts', icon: <Wallet size={15} />, label: 'Comptes' },
    { to: '/goals', icon: <Target size={15} />, label: 'Épargne' },
    { to: '/dettes', icon: <Coins size={15} />, label: 'Dettes' },
    { to: '/subscription', icon: <Crown size={15} />, label: 'Premium' },
  ];

  // Landing page navigation items
  const landingNavItems = [
    { to: '/#features', label: 'Fonctionnalités' },
    { to: '/#testimonials', label: 'Témoignages' },
    { to: '/#faq', label: 'FAQ' },
    { to: '/#about', label: 'À propos' },
    { to: '/#contact', label: 'Contact' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Déconnexion réussie');
      closeMenu();
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
        isScrolled || !isLandingPage
          ? 'bg-background/60 dark:bg-slate-900/40 backdrop-blur-xl border-border/40 shadow-[0_4px_30px_rgba(0,0,0,0.03)]'
          : 'bg-transparent border-transparent'
      )}
    >
      <div className="w-full max-w-[1600px] px-4 md:px-8 xl:px-12 mx-auto">
        <div className="flex h-16 items-center justify-between lg:justify-center lg:space-x-12 xl:space-x-24">
          {/* Group Logo and Nav together in center-left */}
          <div className="flex items-center space-x-8 xl:space-x-12">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 transition-transform duration-300 hover:scale-105">
              <Logo />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-3">
              {isAuthenticated && !isAuthPage ? (
                <>
                  {mainNavItems.map((item) => (
                    <NavItem
                      key={item.to}
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      isActive={location.pathname === item.to}
                    />
                  ))}
                </>
              ) : isLandingPage ? (
                <>
                  {landingNavItems.map((item) => (
                    <a
                      key={item.to}
                      href={item.to}
                      className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-all duration-300 hover:bg-primary/5 rounded-xl border border-transparent hover:border-primary/5"
                    >
                      {item.label}
                    </a>
                  ))}
                </>
              ) : null}
            </nav>
          </div>

          {/* Right Section - Auth/User */}
          <div className="flex items-center space-x-4">
            {/* Currency Selector */}
            <div className="relative" ref={currencyRef}>
              <button
                className={cn(
                  "flex items-center space-x-1.5 focus:outline-none px-2.5 py-1.5 bg-background/40 dark:bg-slate-900/40 border rounded-xl transition-all duration-300 h-9 text-xs font-bold uppercase tracking-wider",
                  isCurrencyOpen ? "border-primary/45 shadow-[0_0_12px_rgba(99,102,241,0.12)]" : "border-border/40 hover:border-primary/30"
                )}
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
              >
                <span className="text-primary font-extrabold">{currencies.find(c => c.code === currency)?.symbol}</span>
                <span className="text-muted-foreground">{currency}</span>
                <ChevronDown size={12} className={cn("text-muted-foreground transition-transform duration-300", isCurrencyOpen && "transform rotate-180")} />
              </button>

              {isCurrencyOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-background dark:bg-background rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] border border-border/80 dark:border-slate-800 z-50 overflow-hidden transition-all duration-300 animate-slide-up p-1.5 space-y-0.5">
                  {currencies.map((cur) => (
                    <button
                      key={cur.code}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 group border border-transparent",
                        currency === cur.code
                          ? "bg-primary/10 border-primary/15 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-primary/5 hover:border-primary/5"
                      )}
                      onClick={async () => {
                        try {
                          if (isAuthenticated && updateCurrentUser) {
                            await updateCurrentUser({ preferred_currency: cur.code });
                          }
                          setCurrency(cur.code);
                          setIsCurrencyOpen(false);
                          toast.success(`Devise changée pour ${cur.code} (${cur.symbol})`);
                          window.location.reload();
                        } catch (error) {
                          console.error("Error updating preferred currency:", error);
                          toast.error("Erreur lors de la mise à jour de la devise");
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{cur.flag}</span>
                        <span>{cur.label}</span>
                      </div>
                      <span className={cn(
                        "font-extrabold text-xs transition-colors",
                        currency === cur.code ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}>
                        {cur.symbol} {cur.code}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ThemeToggle />

            {/* Notifications */}
            {isAuthenticated && (
              <Link 
                to="/notifications" 
                className="relative p-2 text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105 bg-background/40 dark:bg-slate-900/40 rounded-xl border border-border/40 hover:border-primary/20 flex items-center justify-center h-9 w-9 shadow-sm group"
              >
                <Bell size={16} className="group-hover:animate-wiggle" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-ping"></span>
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary"></span>
              </Link>
            )}

            {/* Subscription Badge */}
            {isAuthenticated && currentPlan && currentPlan.id !== 'free' && (
              <div className="hidden md:flex items-center px-3 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-500 border border-amber-500/30 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.1)] animate-pulse">
                <Crown className="h-3 w-3 mr-1.5" />
                {currentPlan.name}
              </div>
            )}

            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  className={cn(
                    "flex items-center space-x-2 focus:outline-none p-1.5 bg-background/40 dark:bg-slate-900/40 border rounded-xl transition-all duration-300",
                    isProfileOpen ? "border-primary/45 shadow-[0_0_12px_rgba(255,127,0,0.1)]" : "border-border/40 hover:border-primary/30"
                  )}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <Avatar
                    src={user?.avatar}
                    name={user?.first_name || 'User'}
                    size="sm"
                    className="border border-border/60"
                  />
                  <span className="hidden md:inline-block text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground pl-1">
                    {user?.first_name || 'User'}
                  </span>
                  <ChevronDown size={14} className={cn("text-muted-foreground mr-1 transition-transform duration-300", isProfileOpen && "transform rotate-180")} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-background dark:bg-background rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] border border-border/80 dark:border-slate-800 z-50 overflow-hidden transition-all duration-300 animate-slide-up">
                    
                    {/* Premium Header/User card */}
                    <div className="px-4 py-4 border-b border-border/40 dark:border-slate-800/60 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          {/* Inner glowing ring for Avatar */}
                          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-primary to-accent opacity-75 blur-[1px]"></div>
                          <Avatar
                            src={user?.avatar}
                            name={user?.first_name || 'User'}
                            size="md"
                            className="relative border border-background dark:border-slate-900"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-extrabold text-foreground truncate leading-tight">
                            {user?.first_name} {user?.last_name || ''}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate font-medium mt-0.5">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                      
                      {/* Dynamic subscription tier badge and Segment badge */}
                      <div className="mt-3 flex items-center justify-between">
                        {currentPlan && currentPlan.id !== 'free' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.12)]">
                            <Crown size={9} className="mr-1 animate-pulse" />
                            {currentPlan.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider bg-primary/15 text-primary border border-primary/35">
                            Standard
                          </span>
                        )}
                        
                        {user?.user_segment && (
                          <span className="text-[9px] font-bold text-muted-foreground capitalize bg-surface/90 dark:bg-slate-900/90 px-2 py-0.5 rounded-lg border border-border/40 dark:border-slate-800/80">
                            {user.user_segment === 'couples' 
                              ? '👪 Couple' 
                              : user.user_segment === 'young_professionals' 
                              ? '💼 Jeune Pro' 
                              : '🏠 Famille'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Nav Links Section */}
                    <div className="p-1.5 space-y-0.5">
                      <Link
                        to="/profile"
                        className="flex items-center px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl transition-all duration-200 group"
                        onClick={closeMenu}
                      >
                        <Settings size={14} className="mr-3 text-muted-foreground group-hover:text-primary transition-transform duration-300 group-hover:rotate-45" />
                        <span>Profil & Paramètres</span>
                      </Link>
                      
                      <Link
                        to="/goals"
                        className="flex items-center px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl transition-all duration-200 group"
                        onClick={closeMenu}
                      >
                        <Target size={14} className="mr-3 text-muted-foreground group-hover:text-primary transition-transform duration-300 group-hover:scale-115" />
                        <span>Mes Épargnes</span>
                      </Link>

                      <Link
                        to="/subscription"
                        className="flex items-center px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl transition-all duration-200 group"
                        onClick={closeMenu}
                      >
                        <Crown size={14} className="mr-3 text-muted-foreground group-hover:text-primary transition-transform duration-300 group-hover:scale-115 group-hover:rotate-12" />
                        <span>Abonnement</span>
                      </Link>
                    </div>

                    {/* Log Out Button Section */}
                    <div className="px-1.5 pb-1.5 pt-1 border-t border-border/40 dark:border-slate-800/60">
                      <button
                        className="flex w-full items-center px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-error/90 hover:text-error hover:bg-error/10 dark:hover:bg-error/15 rounded-xl transition-all duration-200 group"
                        onClick={handleLogout}
                      >
                        <LogOut size={14} className="mr-3 text-error/90 transition-transform duration-300 group-hover:translate-x-1" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            ) : !isAuthPage ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider hover:text-primary transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="btn btn-primary px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl"
                >
                  Sign up
                </Link>
              </div>
            ) : null}

            {/* Mobile Menu Button */}
            <button
              className="inline-flex lg:hidden items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface border border-transparent hover:border-border/40 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-background/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-border/40">
          <div className="container mx-auto px-4 py-3">
            {isAuthenticated && !isAuthPage ? (
              <nav className="flex flex-col space-y-1">
                {mainNavItems.map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    isActive={location.pathname === item.to}
                    onClick={closeMenu}
                  />
                ))}
              </nav>
            ) : isLandingPage ? (
              <nav className="flex flex-col space-y-2">
                {landingNavItems.map((item) => (
                  <a
                    key={item.to}
                    href={item.to}
                    className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
                    onClick={closeMenu}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;