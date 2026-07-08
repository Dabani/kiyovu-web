import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, RequireRole } from './routes/ProtectedRoute';
import { UsersPage } from './pages/admin/UsersPage';
import { useAuthStore } from './stores/authStore';
import { MembershipModule } from './modules/membership/MembershipModule';
import { HrModule } from './modules/hr/HrModule';
import { ElectionsModule } from './modules/elections/ElectionsModule';
import { DisciplinaryLegalModule } from './modules/disciplinary/DisciplinaryLegalModule';
import { FinancialModule } from './modules/financial/FinancialModule';
import { FanClubsModule } from './modules/fanclubs/FanClubsModule';
import { PlayersSafeguardingModule } from './modules/players/PlayersSafeguardingModule';
import { OperationsModule } from './modules/operations/OperationsModule';

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/membership/*" element={<MembershipModule />} />
          <Route path="/hr/*" element={<HrModule />} />
          <Route path="/elections/*" element={<ElectionsModule />} />
          <Route path="/disciplinary-legal/*" element={<DisciplinaryLegalModule />} />
          <Route path="/financial/*" element={<FinancialModule />} />
          <Route path="/fan-clubs/*" element={<FanClubsModule />} />
          <Route path="/players-safeguarding/*" element={<PlayersSafeguardingModule />} />
          <Route path="/operations/*" element={<OperationsModule />} />
          <Route
            path="/users"
            element={
              <RequireRole role="super_admin">
                <UsersPage />
              </RequireRole>
            }
          />

          {/* All 8 module bundles (53 screens) + platform User Management are now registered. */}
        </Route>
      </Route>
    </Routes>
  );
}
