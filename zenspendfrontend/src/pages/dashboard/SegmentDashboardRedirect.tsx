import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUserSegment } from '../../hooks/useUserSegment';
import { getDashboardPathForSegment } from '../../lib/segmentRouting';

const SegmentDashboardRedirect: React.FC = () => {
  const { user } = useAuth();
  const { segment } = useUserSegment();

  const targetSegment = user?.user_segment || segment;

  return <Navigate to={getDashboardPathForSegment(targetSegment)} replace />;
};

export default SegmentDashboardRedirect;
