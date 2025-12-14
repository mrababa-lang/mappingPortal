import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { LoginView } from './views/Login';
import { Dashboard } from './views/Dashboard';
import { MakesView } from './views/Makes';
import { ModelsView } from './views/Models';
import { TypesView } from './views/Types';
import { ADPMasterView } from './views/ADPMaster';
import { ADPMappingView } from './views/ADPMapping';
import { ADPMakesView } from './views/ADPMakes';
import { MappingReviewView } from './views/MappingReview';
import { UsersView } from './views/Users';
import { TrackingView } from './views/Tracking';
import { ViewState, User } from './types';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [viewParams, setViewParams] = useState<any>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
    setViewParams(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    setViewParams(null);
  };

  const handleNavigate = (view: ViewState, params?: any) => {
    setCurrentView(view);
    setViewParams(params || null);
  };

  // If not logged in, show login page
  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'makes':
        return <MakesView />;
      case 'models':
        return <ModelsView />;
      case 'types':
        return <TypesView />;
      case 'adp-master':
        return <ADPMasterView />;
      case 'adp-makes':
        return <ADPMakesView />;
      case 'adp-mapping':
        return <ADPMappingView initialParams={viewParams} />;
      case 'mapping-review':
        return <MappingReviewView />;
      case 'users':
        return <UsersView />;
      case 'tracking':
        return <TrackingView />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      user={currentUser}
    >
      {renderView()}
    </Layout>
  );
}

export default App;