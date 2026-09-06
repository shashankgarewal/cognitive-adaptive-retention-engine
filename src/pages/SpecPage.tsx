import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArchitectureSpecPage } from '../components/spec/ArchitectureSpecPage';

export const SpecPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ArchitectureSpecPage
      onSelectNav={(navId) => {
        if (navId === 'feed') navigate('/feed');
        else if (navId === 'hub') navigate('/hub');
        else if (navId === 'analytics') navigate('/analytics');
        else if (navId === 'spec') navigate('/spec');
        else if (navId === 'landing') navigate('/');
      }}
      onViewLanding={() => navigate('/')}
    />
  );
};
