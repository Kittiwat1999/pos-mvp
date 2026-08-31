import type { ReactElement } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/** Layout boundary for authenticated staff routes. */
export default function StaffRoutes() {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
}
