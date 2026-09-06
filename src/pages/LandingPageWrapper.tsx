import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LandingPage } from '../components/landing/LandingPage';
import { AuthModal } from '../components/auth/AuthModal';

export const LandingPageWrapper: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleOpenWorkspace = () => {
    navigate('/feed');
  };

  return (
    <>
      <LandingPage
        onOpenWorkspace={handleOpenWorkspace}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenSpec={() => navigate('/spec')}
      />
      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {
            setIsAuthModalOpen(false);
            navigate('/feed');
          }}
        />
      )}
    </>
  );
};
