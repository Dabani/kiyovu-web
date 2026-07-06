import { Tabs } from '@mantine/core';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { HrEmploymentContractsPage } from './HrEmploymentContractsPage';
import { HrBackgroundChecksPage } from './HrBackgroundChecksPage';
import { HrConflictOfInterestPage } from './HrConflictOfInterestPage';
import { HrGiftDeclarationsPage } from './HrGiftDeclarationsPage';
import { RecruitmentCandidatesPage } from './RecruitmentCandidatesPage';
import { HrInterviewScoresPage } from './HrInterviewScoresPage';
import { HrAppointmentRecommendationsPage } from './HrAppointmentRecommendationsPage';

const TABS = [
  { value: 'shortlisting', label: 'HR-005 Shortlisting' },
  { value: 'background-checks', label: 'HR-002 Background Checks' },
  { value: 'interview-scores', label: 'HR-006 Interview Scores' },
  { value: 'appointment-recommendations', label: 'HR-007 Recommendations' },
  { value: 'employment-contracts', label: 'HR-001 Contracts' },
  { value: 'conflict-of-interest', label: 'HR-003 Conflict of Interest' },
  { value: 'gift-declarations', label: 'HR-004 Gift Declarations' },
];

export function HrModule() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/hr/')[1] ?? 'shortlisting';

  return (
    <>
      <Tabs
        value={activeTab}
        onChange={(value) => value && navigate(`/hr/${value}`)}
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
        <Route index element={<RecruitmentCandidatesPage />} />
        <Route path="shortlisting" element={<RecruitmentCandidatesPage />} />
        <Route path="background-checks" element={<HrBackgroundChecksPage />} />
        <Route path="interview-scores" element={<HrInterviewScoresPage />} />
        <Route path="appointment-recommendations" element={<HrAppointmentRecommendationsPage />} />
        <Route path="employment-contracts" element={<HrEmploymentContractsPage />} />
        <Route path="conflict-of-interest" element={<HrConflictOfInterestPage />} />
        <Route path="gift-declarations" element={<HrGiftDeclarationsPage />} />
      </Routes>
    </>
  );
}
