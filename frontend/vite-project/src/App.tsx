import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppThemeProvider } from './components/ThemeProvider';
import { useAuthStore } from './state/authStore';
import Dashboard from './pages/Dashboard';
import './style.css';

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <AppThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Navigate to="/dashboard" replace />} />
          <Route path="/projects/:id" element={<div>Project Detail - Coming Soon</div>} />
          <Route path="/login" element={<div>Login - Coming Soon</div>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppThemeProvider>
  );
}

export default App;
