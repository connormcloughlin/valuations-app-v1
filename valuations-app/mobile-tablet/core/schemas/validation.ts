/**
 * Schema Validation Utility
 * 
 * Provides centralized validation functions that integrate with
 * the schema definitions to ensure data integrity.
 */

import { z } from 'zod';

// Custom error class for validation failures
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any,
    public context: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Validation result interface
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  warnings?: string[];
}

/**
 * Validate data against a schema with detailed error reporting
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Context for error reporting (e.g., 'API response', 'Database insert')
 * @returns Validation result with success status and errors
 */
export function validateOrReject<T>(
  schema: z.ZodSchema<T>,
  data: any,
  context: string
): ValidationResult<T> {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    } else {
      const errors = result.error.errors.map(error => 
        new ValidationError(
          error.message,
          error.path.join('.'),
          error.input,
          context
        )
      );
      
      return {
        success: false,
        errors
      };
    }
  } catch (error) {
    return {
      success: false,
      errors: [new ValidationError(
        `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'root',
        data,
        context
      )]
    };
  }
}

/**
 * Validate data and return validated data or throw error
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Context for error reporting
 * @returns Validated data
 * @throws ValidationError if validation fails
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: any,
  context: string
): T {
  const result = validateOrReject(schema, data, context);
  
  if (result.success) {
    return result.data!;
  } else {
    const errorMessages = result.errors!.map(e => `${e.field}: ${e.message}`).join(', ');
    throw new ValidationError(
      `Validation failed in ${context}: ${errorMessages}`,
      'root',
      data,
      context
    );
  }
}

/**
 * Validate data with warnings for non-critical issues
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Context for error reporting
 * @param strict - Whether to treat warnings as errors
 * @returns Validation result with warnings
 */
export function validateWithWarnings<T>(
  schema: z.ZodSchema<T>,
  data: any,
  context: string,
  strict: boolean = false
): ValidationResult<T> {
  const result = validateOrReject(schema, data, context);
  
  if (result.success) {
    // Check for potential issues that don't fail validation
    const warnings: string[] = [];
    
    // Add warnings for common issues
    if (typeof data === 'object' && data !== null) {
      Object.keys(data).forEach(key => {
        if (data[key] === '' && key !== 'comments' && key !== 'notes') {
          warnings.push(`Empty string value for ${key} may indicate data quality issue`);
        }
        if (data[key] === null && key !== 'pending_sync') {
          warnings.push(`Null value for ${key} may indicate missing data`);
        }
      });
    }
    
    return {
      success: true,
      data: result.data,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } else {
    return result;
  }
}

/**
 * Validate array data with individual item validation
 * @param schema - Zod schema for individual items
 * @param data - Array data to validate
 * @param context - Context for error reporting
 * @returns Validation result with item-level errors
 */
export function validateArray<T>(
  schema: z.ZodSchema<T>,
  data: any[],
  context: string
): ValidationResult<T[]> {
  if (!Array.isArray(data)) {
    return {
      success: false,
      errors: [new ValidationError(
        'Expected array data',
        'root',
        data,
        context
      )]
    };
  }
  
  const validatedItems: T[] = [];
  const allErrors: ValidationError[] = [];
  
  data.forEach((item, index) => {
    const itemResult = validateOrReject(schema, item, `${context}[${index}]`);
    
    if (itemResult.success) {
      validatedItems.push(itemResult.data!);
    } else {
      allErrors.push(...itemResult.errors!);
    }
  });
  
  if (allErrors.length > 0) {
    return {
      success: false,
      errors: allErrors
    };
  }
  
  return {
    success: true,
    data: validatedItems
  };
}

/**
 * Validate data with redaction for logging
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Context for error reporting
 * @returns Validation result with redacted error details
 */
export function validateWithRedaction<T>(
  schema: z.ZodSchema<T>,
  data: any,
  context: string
): ValidationResult<T> {
  const result = validateOrReject(schema, data, context);
  
  if (!result.success) {
    // Redact sensitive data from error messages
    const redactedErrors = result.errors!.map(error => {
      const redactedValue = redactSensitiveData(error.value);
      return new ValidationError(
        error.message,
        error.field,
        redactedValue,
        error.context
      );
    });
    
    return {
      success: false,
      errors: redactedErrors
    };
  }
  
  return result;
}

/**
 * Redact sensitive data for logging
 * @param value - Value to redact
 * @returns Redacted value
 */
function redactSensitiveData(value: any): any {
  if (typeof value === 'string') {
    if (value.includes('@')) {
      return '[REDACTED_EMAIL]';
    }
    if (value.length > 20) {
      return value.substring(0, 10) + '...[REDACTED]';
    }
  }
  
  if (typeof value === 'object' && value !== null) {
    const redacted: any = {};
    Object.keys(value).forEach(key => {
      if (key.toLowerCase().includes('email') || 
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('password')) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSensitiveData(value[key]);
      }
    });
    return redacted;
  }
  
  return value;
}

/**
 * Get validation summary for logging
 * @param result - Validation result
 * @returns Summary string for logging
 */
export function getValidationSummary(result: ValidationResult<any>): string {
  if (result.success) {
    return `Validation successful${result.warnings ? ` (${result.warnings.length} warnings)` : ''}`;
  } else {
    const errorCount = result.errors?.length || 0;
    const errorFields = result.errors?.map(e => e.field).join(', ') || 'unknown';
    return `Validation failed: ${errorCount} errors in fields [${errorFields}]`;
  }
}
