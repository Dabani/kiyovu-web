import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { useAuthStore } from './stores/authStore';
import { MembershipModule } from './modules/membership/MembershipModule';
import { HrModule } from './modules/hr/HrModule';

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/membership/*" element={<MembershipModule />} />
          <Route path="/hr/*" element={<HrModule />} />

          {/* Further module bundle routes appended here, one block per delivery:
              <Route path="/elections/*" element={<ElectionsModule />} />
              ... */}
        </Route>
      </Route>
    </Routes>
  );
}
