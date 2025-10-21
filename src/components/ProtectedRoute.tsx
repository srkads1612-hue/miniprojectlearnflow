import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('student' | 'instructor' | 'admin')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate home based on user role
    const redirectPath = user.role === 'instructor' ? '/instructor/home' : user.role === 'admin' ? '/admin' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
