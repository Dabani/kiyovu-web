import { Tabs } from '@mantine/core';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { GuestRegisterPage } from './GuestRegisterPage';
import { SecurityIncidentReportsPage } from './SecurityIncidentReportsPage';
import { CommissionAnnualWorkPlansPage } from './CommissionAnnualWorkPlansPage';
import { CommissionKpiReportsPage } from './CommissionKpiReportsPage';

const TABS = [
  { value: 'guest-register', label: 'OPS-001 Guest Register' },
  { value: 'security-incidents', label: 'SEC-001 Security Incidents' },
  { value: 'work-plans', label: 'COMM-001 Work Plans' },
  { value: 'kpi-reports', label: 'COMM-002 KPI Reports' },
];

export function OperationsModule() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/operations/')[1] ?? 'guest-register';

  return (
    <>
      <Tabs
        value={activeTab}
        onChange={(value) => value && navigate(`/operations/${value}`)}
        mb="md"
        variant="outline"
      >
        <Tabs.List style={{ flexWrap: 'wrap' }}>
          {TABS.map((tab) => (
            <Tabs.Tab key={tab.value} value={tab.value}>{tab.label}</Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <Routes>
        <Route index element={<GuestRegisterPage />} />
        <Route path="guest-register" element={<GuestRegisterPage />} />
        <Route path="security-incidents" element={<SecurityIncidentReportsPage />} />
        <Route path="work-plans" element={<CommissionAnnualWorkPlansPage />} />
        <Route path="kpi-reports" element={<CommissionKpiReportsPage />} />
      </Routes>
    </>
  );
}
