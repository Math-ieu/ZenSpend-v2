import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useUserStore } from '../../store/useUserStore';

interface AppLayoutProps {
  requireAuth?: boolean;
  hideFooter?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ requireAuth = false, hideFooter = false }) => {
  const { isAuthenticated, isLoading } = useUserStore();
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Redirect if authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect if user is authenticated and trying to access auth pages
  if (isAuthenticated && (window.location.pathname === '/login' || window.location.pathname === '/signup')) {
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