import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, hasRole } from '../state/authStore';
import type { UserRole } from '../types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

/**
 * ProtectedRoute Component
 * Protects routes based on authentication and role requirements
 * 
 * Usage:
 * <ProtectedRoute requiredRole="MANAGER">
 *   <Users />
 * </ProtectedRoute>
 * 
 * Or without role requirement:
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) {
      return;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    // Check role requirement if specified
    if (requiredRole) {
      const hasRequiredRole = hasRole(requiredRole);
      if (!hasRequiredRole) {
        // Redirect to dashboard if user doesn't have the required role
        navigate('/dashboard', { replace: true });
        return;
      }
    }
  }, [isAuthenticated, isLoading, requiredRole, navigate]);

  // Show nothing while loading or redirecting
  if (isLoading || !isAuthenticated) {
    return null;
  }

  // If role is required, check it
  if (requiredRole && !hasRole(requiredRole)) {
    return null;
  }

  // Render children if all checks pass
  return <>{children}</>;
};

export default ProtectedRoute;
