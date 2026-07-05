import { Navigate, Outlet } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { useAuthStore } from '../stores/authStore';

export function ProtectedRoute() {
  const { status } = useAuthStore();

  if (status === 'idle' || status === 'loading') {
    return (
      <Center h="100vh">
        <Loader color="kiyovuGreen" />
      </Center>
    );
  }

  if (status === 'guest') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

/** Wrap a route element in this for role-restricted pages (e.g. User Management). */
export function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const { hasRole } = useAuthStore();
  if (!hasRole(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
