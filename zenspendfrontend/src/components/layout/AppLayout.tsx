import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../../contexts/AuthContext';

interface AppLayoutProps {
  requireAuth?: boolean;
  hideFooter?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ requireAuth = false, hideFooter = false }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Redirect if user is authenticated and trying to access auth pages
  if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/signup')) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default AppLayout;