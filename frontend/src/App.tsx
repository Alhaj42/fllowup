import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppThemeProvider } from './components/ThemeProvider';
import { useAuthStore } from './state/authStore';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import CreateProject from './pages/CreateProject';
import ProjectDetail from './pages/ProjectDetail';
import Users from './pages/Users';

export default function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);

  const redirectPath = isAuthenticated ? '/dashboard' : '/login';

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppThemeProvider>
        {/* Debug: Check if App mounts */}
        <div style={{ position: 'fixed', top: 0, left: 0, width: 1, height: 1, opacity: 0.01, pointerEvents: 'none' }}>App Mounted</div>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to={redirectPath} replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects/new" element={<CreateProject />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute requiredRole="MANAGER">
                  <Users />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to={redirectPath} replace />} />
          </Routes>
        </BrowserRouter>
      </AppThemeProvider>
    </ErrorBoundary>
  );
}
