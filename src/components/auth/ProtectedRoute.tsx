import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center font-mono text-xs text-[#006948]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#006948]" />
          <span>Verifying cryptographic session token...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to landing page whenever not logged in, regardless of what page was manually entered
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
