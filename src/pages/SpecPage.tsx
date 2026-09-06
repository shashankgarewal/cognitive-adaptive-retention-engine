import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArchitectureSpecPage } from '../components/spec/ArchitectureSpecPage';

export const SpecPage: React.FC = () => {
  const navigate = useNavigate();

  const handleViewLanding = () => {
    try {
      sessionStorage.setItem('care_user_explicitly_chose_landing', 'true');
    } catch {}
    navigate('/');
  };

  return (
    <ArchitectureSpecPage
      onSelectNav={(navId) => {
        if (navId === 'feed') navigate('/feed');
        else if (navId === 'editor' || navId === 'writer') navigate('/journal/editor');
        else if (navId === 'hub') navigate('/hub');
        else if (navId === 'analytics') navigate('/analytics');
        else if (navId === 'spec') navigate('/spec');
        else if (navId === 'landing') handleViewLanding();
      }}
      onViewLanding={handleViewLanding}
    />
  );
};
