import React, { useEffect } from 'react';
import { useAppStore } from './lib/store';
import { Layout } from './components/Layout';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Import Views
import { HomeView } from './components/views/HomeView';
import { AnalysisView } from './components/views/AnalysisView';
import { SuccessView } from './components/views/SuccessView';
import { HistoryView } from './components/views/HistoryView';
import { ProfileView } from './components/views/ProfileView';
import { LoginView } from './components/views/LoginView';
import { ResumeMakerView } from './components/views/ResumeMakerView';

function App() {
  const { currentView, loadHistory, initializeAuth, user } = useAppStore();

  useEffect(() => {
    initializeAuth();
    loadHistory();
  }, [initializeAuth, loadHistory]);

  const renderView = () => {
    // Auth Guard
    if (!user) {
      return <LoginView />;
    }

    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'analysis':
        return <AnalysisView />;
      case 'resume-maker':
        return <ResumeMakerView />;
      case 'success':
        return <SuccessView />;
      case 'history':
        return <HistoryView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <HomeView />;
    }
  };

  if (!user) {
    // Don't wrap Login in the standard Layout (no sidebar/header if desired, or yes?)
    // For now, let's keep it clean or wrap it if we want the header. 
    // Based on the LoginView design, it has its own layout.
    return <LoginView />;
  }

  return (
    <ErrorBoundary>
      <Layout>
        {renderView()}
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
