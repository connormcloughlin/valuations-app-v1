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

// --- Example risk templates, sections, categories, items for reviewer mode ---
const MOCK_RISK_TEMPLATES = [
  { id: 'mock-tpl-1', riskTemplateId: 'mock-tpl-1', name: 'Sample Valuation Template', templateName: 'Sample Valuation Template', description: 'Example template for review' },
];

const MOCK_ITEMS_CAT1 = [
  { riskAssessmentItemId: 9001, riskassessmentitemid: 9001, itemPrompt: 'Condition of walls', itemprompt: 'Condition of walls', itemType: 'text', price: 0, qty: 1, selectedAnswer: '', rank: 1 },
  { riskAssessmentItemId: 9002, riskassessmentitemid: 9002, itemPrompt: 'Roof condition', itemprompt: 'Roof condition', itemType: 'text', price: 0, qty: 1, selectedAnswer: '', rank: 2 },
];
const MOCK_ITEMS_CAT2 = [
  { riskAssessmentItemId: 9003, riskassessmentitemid: 9003, itemPrompt: 'Floor covering', itemprompt: 'Floor covering', itemType: 'text', price: 0, qty: 1, selectedAnswer: '', rank: 1 },
];
const MOCK_ITEMS_CAT3 = [
  { riskAssessmentItemId: 9004, riskassessmentitemid: 9004, itemPrompt: 'Furniture value', itemprompt: 'Furniture value', itemType: 'number', price: 500, qty: 1, selectedAnswer: '', rank: 1 },
];
const MOCK_ITEMS_CAT4 = [
  { riskAssessmentItemId: 9005, riskassessmentitemid: 9005, itemPrompt: 'Electrical items', itemprompt: 'Electrical items', itemType: 'number', price: 200, qty: 1, selectedAnswer: '', rank: 1 },
];

const MOCK_CATEGORIES_SECTION1 = [
  { riskAssessmentCategoryId: 801, riskassessmentcategoryid: 801, categoryId: 801, categoryName: 'Structure', categoryname: 'Structure', riskTemplateCategoryId: 801, items: MOCK_ITEMS_CAT1 },
  { riskAssessmentCategoryId: 802, riskassessmentcategoryid: 802, categoryId: 802, categoryName: 'Fixtures', categoryname: 'Fixtures', riskTemplateCategoryId: 802, items: MOCK_ITEMS_CAT2 },
];
const MOCK_CATEGORIES_SECTION2 = [
  { riskAssessmentCategoryId: 803, riskassessmentcategoryid: 803, categoryId: 803, categoryName: 'Furniture', categoryname: 'Furniture', riskTemplateCategoryId: 803, items: MOCK_ITEMS_CAT3 },
  { riskAssessmentCategoryId: 804, riskassessmentcategoryid: 804, categoryId: 804, categoryName: 'Electronics', categoryname: 'Electronics', riskTemplateCategoryId: 804, items: MOCK_ITEMS_CAT4 },
];

const MOCK_SECTIONS = [
  { riskAssessmentSectionId: 701, riskassessmentsectionid: 701, sectionName: 'Building', sectionname: 'Building', categories: MOCK_CATEGORIES_SECTION1 },
  { riskAssessmentSectionId: 702, riskassessmentsectionid: 702, sectionName: 'Contents', sectionname: 'Contents', categories: MOCK_CATEGORIES_SECTION2 },
];

const MOCK_ASSESSMENT_MASTER = {
  riskAssessmentId: 'mock-ra-1',
  riskassessmentid: 'mock-ra-1',
  assessmentid: 'mock-ra-1',
  assessmenttypename: 'Sample Valuation Template',
  templateName: 'Sample Valuation Template',
  orderId: 1001,
  orderid: 1001,
  sections: MOCK_SECTIONS,
};

const MOCK_COMPLETE_HIERARCHY = {
  success: true,
  data: {
    assessmentMasters: [MOCK_ASSESSMENT_MASTER],
  },
};

const MOCK_RISK_ASSESSMENT_MASTER_BY_ORDER = {
  success: true,
  data: { riskAssessmentId: 'mock-ra-1', riskassessmentid: 'mock-ra-1', orderId: 1001, assessmenttypename: 'Sample Valuation Template' },
  status: 200,
};

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

  // Complete hierarchy (must be before generic risk-assessment) - caller expects { success, data: { assessmentMasters } }
  if (id.includes('risk-assessment.hierarchy') || url.includes('complete-hierarchy')) {
    return MOCK_COMPLETE_HIERARCHY;
  }

  // Section clone (mobile POST) — structure-only mock for review / offline QA
  if (
    method === 'POST' &&
    (id.includes('risk-assessment.section-clone') || url.includes('/sections/clone'))
  ) {
    return {
      success: true,
      data: {
        riskAssessmentSectionId: 799001,
        sectionName: 'Building (copy)',
        categories: [
          {
            riskAssessmentCategoryId: 899001,
            riskTemplateCategoryId: 801,
            categoryName: 'Sample category',
            items: [
              {
                riskAssessmentItemId: 999001,
                itemPrompt: 'Line 1',
                itemType: 4,
                rank: 1,
                commaSeparatedList: '',
                selectedAnswer: '',
                qty: 0,
                price: 0,
                description: '',
                model: '',
                location: '',
                notes: ''
              }
            ]
          }
        ]
      }
    };
  }

  // Risk assessment master by order - transport returns body; caller expects { success, data }
  if (id.includes('risk-assessment.master') || (url.includes('risk-assessment-master') && url.includes('by-order'))) {
    return MOCK_RISK_ASSESSMENT_MASTER_BY_ORDER.data;
  }

  // Risk templates list
  if (id.includes('risk-templates.list') || (url.includes('risk-templates') && !url.includes('sections') && !url.includes('categories') && !url.includes('items'))) {
    return MOCK_MINIMAL_ARRAY(MOCK_RISK_TEMPLATES);
  }

  // Risk assessment sections (by assessment id)
  if (id.includes('risk-assessments.sections') || url.includes('risk-assessment-master/sections') || url.includes('risk-assessment-sections')) {
    return MOCK_MINIMAL_ARRAY(MOCK_SECTIONS);
  }

  // Risk assessment categories (by section id) - path contains section id
  if (id.includes('risk-assessments.categories') || url.includes('risk-assessment-categories/section/')) {
    const sectionMatch = path.match(/\/section\/(\d+)/);
    const sectionId = sectionMatch ? sectionMatch[1] : '';
    const categories = sectionId === '701' ? MOCK_CATEGORIES_SECTION1 : sectionId === '702' ? MOCK_CATEGORIES_SECTION2 : [];
    return MOCK_MINIMAL_ARRAY(categories);
  }

  // Risk assessment items (by category id)
  if (id.includes('risk-assessments.items') || url.includes('risk-assessment-items/category/')) {
    const categoryMatch = path.match(/\/category\/(\d+)/);
    const categoryId = categoryMatch ? categoryMatch[1] : '';
    const items = categoryId === '801' ? MOCK_ITEMS_CAT1 : categoryId === '802' ? MOCK_ITEMS_CAT2 : categoryId === '803' ? MOCK_ITEMS_CAT3 : categoryId === '804' ? MOCK_ITEMS_CAT4 : [];
    return MOCK_MINIMAL_ARRAY(items);
  }

  // Risk template sections/categories/items (template flavour - same mock structure)
  if (id.includes('risk-templates.sections') || id.includes('risk-templates.categories') || id.includes('risk-templates.items')) {
    if (url.includes('risk-assessment-categories/section/')) {
      const sectionMatch = path.match(/\/section\/(\d+)/);
      const sectionId = sectionMatch ? sectionMatch[1] : '';
      const categories = sectionId === '701' ? MOCK_CATEGORIES_SECTION1 : sectionId === '702' ? MOCK_CATEGORIES_SECTION2 : [];
      return MOCK_MINIMAL_ARRAY(categories);
    }
    if (url.includes('risk-assessment-items/category/')) {
      const categoryMatch = path.match(/\/category\/(\d+)/);
      const categoryId = categoryMatch ? categoryMatch[1] : '';
      const items = categoryId === '801' ? MOCK_ITEMS_CAT1 : categoryId === '802' ? MOCK_ITEMS_CAT2 : categoryId === '803' ? MOCK_ITEMS_CAT3 : categoryId === '804' ? MOCK_ITEMS_CAT4 : [];
      return MOCK_MINIMAL_ARRAY(items);
    }
    return MOCK_MINIMAL_ARRAY(MOCK_SECTIONS);
  }

  // Other risk assessment / template endpoints
  if (id.includes('risk-assessment') || id.includes('risk-templates') || url.includes('risk-assessment')) {
    return MOCK_MINIMAL_ARRAY([]);
  }

  // All category configurations (prefetchService expects { success, data: { categories } } with categoryConfig.category)
  if (id.includes('config.categories-all') || url.includes('categories/all/complete')) {
    const makeCategoryConfig = (categoryId: number, categoryName: string, sectionName: string) => ({
      category: { categoryId, categoryName, sectionName, templateName: 'Sample Valuation Template', categoryRank: categoryId, isActive: true },
      fields: [],
      groupingStrategy: null,
      locationTemplates: [],
      summary: null,
    });
    return {
      success: true,
      data: {
        categories: [
          makeCategoryConfig(801, 'Structure', 'Building'),
          makeCategoryConfig(802, 'Fixtures', 'Building'),
          makeCategoryConfig(803, 'Furniture', 'Contents'),
          makeCategoryConfig(804, 'Electronics', 'Contents'),
        ],
      },
    };
  }

  // Order-specific field config (same shape as all categories for consistency)
  if (id.includes('config.order.categories') || (url.includes('/config/order/') && url.includes('categories/complete'))) {
    const makeCategoryConfig = (categoryId: number, categoryName: string, sectionName: string) => ({
      category: { categoryId, categoryName, sectionName, templateName: 'Sample Valuation Template', categoryRank: categoryId, isActive: true },
      fields: [],
      groupingStrategy: null,
      locationTemplates: [],
      summary: null,
    });
    return {
      success: true,
      data: {
        categories: [
          makeCategoryConfig(801, 'Structure', 'Building'),
          makeCategoryConfig(802, 'Fixtures', 'Building'),
          makeCategoryConfig(803, 'Furniture', 'Contents'),
          makeCategoryConfig(804, 'Electronics', 'Contents'),
        ],
      },
    };
  }

  // Other config endpoints
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
