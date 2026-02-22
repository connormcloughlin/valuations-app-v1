/**
 * Appointment Schema Validation
 * 
 * Defines runtime validation for appointment entities to prevent
 * corrupt data from persisting and ensure data integrity.
 */

import { z } from 'zod';

// Base appointment schema - matches actual API response structure
export const AppointmentSchema = z.object({
  // Core identifiers (optional as per API)
  appointmentID: z.number().int().positive('Appointment ID must be a positive integer').optional(),
  orderID: z.union([z.number().int().positive(), z.string()], {
    errorMap: () => ({ message: 'Order ID must be a positive integer or string' })
  }).optional(),
  
  // Time fields (optional, can be null)
  startTime: z.string().datetime('Start time must be a valid ISO datetime').optional().nullable(),
  endTime: z.string().datetime('End time must be a valid ISO datetime').optional().nullable(),
  followUpDate: z.string().datetime('Follow-up date must be a valid ISO datetime').optional().nullable(),
  arrivalTime: z.string().datetime('Arrival time must be a valid ISO datetime').optional().nullable(),
  departureTime: z.string().datetime('Departure time must be a valid ISO datetime').optional().nullable(),
  
  // Status fields (optional, can be null)
  inviteStatus: z.enum(['Booked', 'In-Progress', 'Completed', 'Finalise', 'Cancelled'], {
    errorMap: () => ({ message: 'Invite status must be one of: Booked, In-Progress, Completed, Finalise, Cancelled' })
  }).optional().nullable(),
  meetingStatus: z.string().optional().nullable(),
  
  // Location and details (optional, can be null)
  location: z.string().optional().nullable(),
  address: z.string().optional(),
  comments: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  outoftown: z.string().optional().nullable(),
  surveyorComments: z.string().optional().nullable(),
  eventId: z.string().optional().nullable(),
  surveyorEmail: z.string().email('Surveyor email must be a valid email address').optional().nullable(),
  dateModified: z.string().datetime('Date modified must be a valid ISO datetime').optional().nullable(),
  
  // Additional fields from API
  id: z.string().optional(),
  appointmentId: z.string().optional(),
  client: z.string().optional(),
  clientName: z.string().optional(),
  phone: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().optional(),
  emailAddress: z.string().optional(),
  date: z.string().optional(),
  appointmentDate: z.string().optional(),
  policyNo: z.string().optional(),
  policyNumber: z.string().optional(),
  sumInsured: z.union([z.string(), z.number()]).optional().nullable(),
  broker: z.string().optional().nullable(),
  notes: z.string().optional(),
  orderNumber: z.union([z.string(), z.number()], {
    errorMap: () => ({ message: 'Order number must be a string or number' })
  }).optional(),
  status: z.string().optional(),
  Invite_Status: z.string().optional(),
  
  // Additional fields seen in logs
  surveyorID: z.string().optional().nullable(),
  lastModifiedByID: z.string().optional(),
  isSynced: z.union([z.boolean(), z.number().int().min(0).max(1)], {
    errorMap: () => ({ message: 'IsSynced must be a boolean or number' })
  }).optional(),
  syncVersion: z.number().int().min(0).optional(),
  deviceID: z.string().optional().nullable(),
  syncStatus: z.string().optional(),
  syncTimestamp: z.string().datetime('Sync timestamp must be a valid ISO datetime').optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  orderDate: z.string().optional(),
  dateCompleted: z.string().optional().nullable(),
  outOfTown: z.string().optional(),
  surveyor: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  policy: z.string().optional(),
  insurer: z.string().optional(),
  
  
  // Complex objects
  ordersList: z.any().optional(),
  originalAppointment: z.any().optional(),
  originalOrdersList: z.any().optional(),
  
  // Sync fields
  pending_sync: z.number().int().min(0).max(1).optional()
});

// Appointment list schema (for API responses)
export const AppointmentListSchema = z.array(AppointmentSchema);

// Appointment creation schema (for new appointments)
export const CreateAppointmentSchema = AppointmentSchema.omit({
  appointmentID: true,
  dateModified: true,
  pending_sync: true
});

// Appointment update schema (for existing appointments)
export const UpdateAppointmentSchema = AppointmentSchema.partial().required({
  appointmentID: true
});

// Dashboard stats schema - flexible to handle various API response formats
export const DashboardStatsSchema = z.object({
  statusCounts: z.array(z.object({
    count: z.number().int().min(0, 'Count must be non-negative'),
    inviteStatus: z.enum(['Booked', 'In-Progress', 'Completed', 'Finalise'])
  })).optional(),
  totalAppointments: z.number().int().min(0, 'Total appointments must be non-negative').optional(),
  lastUpdated: z.string().datetime('Last updated must be a valid ISO datetime').optional(),
  cacheKey: z.string().optional(),
  // Allow for flexible response structure
  data: z.any().optional(),
  success: z.boolean().optional(),
  message: z.string().optional()
});

// Type exports
export type Appointment = z.infer<typeof AppointmentSchema>;
export type AppointmentList = z.infer<typeof AppointmentListSchema>;
export type CreateAppointment = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointment = z.infer<typeof UpdateAppointmentSchema>;
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
