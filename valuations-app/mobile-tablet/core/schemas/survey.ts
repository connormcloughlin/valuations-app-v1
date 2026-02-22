/**
 * Survey Schema Validation
 * 
 * Defines runtime validation for survey entities to prevent
 * corrupt data from persisting and ensure data integrity.
 */

import { z } from 'zod';

// Survey metadata schema
export const SurveyMetaSchema = z.object({
  id: z.string().min(1, 'Survey ID cannot be empty'),
  categoryId: z.string().min(1, 'Category ID cannot be empty'),
  type: z.string().min(1, 'Survey type cannot be empty'),
  description: z.string().optional(),
  model: z.string().optional(),
  selection: z.string().optional(),
  quantity: z.string().regex(/^\d+$/, 'Quantity must be a valid number string').optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid decimal number').optional(),
  room: z.string().optional(),
  notes: z.string().optional(),
  photo: z.string().optional(),
  commaseparatedlist: z.string().optional(),
  // Database fields
  qty: z.number().min(0).optional(),
  selectedanswer: z.string().optional(),
  rank: z.number().int().min(0).optional(),
  itemtype: z.number().int().min(0).optional()
});

// Survey item schema (for UI components)
export const SurveyItemSchema = z.object({
  id: z.string().min(1, 'Item ID cannot be empty'),
  categoryId: z.string().min(1, 'Category ID cannot be empty'),
  type: z.string().min(1, 'Item type cannot be empty'),
  description: z.string().optional(),
  model: z.string().optional(),
  selection: z.string().optional(),
  quantity: z.string().optional(),
  price: z.string().optional(),
  room: z.string().optional(),
  notes: z.string().optional(),
  photo: z.string().optional(),
  commaseparatedlist: z.string().optional(),
  // Additional fields for data validation
  qty: z.number().min(0).optional(),
  selectedanswer: z.string().optional(),
  rank: z.number().int().min(0).optional(),
  itemtype: z.number().int().min(0).optional()
});

// Survey list schema (for API responses)
export const SurveyListSchema = z.array(SurveyItemSchema);

// Survey creation schema (for new surveys)
export const CreateSurveyItemSchema = SurveyItemSchema.omit({
  id: true
});

// Survey update schema (for existing surveys)
export const UpdateSurveyItemSchema = SurveyItemSchema.partial().required({
  id: true
});

// Survey category schema
export const SurveyCategorySchema = z.object({
  id: z.string().min(1, 'Category ID cannot be empty'),
  name: z.string().min(1, 'Category name cannot be empty'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  fields: z.array(z.object({
    name: z.string().min(1, 'Field name cannot be empty'),
    type: z.enum(['text', 'number', 'select', 'textarea', 'checkbox', 'radio']),
    required: z.boolean().optional(),
    options: z.array(z.string()).optional()
  })).optional()
});

// Survey category list schema
export const SurveyCategoryListSchema = z.array(SurveyCategorySchema);

// Survey response schema (for API responses)
export const SurveyResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
  status: z.number().int().optional(),
  fromCache: z.boolean().optional()
});

// Type exports
export type SurveyMeta = z.infer<typeof SurveyMetaSchema>;
export type SurveyItem = z.infer<typeof SurveyItemSchema>;
export type SurveyList = z.infer<typeof SurveyListSchema>;
export type CreateSurveyItem = z.infer<typeof CreateSurveyItemSchema>;
export type UpdateSurveyItem = z.infer<typeof UpdateSurveyItemSchema>;
export type SurveyCategory = z.infer<typeof SurveyCategorySchema>;
export type SurveyCategoryList = z.infer<typeof SurveyCategoryListSchema>;
export type SurveyResponse = z.infer<typeof SurveyResponseSchema>;



