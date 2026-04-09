export type MobilePayrollLine = {
  payrollLineId: number;
  riskAssessmentId: number;
  assessmentNo: string | null;
  clientName: string | null;
  surveyDate: string;
  riskAssessmentStatus?: string | null;
  status?: string | null;
  lineStatus?: string | null;
  assessmentStatus?: string | null;
  isReplaced?: boolean | null;
  baseFee: number;
  commissionPercent: number;
  commissionAmount: number;
  /** Optional fields added by backend payroll grouping logic */
  slaDaysOver?: number | null;
  slaCommissionMultiplier?: number | null;
  commissionAmountOriginal?: number | null;
  commissionReductionAmount?: number | null;
  commissionAmountFinal?: number | null;
  totalMileageKm: number;
  travelFee: number;
  totalPayrollAmount: number;
};

export type MobilePayrollResponse = {
  success: boolean;
  summary: {
    period: string;
    totalCommission: number;
    totalMileagePay: number;
    totalPayroll: number;
    surveyorCount: number;
    assessmentCount: number;
  };
  surveyor?: {
    surveyorStaffId: number;
    surveyorName: string;
    totalCommission: number;
    totalMileagePay: number;
    totalPayroll: number;
    assessmentCount: number;
    lines: MobilePayrollLine[];
  };
  surveyors?: Array<{
    surveyorStaffId: number;
    surveyorName: string;
    totalCommission: number;
    totalMileagePay: number;
    totalPayroll: number;
    assessmentCount: number;
    lines: MobilePayrollLine[];
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  message?: string;
  status?: number;
};

