import { Tabs } from '@mantine/core';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { PaymentAuthorizationsPage } from './PaymentAuthorizationsPage';
import { PettyCashVouchersPage } from './PettyCashVouchersPage';
import { ProcurementRfqsPage } from './ProcurementRfqsPage';
import { ProcurementTendersPage } from './ProcurementTendersPage';
import { WrittenContractsPage } from './WrittenContractsPage';
import { AssetRegisterPage } from './AssetRegisterPage';
import { AssetHandoversPage } from './AssetHandoversPage';

const TABS = [
  { value: 'payment-authorizations', label: 'FIN-001 Payments' },
  { value: 'petty-cash', label: 'FIN-003 Petty Cash' },
  { value: 'rfqs', label: 'PROC-002 RFQs' },
  { value: 'tenders', label: 'PROC-003 Tenders' },
  { value: 'contracts', label: 'PROC-004 Contracts' },
  { value: 'asset-register', label: 'ASSET-001 Register' },
  { value: 'asset-handovers', label: 'ASSET-003 Handovers' },
];

export function FinancialModule() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/financial/')[1] ?? 'payment-authorizations';

  return (
    <>
      <Tabs
        value={activeTab}
        onChange={(value) => value && navigate(`/financial/${value}`)}
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
        <Route index element={<PaymentAuthorizationsPage />} />
        <Route path="payment-authorizations" element={<PaymentAuthorizationsPage />} />
        <Route path="petty-cash" element={<PettyCashVouchersPage />} />
        <Route path="rfqs" element={<ProcurementRfqsPage />} />
        <Route path="tenders" element={<ProcurementTendersPage />} />
        <Route path="contracts" element={<WrittenContractsPage />} />
        <Route path="asset-register" element={<AssetRegisterPage />} />
        <Route path="asset-handovers" element={<AssetHandoversPage />} />
      </Routes>
    </>
  );
}
