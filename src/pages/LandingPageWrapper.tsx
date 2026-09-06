import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LandingPage } from '../components/landing/LandingPage';
import { AuthModal } from '../components/auth/AuthModal';

export const LandingPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Auto-restore active internal route on page refresh when user is logged in and did not explicitly navigate to landing
  useEffect(() => {
    if (!loading && user) {
      let userChoseLanding = false;
      try {
        userChoseLanding = sessionStorage.getItem('care_user_explicitly_chose_landing') === 'true';
      } catch {
        // ignore storage error
      }

      if (!userChoseLanding) {
        let lastRoute = '/feed';
        try {
          lastRoute =
            localStorage.getItem('care_last_internal_route') ||
            sessionStorage.getItem('care_last_active_route') ||
            '/feed';
        } catch {
          // ignore storage error
        }

        if (lastRoute && lastRoute !== '/') {
          navigate(lastRoute, { replace: true });
        }
      }
    }
  }, [user, loading, navigate]);

  const handleOpenWorkspace = () => {
    try {
      sessionStorage.removeItem('care_user_explicitly_chose_landing');
    } catch {
      // ignore
    }
    let target = '/feed';
    try {
      target = localStorage.getItem('care_last_internal_route') || '/feed';
    } catch {
      // ignore
    }
    navigate(target);
  };

  const handleOpenSpec = () => {
    try {
      sessionStorage.removeItem('care_user_explicitly_chose_landing');
    } catch {
      // ignore
    }
    navigate('/spec');
  };

  return (
    <>
      <LandingPage
        onOpenWorkspace={handleOpenWorkspace}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenSpec={handleOpenSpec}
      />
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {
            setIsAuthModalOpen(false);
            try {
              sessionStorage.removeItem('care_user_explicitly_chose_landing');
            } catch {
              // ignore
            }
            navigate('/feed');
          }}
        />
      )}
    </>
  );
};


