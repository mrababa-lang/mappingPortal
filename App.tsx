import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginView } from './views/Login';
import { Dashboard } from './views/Dashboard';
import { MakesView } from './views/Makes';
import { ModelsView } from './views/Models';
import { TypesView } from './views/Types';
import { ADPMasterView } from './views/ADPMaster';
import { ADPMappingView } from './views/ADPMapping';
import { ADPMakesView } from './views/ADPMakes';
import { ADPVehicleTypesView } from './views/ADPVehicleTypes';
import { MappingReviewView } from './views/MappingReview';
import { UsersView } from './views/Users';
import { TrackingView } from './views/Tracking';
import { ConfigurationView } from './views/Configuration';
import { AuthService } from './services/authService';
import { User } from './types';
import { Loader2 } from 'lucide-react';

// Wrapper to provide User context to Layout
const LayoutWrapper = () => {
  const [user, setUser] = useState<User | null>(AuthService.getCurrentUser());

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
    window.location.href = '/login';
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout user={user} onLogout={handleLogout} />
  );
};

// Protected Route Guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = AuthService.getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginView />,
  },
  {
    path: "/",
    element: <ProtectedRoute><LayoutWrapper /></ProtectedRoute>,
    children: [
       { index: true, element: <Navigate to="/dashboard" replace /> },
       { path: "dashboard", element: <Dashboard /> },
       { path: "makes", element: <MakesView /> },
       { path: "models", element: <ModelsView /> },
       { path: "types", element: <TypesView /> },
       { path: "adp-master", element: <ADPMasterView /> },
       { path: "adp-makes", element: <ADPMakesView /> },
       { path: "adp-types", element: <ADPVehicleTypesView /> },
       { path: "adp-mapping", element: <ADPMappingView /> },
       { path: "mapping-review", element: <MappingReviewView /> },
       { path: "users", element: <UsersView /> },
       { path: "tracking", element: <TrackingView /> },
       { path: "configuration", element: <ConfigurationView /> },
    ]
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;