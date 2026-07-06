import { Tabs } from '@mantine/core';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { MemberApplicationsPage } from './MemberApplicationsPage';
import { MemberAcknowledgementsPage } from './MemberAcknowledgementsPage';
import { MemberInformationRequestsPage } from './MemberInformationRequestsPage';
import { MemberInactiveStatusRequestsPage } from './MemberInactiveStatusRequestsPage';
import { MemberFeeWaiverRequestsPage } from './MemberFeeWaiverRequestsPage';
import { MemberResignationsPage } from './MemberResignationsPage';
import { MemberReinstatementRequestsPage } from './MemberReinstatementRequestsPage';
import { HonoraryNominationsPage } from './HonoraryNominationsPage';
import { HonoraryNominationDossiersPage } from './HonoraryNominationDossiersPage';

const TABS = [
  { value: 'applications', label: 'MEM-001 Applications' },
  { value: 'acknowledgements', label: 'MEM-002 Acknowledgement' },
  { value: 'information-requests', label: 'MEM-003 Info Requests' },
  { value: 'inactive-status', label: 'MEM-004 Inactive Status' },
  { value: 'fee-waivers', label: 'MEM-005 Fee Waivers' },
  { value: 'resignations', label: 'MEM-006 Resignations' },
  { value: 'reinstatements', label: 'MEM-007 Reinstatement' },
  { value: 'honorary-nominations', label: 'HON-001 Honorary Nominations' },
  { value: 'honorary-dossiers', label: 'HON-002 Nomination Dossiers' },
];

export function MembershipModule() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/membership/')[1] ?? 'applications';

  return (
    <>
      <Tabs
        value={activeTab}
        onChange={(value) => value && navigate(`/membership/${value}`)}
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
        <Route index element={<MemberApplicationsPage />} />
        <Route path="applications" element={<MemberApplicationsPage />} />
        <Route path="acknowledgements" element={<MemberAcknowledgementsPage />} />
        <Route path="information-requests" element={<MemberInformationRequestsPage />} />
        <Route path="inactive-status" element={<MemberInactiveStatusRequestsPage />} />
        <Route path="fee-waivers" element={<MemberFeeWaiverRequestsPage />} />
        <Route path="resignations" element={<MemberResignationsPage />} />
        <Route path="reinstatements" element={<MemberReinstatementRequestsPage />} />
        <Route path="honorary-nominations" element={<HonoraryNominationsPage />} />
        <Route path="honorary-dossiers" element={<HonoraryNominationDossiersPage />} />
      </Routes>
    </>
  );
}
