/**
 * CARE - Header Component
 * Standardized across the application using AppNavbar for exact typography, styling, and real streaks.
 */

import React from 'react';
import { AppNavbar } from './AppNavbar';

interface HeaderProps {
  onOpenAuth: () => void;
  onViewLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth, onViewLanding }) => {
  return (
    <AppNavbar
      onOpenAuth={onOpenAuth}
      onViewLanding={onViewLanding}
    />
  );
};
