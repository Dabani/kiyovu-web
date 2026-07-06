import { Tabs } from '@mantine/core';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ElectionNominationsPage } from './ElectionNominationsPage';
import { ElectionTallySheetsPage } from './ElectionTallySheetsPage';
import { ElectionResultsCertificationsPage } from './ElectionResultsCertificationsPage';
import { ElectionHandoverReportsPage } from './ElectionHandoverReportsPage';
import { ElectionDisputesPage } from './ElectionDisputesPage';

const TABS = [
  { value: 'nominations', label: 'ELEC-001 Nominations' },
  { value: 'tally-sheets', label: 'ELEC-002 Tally Sheets' },
  { value: 'results-certifications', label: 'ELEC-003 Results Certification' },
  { value: 'handover-reports', label: 'ELEC-004 Handover Reports' },
  { value: 'disputes', label: 'ELEC-005 Disputes' },
];

export function ElectionsModule() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/elections/')[1] ?? 'nominations';

  return (
    <>
      <Tabs
        value={activeTab}
        onChange={(value) => value && navigate(`/elections/${value}`)}
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
        <Route index element={<ElectionNominationsPage />} />
        <Route path="nominations" element={<ElectionNominationsPage />} />
        <Route path="tally-sheets" element={<ElectionTallySheetsPage />} />
        <Route path="results-certifications" element={<ElectionResultsCertificationsPage />} />
        <Route path="handover-reports" element={<ElectionHandoverReportsPage />} />
        <Route path="disputes" element={<ElectionDisputesPage />} />
      </Routes>
    </>
  );
}
