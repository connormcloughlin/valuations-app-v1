/**
 * API response interface for type safety
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  status?: number;
  fromCache?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Appointment data interface
 */
export interface AppointmentData {
  // Identifiers
  id?: string;
  appointmentId?: string;
  appointmentID?: string | number;
  
  // Address fields
  address?: string;
  location?: string;
  FullAddress?: string;
  property_address?: string;
  region?: string;
  city?: string;
  
  // Client information
  client?: string;
  clientsName?: string;
  clientName?: string;
  Client?: string;
  customer_name?: string;
  
  // Date and time fields
  date?: string;
  appointmentDate?: string;
  startTime?: string;
  Start_Time?: string;
  endTime?: string;
  appointment_date?: string;
  followUpDate?: string;
  arrivalTime?: string | null;
  departureTime?: string | null;
  dateModified?: string | null;
  orderDate?: string;
  dateCompleted?: string;
  
  // Policy and insurance information
  policyNumber?: string;
  policyNo?: string;
  Policy?: string;
  policy?: string;
  sumInsured?: string | number;
  'Sum Insured'?: string | number;
  broker?: string;
  Broker?: string;
  insurer?: string;
  
  // Notes and comments
  notes?: string;
  Comments?: string;
  comments?: string;
  surveyorComments?: string | null;
  
  // Order information
  orderNumber?: string | number;
  OrderID?: string | number;
  orderID?: string | number;
  
  // Status fields
  Invite_Status?: string;
  inviteStatus?: string;
  status?: string;
  meetingStatus?: string;
  
  // Category information
  category?: string;
  outOfTown?: string;
  outoftown?: string;
  
  // Surveyor information
  surveyor?: string;
  surveyorID?: string | number;
  surveyorEmail?: string | null;
  
  // Misc fields
  eventId?: string | null;
  
  // Nested data
  ordersList?: {
    orderid?: string | number;
    orderStatus?: string;
    policy?: string;
    clientsName?: string;
    clientID?: string | number;
    client?: string;
    Client?: string;
    sumInsured?: string | number;
    broker?: string;
    insurer?: string;
    fullAddress?: string;
    region?: string;
    city?: string;
    surveyor?: string;
    surveyorID?: string | number;
    orderdate?: string;
    dateModified?: string;
    dateAdded?: string;
    dateCompleted?: string;
    title?: string;
    initials?: string;
    requestedBy?: string;
    poNo?: string | null;
    poNo2?: string | null;
    capturedBy?: string;
    requestedByField?: string;
    month?: string;
    year?: number;
    [key: string]: any;
  };
  
  // Original data for reference
  originalAppointment?: any;
  originalOrdersList?: any;
  
  // Any other properties
  [key: string]: any;
}

/**
 * Extended API client interface
 */
export interface ApiClient {
  // Auth methods
  setAuthToken: (token: string) => void;
  login: (username: string, password: string) => Promise<ApiResponse<any>>;
  
  // Survey methods
  getSurveys: () => Promise<ApiResponse<any>>;
  getSurveyDetails: (surveyId: string) => Promise<ApiResponse<any>>;
  submitSurvey: (surveyData: any) => Promise<ApiResponse<any>>;
  deleteSurvey: (surveyId: string) => Promise<ApiResponse<any>>;
  uploadFile: (file: any, surveyId: string) => Promise<ApiResponse<any>>;
  
  // Risk template methods
  getRiskTemplates: () => Promise<ApiResponse<any>>;
  getRiskTemplateCategories: (templateId: string, sectionId: string) => Promise<ApiResponse<any>>;
  getRiskTemplateItems: (categoryId: string) => Promise<ApiResponse<any>>;
  getRiskAssessmentSections: (riskAssessmentId: string) => Promise<ApiResponse<any>>;
  
  // Appointment methods
  getAppointments: () => Promise<ApiResponse<AppointmentData[]>>;
  getAppointmentById: (appointmentId: string) => Promise<ApiResponse<AppointmentData>>;
  getAppointmentsByStatus: (status: string) => Promise<ApiResponse<AppointmentData[]>>;
  getAppointmentsWithOrders: (options?: any) => Promise<ApiResponse<AppointmentData[]>>;
  getAppointmentsWithOrdersByStatus: (status: string, options?: any) => Promise<ApiResponse<AppointmentData[]>>;
  getAppointmentsByListView: (options?: any) => Promise<ApiResponse<AppointmentData[]>>;
  
  // Offline storage methods
  clearAllCachedData: () => Promise<ApiResponse<any>>;
} 