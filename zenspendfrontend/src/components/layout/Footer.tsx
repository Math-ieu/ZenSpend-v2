import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface border-t border-border pt-12 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              
              <span className="text-xl font-bold text-foreground">ZenSpend</span>
            </Link>
            <p className="text-muted text-sm mb-4">
              Simplify your finances and achieve your money goals with ease.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted hover:text-primary transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-muted hover:text-primary transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-muted hover:text-primary transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-muted hover:text-primary transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-md font-semibold mb-4 text-foreground">Product</h3>
            <ul className="space-y-2">
              <li><a href="#features" className="text-sm text-muted hover:text-primary transition-colors">Features</a></li>
              <li><a href="#" className="text-sm text-muted hover:text-primary transition-colors">Pricing</a></li>
              <li><a href="#" className="text-sm text-muted hover:text-primary transition-colors">Integrations</a></li>
              <li><a href="#" className="text-sm text-muted hover:text-primary transition-colors">What's New</a></li>
            </ul>
          </div>
          
          {/* Resources */}
          <div className="col-span-1">
            <h3 className="text-md font-semibold mb-4 text-foreground">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-muted hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="text-sm text-muted hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#faq" className="text-sm text-muted hover:text-primary transition-colors">FAQs</a></li>
              <li><a href="#" className="text-sm text-muted hover:text-primary transition-colors">Community</a></li>
            </ul>
          </div>
          
          {/* Company */}
          <div className="col-span-1">
            <h3 className="text-md font-semibold mb-4 text-foreground">Company</h3>
            <ul className="space-y-2">
              <li><a href="#about" className="text-sm text-muted hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="text-sm text-muted hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#contact" className="text-sm text-muted hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#" className="text-sm text-muted hover:text-primary transition-colors">Partners</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted">
            © 2025 ZenSpend. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-sm text-muted hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-muted hover:text-primary transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;