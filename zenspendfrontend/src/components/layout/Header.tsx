import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Home, PieChart, Wallet, Banknote, Target, Settings, LogOut } from 'lucide-react';
import Avatar from '../ui/Avatar';
import ThemeToggle from '../ui/ThemeToggle';
import { useUserStore } from '../../store/useUserStore';
import { cn } from '../../lib/utils';

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
      'flex items-center px-3 py-2 text-sm rounded-md transition-colors',
      isActive 
        ? 'bg-primary/10 text-primary font-medium' 
        : 'text-foreground hover:bg-surface'
    )}
    onClick={onClick}
  >
    <span className="mr-3">{icon}</span>
    {label}
  </Link>
);

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useUserStore();

  const closeMenu = () => setIsMenuOpen(false);
  
  // Check if current route is authenticated route
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
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
    { to: '/dashboard', icon: <Home size={18} />, label: 'Dashboard' },
    { to: '/transactions', icon: <Banknote size={18} />, label: 'Transactions' },
    { to: '/budgets', icon: <PieChart size={18} />, label: 'Budgets' },
    { to: '/accounts', icon: <Wallet size={18} />, label: 'Accounts' },
    { to: '/goals', icon: <Target size={18} />, label: 'Savings Goals' },
  ];
  
  // Landing page navigation items
  const landingNavItems = [
    { to: '/#features', label: 'Features' },
    { to: '/#testimonials', label: 'Testimonials' },
    { to: '/#faq', label: 'FAQ' },
    { to: '/#about', label: 'About' },
    { to: '/#contact', label: 'Contact' },
  ];
  
  return (
    <header 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
        isScrolled || !isLandingPage 
          ? 'bg-background/95 backdrop-blur-sm shadow-sm' 
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Wallet className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">ZenSpend</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
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
                    className="px-3 py-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </>
            ) : null}
          </nav>

          {/* Right Section - Auth/User */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            {isAuthenticated ? (
              <div className="relative">
                <button
                  className="flex items-center space-x-2 focus:outline-none"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <Avatar 
                    src={user?.avatar} 
                    name={user?.name || 'User'} 
                    size="sm" 
                  />
                  <span className="hidden md:inline-block text-sm font-medium text-foreground">
                    {user?.name}
                  </span>
                  <ChevronDown size={16} className="text-muted" />
                </button>
                
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg py-1 z-50 border border-border">
                    <Link 
                      to="/profile" 
                      className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-background"
                      onClick={closeMenu}
                    >
                      <Settings size={16} className="mr-2" />
                      Profile Settings
                    </Link>
                    <button 
                      className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-background"
                      onClick={() => {
                        logout();
                        closeMenu();
                      }}
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : !isAuthPage ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm hover:text-primary transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="btn btn-primary text-sm"
                >
                  Sign up
                </Link>
              </div>
            ) : null}
            
            {/* Mobile Menu Button */}
            <button
              className="inline-flex md:hidden items-center justify-center p-2 rounded-md text-foreground hover:bg-surface focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
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
                    className="px-3 py-2 text-sm text-foreground hover:text-primary transition-colors"
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