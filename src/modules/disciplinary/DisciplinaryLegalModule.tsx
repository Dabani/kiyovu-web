import { Tabs } from '@mantine/core';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { DisciplinaryCasesPage } from './DisciplinaryCasesPage';
import { DisciplinaryDecisionsPage } from './DisciplinaryDecisionsPage';
import { DisciplinaryNoticesPage } from './DisciplinaryNoticesPage';
import { WhistleblowerReportsPage } from './WhistleblowerReportsPage';
import { LegalMatterIntakesPage } from './LegalMatterIntakesPage';
import { LegalCaseRegisterPage } from './LegalCaseRegisterPage';

const TABS = [
  { value: 'cases', label: 'DISC-001 Cases' },
  { value: 'notices', label: 'DISC-003 Notices' },
  { value: 'decisions', label: 'DISC-002 Decisions' },
  { value: 'whistleblower-reports', label: 'DISC-005 Whistleblower' },
  { value: 'legal-intakes', label: 'LEG-001 Legal Intake' },
  { value: 'legal-register', label: 'LEG-002 Case Register' },
];

export function DisciplinaryLegalModule() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/disciplinary-legal/')[1] ?? 'cases';

  return (
    <>
      <Tabs
        value={activeTab}
        onChange={(value) => value && navigate(`/disciplinary-legal/${value}`)}
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
        <Route index element={<DisciplinaryCasesPage />} />
        <Route path="cases" element={<DisciplinaryCasesPage />} />
        <Route path="decisions" element={<DisciplinaryDecisionsPage />} />
        <Route path="notices" element={<DisciplinaryNoticesPage />} />
        <Route path="whistleblower-reports" element={<WhistleblowerReportsPage />} />
        <Route path="legal-intakes" element={<LegalMatterIntakesPage />} />
        <Route path="legal-register" element={<LegalCaseRegisterPage />} />
      </Routes>
    </>
  );
}
