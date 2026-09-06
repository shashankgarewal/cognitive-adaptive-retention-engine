import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingPage } from '../components/landing/LandingPage';
import { AuthModal } from '../components/auth/AuthModal';

export const LandingPageWrapper: React.FC = () => {
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
          isOpen={isAuthModalOpen}
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

