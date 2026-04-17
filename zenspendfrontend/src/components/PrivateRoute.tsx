import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLoginPathForSegment, parseSegmentRouteSlug } from '../lib/segmentRouting';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const dashboardRouteMatch = location.pathname.match(/^\/dashboard\/([^/]+)/);
    const routeSegment = parseSegmentRouteSlug(dashboardRouteMatch?.[1]);
    const loginPath = getLoginPathForSegment(routeSegment);

    // Redirect to login page with return url
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return <>{children}</>; 
};

export default PrivateRoute;