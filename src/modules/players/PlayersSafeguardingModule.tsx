import { Tabs } from '@mantine/core';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { PlayerRegistrationsPage } from './PlayerRegistrationsPage';
import { PlayerContractsPage } from './PlayerContractsPage';
import { PlayerLoanAgreementsPage } from './PlayerLoanAgreementsPage';
import { AntiDopingDeclarationsPage } from './AntiDopingDeclarationsPage';
import { SafeguardingConcernReportsPage } from './SafeguardingConcernReportsPage';
import { ParentalConsentFormsPage } from './ParentalConsentFormsPage';
import { CodeOfConductAcknowledgementsPage } from './CodeOfConductAcknowledgementsPage';

const TABS = [
  { value: 'registrations', label: 'PLAYER-002 Registrations' },
  { value: 'contracts', label: 'PLAYER-001 Contracts' },
  { value: 'loans', label: 'PLAYER-003 Loans' },
  { value: 'anti-doping', label: 'PLAYER-004 Anti-Doping' },
  { value: 'safeguarding-concerns', label: 'SAFE-001 Concerns' },
  { value: 'parental-consent', label: 'SAFE-002 Parental Consent' },
  { value: 'conduct-acknowledgements', label: 'SAFE-003 Conduct Ack.' },
];

export function PlayersSafeguardingModule() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/players-safeguarding/')[1] ?? 'registrations';

  return (
    <>
      <Tabs
        value={activeTab}
        onChange={(value) => value && navigate(`/players-safeguarding/${value}`)}
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
        <Route index element={<PlayerRegistrationsPage />} />
        <Route path="registrations" element={<PlayerRegistrationsPage />} />
        <Route path="contracts" element={<PlayerContractsPage />} />
        <Route path="loans" element={<PlayerLoanAgreementsPage />} />
        <Route path="anti-doping" element={<AntiDopingDeclarationsPage />} />
        <Route path="safeguarding-concerns" element={<SafeguardingConcernReportsPage />} />
        <Route path="parental-consent" element={<ParentalConsentFormsPage />} />
        <Route path="conduct-acknowledgements" element={<CodeOfConductAcknowledgementsPage />} />
      </Routes>
    </>
  );
}
