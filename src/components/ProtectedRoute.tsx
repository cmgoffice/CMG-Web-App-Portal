import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/auth';

interface Props {
  children: React.ReactNode;
  requireRoles?: UserRole[];
  requireApproved?: boolean;
}

export default function ProtectedRoute({
  children,
  requireRoles,
  requireApproved = true,
}: Props) {
  const { firebaseUser, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireApproved && userProfile?.status === 'pending') {
    return <Navigate to="/pending" replace />;
  }

  if (requireApproved && userProfile?.status === 'rejected') {
    return <Navigate to="/login" replace />;
  }

  if (requireRoles && userProfile && !requireRoles.includes(userProfile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
