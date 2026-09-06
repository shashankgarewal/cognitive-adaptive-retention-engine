/**
 * CARE - Primary Application Component
 * Multi-page architecture with separate routes for all 4 primary modules:
 * - /         -> Public Landing Page
 * - /feed     -> Work Journal Feed Page (Protected)
 * - /hub      -> Retention Hub Page (Protected)
 * - /analytics-> Analytics & Decay Page (Protected)
 * - /spec     -> Architecture Spec Page (Protected)
 *
 * Strict Auth Guard: Any manually entered protected URL automatically redirects
 * unauthenticated visitors to the public landing page (/).
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LandingPageWrapper } from './pages/LandingPageWrapper';
import { WorkJournalFeedPage } from './pages/WorkJournalFeedPage';
import { RetentionHubPage } from './pages/RetentionHubPage';
import { AnalyticsDecayPage } from './pages/AnalyticsDecayPage';
import { SpecPage } from './pages/SpecPage';
import { JournalWriterPage } from './pages/JournalWriterPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPageWrapper />} />

          {/* Dedicated Authenticated Pages (Protected by Auth Guard) */}
          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <WorkJournalFeedPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hub"
            element={
              <ProtectedRoute>
                <RetentionHubPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsDecayPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/spec"
            element={
              <ProtectedRoute>
                <SpecPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/journal/editor"
            element={
              <ProtectedRoute>
                <JournalWriterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/writer"
            element={<Navigate to="/journal/editor" replace />}
          />

          {/* Catch-all fallback redirects to Landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


