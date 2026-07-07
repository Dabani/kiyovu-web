import { Tabs } from '@mantine/core';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { FanClubApplicationsPage } from './FanClubApplicationsPage';
import { FanClubCertificatesPage } from './FanClubCertificatesPage';
import { FanClubAnnualReportsPage } from './FanClubAnnualReportsPage';
import { FanClubFinancialSummariesPage } from './FanClubFinancialSummariesPage';
import { FanIncidentReportsPage } from './FanIncidentReportsPage';
import { FanClubDeregistrationWarningsPage } from './FanClubDeregistrationWarningsPage';
import { FanClubPaymentConfirmationsPage } from './FanClubPaymentConfirmationsPage';
import { FanClubMembershipRegistersPage } from './FanClubMembershipRegistersPage';

const TABS = [
  { value: 'applications', label: 'FAN-001 Applications' },
  { value: 'certificates', label: 'FAN-002 Certificates' },
  { value: 'annual-reports', label: 'FAN-003 Annual Reports' },
  { value: 'financial-summaries', label: 'FAN-004 Financial Summaries' },
  { value: 'incidents', label: 'FAN-005 Incidents' },
  { value: 'deregistration', label: 'FAN-006 Deregistration' },
  { value: 'payments', label: 'FAN-007 Payments' },
  { value: 'membership-registers', label: 'FAN-008 Membership Registers' },
];

export function FanClubsModule() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/fan-clubs/')[1] ?? 'applications';

  return (
    <>
      <Tabs
        value={activeTab}
        onChange={(value) => value && navigate(`/fan-clubs/${value}`)}
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
        <Route index element={<FanClubApplicationsPage />} />
        <Route path="applications" element={<FanClubApplicationsPage />} />
        <Route path="certificates" element={<FanClubCertificatesPage />} />
        <Route path="annual-reports" element={<FanClubAnnualReportsPage />} />
        <Route path="financial-summaries" element={<FanClubFinancialSummariesPage />} />
        <Route path="incidents" element={<FanIncidentReportsPage />} />
        <Route path="deregistration" element={<FanClubDeregistrationWarningsPage />} />
        <Route path="payments" element={<FanClubPaymentConfirmationsPage />} />
        <Route path="membership-registers" element={<FanClubMembershipRegistersPage />} />
      </Routes>
    </>
  );
}
