import transportClient from '../core/transport/transportClient';
import type { MobilePayrollResponse } from '../types/payroll';

export async function getCommissionPayroll(params: {
  period: string;
  page?: number;
  pageSize?: number;
}): Promise<MobilePayrollResponse> {
  const { period, page = 1, pageSize = 25 } = params;

  return transportClient.get<MobilePayrollResponse>(
    'payroll.commission',
    '/mobile/payroll/commission',
    { period, page, pageSize }
  );
}

