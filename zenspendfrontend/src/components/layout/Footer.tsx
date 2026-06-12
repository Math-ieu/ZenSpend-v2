import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Linkedin, ArrowRight } from 'lucide-react';
import Logo from '../ui/logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface border-t border-border pt-16 pb-8">
      <div className="container max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <Logo />
            </Link>
            <p className="text-muted text-sm mb-8 max-w-sm leading-relaxed">
              Simplify your finances, track every expense, and achieve your money goals with real-time insights and smart budgeting tools.
            </p>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Subscribe to our newsletter</h4>
              <div className="flex max-w-sm shadow-sm">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="flex-1 bg-background border border-border rounded-l-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  aria-label="S'inscrire à la newsletter"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-r-md hover:bg-primary/90 transition-colors flex items-center justify-center"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Columns */}
          <div className="col-span-1 mt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-6">Application</h3>
            <ul className="space-y-4">
              <li><Link to="/dashboard" className="text-sm text-muted hover:text-primary transition-colors flex items-center">Tableau de bord</Link></li>
              <li><Link to="/transactions" className="text-sm text-muted hover:text-primary transition-colors flex items-center">Transactions</Link></li>
              <li><Link to="/budgets" className="text-sm text-muted hover:text-primary transition-colors flex items-center">Budgets</Link></li>
              <li><Link to="/accounts" className="text-sm text-muted hover:text-primary transition-colors flex items-center">Comptes</Link></li>
            </ul>
          </div>
          
          <div className="col-span-1 mt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-6">Finances & Gestion</h3>
            <ul className="space-y-4">
              <li><Link to="/goals" className="text-sm text-muted hover:text-primary transition-colors flex items-center">Objectifs d'épargne</Link></li>
              <li><Link to="/dettes" className="text-sm text-muted hover:text-primary transition-colors flex items-center">Gestion des dettes</Link></li>
              <li><Link to="/subscription" className="text-sm text-muted hover:text-primary transition-colors flex items-center">Abonnements</Link></li>
              <li><Link to="/notifications" className="text-sm text-muted hover:text-primary transition-colors flex items-center">Notifications</Link></li>
            </ul>
          </div>
          
          <div className="col-span-1 mt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-6">Information</h3>
            <ul className="space-y-4">
              <li><Link to="/profile" className="text-sm text-muted hover:text-primary transition-colors flex items-center">Mon Profil</Link></li>
              <li><a href="/#faq" className="text-sm text-muted hover:text-primary transition-colors flex items-center">FAQ publique</a></li>
              <li><a href="/#features" className="text-sm text-muted hover:text-primary transition-colors flex items-center">Présentation</a></li>
              <li><a href="/#contact" className="text-sm text-muted hover:text-primary transition-colors flex items-center">Nous contacter</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex space-x-3 order-2 md:order-1">
            <a href="#" className="h-9 w-9 flex items-center justify-center rounded-full bg-background border border-border text-muted hover:text-primary hover:border-primary hover:bg-primary/5 transition-all" aria-label="Twitter">
              <Twitter size={16} />
            </a>
            <a href="#" className="h-9 w-9 flex items-center justify-center rounded-full bg-background border border-border text-muted hover:text-primary hover:border-primary hover:bg-primary/5 transition-all" aria-label="Instagram">
              <Instagram size={16} />
            </a>
            <a href="#" className="h-9 w-9 flex items-center justify-center rounded-full bg-background border border-border text-muted hover:text-primary hover:border-primary hover:bg-primary/5 transition-all" aria-label="LinkedIn">
              <Linkedin size={16} />
            </a>
          </div>

          <p className="text-sm text-muted order-3 md:order-2">
            © {new Date().getFullYear()} ZenSpend. All rights reserved.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 md:space-x-6 order-1 md:order-3">
            <Link to="/legal/confidentialite" className="text-sm text-muted hover:text-primary transition-colors whitespace-nowrap">
              Confidentialité
            </Link>
            <span className="hidden md:inline text-border">•</span>
            <Link to="/legal/conditions" className="text-sm text-muted hover:text-primary transition-colors whitespace-nowrap">
              Conditions d'utilisation
            </Link>
            <span className="hidden md:inline text-border">•</span>
            <Link to="/legal/cookies" className="text-sm text-muted hover:text-primary transition-colors whitespace-nowrap">
              Cookies
            </Link>
            <span className="hidden md:inline text-border">•</span>
            <Link to="/legal/suppression-compte" className="text-sm text-muted hover:text-primary transition-colors whitespace-nowrap">
              Suppression de compte
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;