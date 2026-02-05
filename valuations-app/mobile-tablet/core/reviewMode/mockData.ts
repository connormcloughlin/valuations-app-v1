/**
 * Mock API responses for Google Play review mode.
 * When the user is signed in as the mock reviewer, transportClient returns these
 * instead of calling the real backend.
 */

const MOCK_APPOINTMENTS = [
  {
    id: '1',
    appointmentId: '1',
    AppointmentID: 1,
    OrderID: 1001,
    orderNumber: '1001',
    address: '123 Review Street, Sample Town',
    Location: '123 Review Street, Sample Town',
    client: 'Sample Client Ltd',
    Client: 'Sample Client Ltd',
    date: new Date().toISOString(),
    Start_Time: new Date().toISOString(),
    inviteStatus: 'Booked',
    Invite_Status: 'Booked',
    status: 'Booked',
    policyNo: 'POL-001',
    Policy: 'POL-001',
    broker: 'Sample Broker',
  },
  {
    id: '2',
    appointmentId: '2',
    AppointmentID: 2,
    OrderID: 1002,
    orderNumber: '1002',
    address: '456 Demo Avenue, Test City',
    Location: '456 Demo Avenue, Test City',
    client: 'Demo Client Inc',
    Client: 'Demo Client Inc',
    date: new Date().toISOString(),
    Start_Time: new Date().toISOString(),
    inviteStatus: 'In-Progress',
    Invite_Status: 'In-Progress',
    status: 'In-Progress',
    policyNo: 'POL-002',
    Policy: 'POL-002',
    broker: 'Demo Broker',
  },
];

const MOCK_STATUS_COUNTS = {
  success: true,
  data: {
    statusCounts: [
      { inviteStatus: 'Booked', count: 2 },
      { inviteStatus: 'In-Progress', count: 1 },
      { inviteStatus: 'Completed', count: 1 },
      { inviteStatus: 'Finalise', count: 0 },
    ],
  },
};

const MOCK_APPOINTMENT_DETAIL = {
  id: '1',
  appointmentId: '1',
  appointmentID: 1,
  orderID: 1001,
  orderNumber: '1001',
  address: '123 Review Street, Sample Town',
  location: '123 Review Street, Sample Town',
  client: 'Sample Client Ltd',
  date: new Date().toISOString(),
  startTime: new Date().toISOString(),
  inviteStatus: 'Booked',
  ordersList: {
    orderid: 1001,
    client: 'Sample Client Ltd',
    fullAddress: '123 Review Street, Sample Town',
  },
};

const MOCK_LIST_VIEW_RESPONSE = (_params?: { page?: number; pageSize?: number }) => ({
  success: true,
  data: MOCK_APPOINTMENTS,
  meta: { totalCount: MOCK_APPOINTMENTS.length },
  total: MOCK_APPOINTMENTS.length,
  status: 200,
});

const MOCK_EMPTY_ARRAY = { success: true, data: [] };
const MOCK_SUCCESS = { success: true, data: null };
const MOCK_AUTH_VERIFY = { success: true, data: { valid: true } };
const MOCK_MINIMAL_ARRAY = (arr: unknown[] = []) => ({ success: true, data: arr });

/**
 * Get mock response for an API request when in review mode.
 * Returns the same shape as the real API so UI code does not need to change.
 */
export async function getMockResponse(
  endpointId: string | undefined,
  method: string,
  path: string,
  params?: Record<string, unknown>,
  body?: unknown
): Promise<unknown> {
  const url = (path || '').toLowerCase();
  const id = (endpointId || '').toLowerCase();

  // Auth
  if (id.includes('auth.verify') || url.includes('/auth/verify')) {
    return MOCK_AUTH_VERIFY;
  }
  if (id.includes('auth.token-exchange') || url.includes('/auth/token-exchange')) {
    return MOCK_AUTH_VERIFY;
  }
  if (id.includes('auth.refresh') || url.includes('/auth/refresh')) {
    return { success: true, data: { token: 'mock-token', refreshToken: 'mock-refresh' } };
  }

  // Dashboard status counts
  if (url.includes('status-counts') || url.includes('dashboard/status-counts')) {
    return MOCK_STATUS_COUNTS;
  }

  // Appointments list
  if (id.includes('appointments.list') && !url.includes('stats') && !url.includes('list-view')) {
    return { success: true, data: MOCK_APPOINTMENTS };
  }

  // Appointments list-view
  if (id.includes('appointments.list-view') || url.includes('/appointment/list-view')) {
    return MOCK_LIST_VIEW_RESPONSE((params || {}) as { page?: number; pageSize?: number });
  }

  // Appointments stats
  if (url.includes('/appointments/stats') || url.includes('stats')) {
    return MOCK_STATUS_COUNTS.data;
  }

  // Appointment detail (with-order or by id)
  if (id.includes('appointments.detail') || url.includes('/appointments/') && (url.includes('with-order') || /\/appointments\/\d+$/.test(path))) {
    return { success: true, data: MOCK_APPOINTMENT_DETAIL };
  }

  // Appointments update / put
  if (method === 'PUT' && (id.includes('appointments.update') || url.includes('/appointments/'))) {
    return MOCK_SUCCESS;
  }

  // Appointments with-orders
  if (id.includes('appointments.with-orders') || url.includes('/appointments/with-orders')) {
    return { success: true, data: MOCK_APPOINTMENTS, meta: { totalCount: MOCK_APPOINTMENTS.length } };
  }

  // Risk assessment
  if (id.includes('risk-assessment') || url.includes('risk-assessment')) {
    return MOCK_MINIMAL_ARRAY([]);
  }

  // Risk templates / sections / categories / items
  if (id.includes('risk-templates') || id.includes('risk-assessments.') || url.includes('risk-assessment-sections') || url.includes('risk-assessment-categories') || url.includes('risk-assessment-items')) {
    return MOCK_MINIMAL_ARRAY([]);
  }

  // Config
  if (id.includes('config') || url.includes('/config/') || url.includes('categories') || url.includes('field-config') || url.includes('field-options') || url.includes('template-categories')) {
    return MOCK_MINIMAL_ARRAY([]);
  }

  // Sync
  if (id.includes('sync') || url.includes('/sync/')) {
    return MOCK_SUCCESS;
  }

  // Media
  if (id.includes('media') || url.includes('/media/')) {
    if (method === 'DELETE') return MOCK_SUCCESS;
    return MOCK_SUCCESS;
  }

  // Default: success with empty data
  return MOCK_SUCCESS;
}
