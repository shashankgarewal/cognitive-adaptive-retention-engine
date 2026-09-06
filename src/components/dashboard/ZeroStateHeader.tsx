/**
 * CARE - ZeroStateHeader Component
 * Standardized across the application using AppNavbar for exact typography, styling, and real streaks.
 */

import React from 'react';
import { AppNavbar } from '../layout/AppNavbar';
import { JournalEntry, TopicRetentionState } from '../../types';

interface ZeroStateHeaderProps {
  onLogClick?: () => void;
  onViewLanding?: () => void;
  onOpenAuth?: () => void;
  onToggleBlueprint?: () => void;
  activeNav?: string;
  onSelectNav?: (nav: string) => void;
  entries?: JournalEntry[];
  topics?: TopicRetentionState[];
  logStreak?: number;
  recallStreak?: number;
}

export const ZeroStateHeader: React.FC<ZeroStateHeaderProps> = ({
  onLogClick,
  onViewLanding,
  onOpenAuth,
  activeNav = 'feed',
  onSelectNav,
  entries,
  topics,
  logStreak,
  recallStreak,
}) => {
  return (
    <AppNavbar
      activeNav={activeNav}
      onSelectNav={onSelectNav}
      onLogClick={onLogClick}
      onOpenAuth={onOpenAuth}
      onViewLanding={onViewLanding}
      entries={entries}
      topics={topics}
      logStreak={logStreak}
      recallStreak={recallStreak}
    />
  );
};
