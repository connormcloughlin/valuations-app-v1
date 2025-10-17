/**
 * Risk Assessment Schema Validation
 * 
 * Defines runtime validation for risk assessment entities to prevent
 * corrupt data from persisting and ensure data integrity.
 */

import { z } from 'zod';

// Risk Assessment Master schema
export const RiskAssessmentMasterSchema = z.object({
  riskassessmentid: z.number().int().positive('Risk assessment ID must be a positive integer'),
  assessmenttypename: z.string().min(1, 'Assessment type name cannot be empty'),
  surveydate: z.string().datetime('Survey date must be a valid ISO datetime'),
  clientnumber: z.string().min(1, 'Client number cannot be empty'),
  comments: z.string().optional(),
  totalvalue: z.number().min(0, 'Total value must be non-negative'),
  iscomplete: z.number().int().min(0).max(1, 'Is complete must be 0 or 1'),
  pending_sync: z.number().int().min(0).max(1).optional()
});

// Risk Assessment Item schema
export const RiskAssessmentItemSchema = z.object({
  riskassessmentitemid: z.number().int().positive('Risk assessment item ID must be a positive integer'),
  riskassessmentcategoryid: z.number().int().positive('Category ID must be a positive integer'),
  itemprompt: z.string().min(1, 'Item prompt cannot be empty'),
  itemtype: z.number().int().min(0, 'Item type must be non-negative'),
  rank: z.number().int().min(0, 'Rank must be non-negative'),
  commaseparatedlist: z.string().optional(),
  selectedanswer: z.string().optional(),
  qty: z.number().min(0, 'Quantity must be non-negative'),
  price: z.number().min(0, 'Price must be non-negative'),
  description: z.string().optional(),
  model: z.string().optional(),
  location: z.string().optional(),
  assessmentregisterid: z.number().int().min(0).optional(),
  assessmentregistertypeid: z.number().int().min(0).optional(),
  datecreated: z.string().datetime('Date created must be a valid ISO datetime').optional(),
  createdbyid: z.string().optional(),
  dateupdated: z.string().datetime('Date updated must be a valid ISO datetime').optional(),
  updatedbyid: z.string().optional(),
  issynced: z.number().int().min(0).max(1).optional(),
  syncversion: z.number().int().min(0).optional(),
  deviceid: z.string().optional(),
  syncstatus: z.string().optional(),
  synctimestamp: z.string().datetime('Sync timestamp must be a valid ISO datetime').optional(),
  hasphoto: z.number().int().min(0).max(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  notes: z.string().optional(),
  pending_sync: z.number().int().min(0).max(1).optional(),
  appointmentid: z.string().optional(),
  isDeleted: z.number().int().min(0).max(1).optional()
});

// Risk Assessment Category schema
export const RiskAssessmentCategorySchema = z.object({
  categoryId: z.number().int().positive('Category ID must be a positive integer'),
  categoryName: z.string().min(1, 'Category name cannot be empty'),
  sectionName: z.string().optional(),
  templateName: z.string().optional(),
  categoryRank: z.number().int().min(0).optional(),
  isActive: z.number().int().min(0).max(1).optional(),
  fields: z.string().optional(), // JSON string
  groupingStrategy: z.string().optional(), // JSON string
  locationTemplates: z.string().optional(), // JSON string
  summary: z.string().optional(),
  lastUpdated: z.string().datetime('Last updated must be a valid ISO datetime').optional()
});

// Risk Assessment Item List schema (for API responses)
export const RiskAssessmentItemListSchema = z.array(RiskAssessmentItemSchema);

// Risk Assessment Master List schema
export const RiskAssessmentMasterListSchema = z.array(RiskAssessmentMasterSchema);

// Risk Assessment Category List schema
export const RiskAssessmentCategoryListSchema = z.array(RiskAssessmentCategorySchema);

// Create schemas (for new entities)
export const CreateRiskAssessmentItemSchema = RiskAssessmentItemSchema.omit({
  riskassessmentitemid: true,
  datecreated: true,
  dateupdated: true,
  synctimestamp: true,
  pending_sync: true
});

export const CreateRiskAssessmentMasterSchema = RiskAssessmentMasterSchema.omit({
  riskassessmentid: true,
  pending_sync: true
});

// Update schemas (for existing entities)
export const UpdateRiskAssessmentItemSchema = RiskAssessmentItemSchema.partial().required({
  riskassessmentitemid: true
});

export const UpdateRiskAssessmentMasterSchema = RiskAssessmentMasterSchema.partial().required({
  riskassessmentid: true
});

// Type exports
export type RiskAssessmentMaster = z.infer<typeof RiskAssessmentMasterSchema>;
export type RiskAssessmentItem = z.infer<typeof RiskAssessmentItemSchema>;
export type RiskAssessmentCategory = z.infer<typeof RiskAssessmentCategorySchema>;
export type RiskAssessmentItemList = z.infer<typeof RiskAssessmentItemListSchema>;
export type RiskAssessmentMasterList = z.infer<typeof RiskAssessmentMasterListSchema>;
export type RiskAssessmentCategoryList = z.infer<typeof RiskAssessmentCategoryListSchema>;
export type CreateRiskAssessmentItem = z.infer<typeof CreateRiskAssessmentItemSchema>;
export type CreateRiskAssessmentMaster = z.infer<typeof CreateRiskAssessmentMasterSchema>;
export type UpdateRiskAssessmentItem = z.infer<typeof UpdateRiskAssessmentItemSchema>;
export type UpdateRiskAssessmentMaster = z.infer<typeof UpdateRiskAssessmentMasterSchema>;



