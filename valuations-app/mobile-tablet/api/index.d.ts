// Type declarations for API client

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  status?: number;
  message?: string;
  fromCache?: boolean;
}

export interface RiskTemplate {
  id?: string;
  risktemplateid?: string;
  templateid?: string;
  name?: string;
  templatename?: string;
  description?: string;
}

export interface Appointment {
  id: string;
  appointmentId?: string;
  address: string;
  client?: string;
  clientName?: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  emailAddress?: string;
  date?: string;
  appointmentDate?: string;
  policyNo?: string;
  policyNumber?: string;
  sumInsured?: string;
  broker?: string;
  notes?: string;
  orderNumber?: string;
  status?: string;
  Invite_Status?: string;
  lastEdited?: string;
  lastModified?: string;
  submitted?: string;
  property_address?: string;
  customer_name?: string;
  appointment_date?: string;
  order_id?: string;
  location?: string;
}

// API client interface
declare const api: {
  setAuthToken: (token: string) => void;
  login: (credentials: any) => Promise<ApiResponse<any>>;
  getSurveys: () => Promise<ApiResponse<any>>;
  getSurveyDetails: (surveyId: string) => Promise<ApiResponse<any>>;
  submitSurvey: (survey: any) => Promise<ApiResponse<any>>;
  deleteSurvey: (surveyId: string) => Promise<ApiResponse<any>>;
  uploadFile: (surveyId: string, fileData: any) => Promise<ApiResponse<any>>;
  getRiskTemplates: () => Promise<ApiResponse<RiskTemplate[]>>;
  getRiskTemplateSections: (templateId: string) => Promise<ApiResponse<any>>;
  getRiskTemplateCategories: (templateId: string, sectionId: string) => Promise<ApiResponse<any>>;
  getRiskTemplateItems: (categoryId: string) => Promise<ApiResponse<any>>;
  getAppointments: () => Promise<ApiResponse<Appointment[]>>;
  getAppointmentById: (appointmentId: string) => Promise<ApiResponse<Appointment>>;
  getAppointmentsByStatus: (status: string) => Promise<ApiResponse<Appointment[]>>;
  clearAllCachedData: () => Promise<ApiResponse<any>>;
};

export default api; 