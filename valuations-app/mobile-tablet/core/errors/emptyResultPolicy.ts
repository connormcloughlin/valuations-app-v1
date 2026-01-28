/**
 * Centralized Empty Result Policy
 * 
 * Defines explicit policies for handling empty results and 404 responses
 * to prevent silent masking of errors and ensure consistent behavior.
 * 
 * This replaces ad-hoc substring heuristics with explicit endpoint policies.
 */

// Policy configuration for each endpoint
export interface EmptyResultPolicy {
  treatStatus: number[]; // HTTP status codes to treat as empty (e.g., [204])
  treat404: boolean; // Whether 404 should be treated as empty result
  treatEmptyArray: boolean; // Whether empty arrays should be treated as valid empty results
  reason?: string; // Documentation reason for this policy
}

// Endpoint-specific policies
export const EMPTY_RESULT_POLICIES: Record<string, EmptyResultPolicy> = {
  // Risk assessment items - 404 means no items for this category (normal)
  'risk-assessments.items': {
    treatStatus: [204],
    treat404: true,
    treatEmptyArray: true,
    reason: 'Categories may have no items - this is normal business logic'
  },
  
  // Risk assessment categories - 404 means no categories (should be rare)
  'risk-assessments.categories': {
    treatStatus: [204],
    treat404: false, // 404 here indicates a real problem
    treatEmptyArray: true,
    reason: 'Categories should always exist - 404 indicates configuration issue'
  },
  
  // Appointments - 404 means no appointments (normal for some users)
  'appointments.list': {
    treatStatus: [204],
    treat404: true,
    treatEmptyArray: true,
    reason: 'Users may have no appointments - this is normal'
  },
  
  // Appointments list-view - 404 means no appointments matching filter (normal)
  'appointments.list-view': {
    treatStatus: [204],
    treat404: true,
    treatEmptyArray: true,
    reason: 'Users may have no appointments matching the filter criteria - this is normal'
  },
  
  // Dashboard stats - 404 should not happen
  'appointments.dashboard': {
    treatStatus: [204],
    treat404: false, // 404 here indicates a real problem
    treatEmptyArray: false,
    reason: 'Dashboard should always return stats - 404 indicates system issue'
  },
  
  // Survey items - 404 means no items for this survey (normal)
  'surveys.items': {
    treatStatus: [204],
    treat404: true,
    treatEmptyArray: true,
    reason: 'Surveys may have no items - this is normal business logic'
  },
  
  // Configuration endpoints - 404 indicates missing configuration
  'config.categories-all': {
    treatStatus: [204],
    treat404: false, // 404 here indicates missing configuration
    treatEmptyArray: false,
    reason: 'Configuration should always be available - 404 indicates setup issue'
  },
  
  'config.field-config': {
    treatStatus: [204],
    treat404: false,
    treatEmptyArray: false,
    reason: 'Field configuration should always be available'
  },
  
  'config.category-details': {
    treatStatus: [204],
    treat404: false,
    treatEmptyArray: false,
    reason: 'Category details should be available for valid categories'
  },
  
  'config.category-complete': {
    treatStatus: [204],
    treat404: false,
    treatEmptyArray: false,
    reason: 'Complete category configuration should be available'
  },
  
  'config.field-options': {
    treatStatus: [204],
    treat404: false,
    treatEmptyArray: false,
    reason: 'Field options should be available for valid fields'
  },
  
  'config.template-categories': {
    treatStatus: [204],
    treat404: false,
    treatEmptyArray: false,
    reason: 'Template categories should be available'
  },
  
  'config.category-fields': {
    treatStatus: [204],
    treat404: false,
    treatEmptyArray: false,
    reason: 'Category fields should be available for valid categories'
  }
};

/**
 * Evaluate if a response should be treated as an empty result
 * @param endpointId - The endpoint identifier
 * @param status - HTTP status code
 * @param data - Response data
 * @param errorMessage - Error message (if any)
 * @returns Object indicating whether to treat as empty and the reason
 */
export function evaluateEmptyResponse(
  endpointId: string,
  status: number,
  data: any,
  errorMessage?: string
): { 
  treatAsEmpty: boolean; 
  reason: string; 
  shouldLogWarning: boolean;
} {
  const policy = EMPTY_RESULT_POLICIES[endpointId];
  
  if (!policy) {
    // No policy defined - use default behavior (don't treat as empty)
    return {
      treatAsEmpty: false,
      reason: 'No policy defined for endpoint',
      shouldLogWarning: true
    };
  }
  
  // Check if status is in treatStatus list
  if (policy.treatStatus.includes(status)) {
    return {
      treatAsEmpty: true,
      reason: `Status ${status} is configured as empty result`,
      shouldLogWarning: false
    };
  }
  
  // Check 404 handling
  if (status === 404) {
    if (policy.treat404) {
      return {
        treatAsEmpty: true,
        reason: '404 treated as empty result per policy',
        shouldLogWarning: false
      };
    } else {
      return {
        treatAsEmpty: false,
        reason: '404 not treated as empty result per policy',
        shouldLogWarning: true
      };
    }
  }
  
  // Check if data is empty array and policy allows it
  if (Array.isArray(data) && data.length === 0 && policy.treatEmptyArray) {
    return {
      treatAsEmpty: true,
      reason: 'Empty array treated as valid empty result',
      shouldLogWarning: false
    };
  }
  
  // Default: don't treat as empty
  return {
    treatAsEmpty: false,
    reason: 'Response does not match empty result criteria',
    shouldLogWarning: status >= 400
  };
}

/**
 * Get policy for a specific endpoint
 * @param endpointId - The endpoint identifier
 * @returns Policy configuration or null if not found
 */
export function getEmptyResultPolicy(endpointId: string): EmptyResultPolicy | null {
  return EMPTY_RESULT_POLICIES[endpointId] || null;
}

/**
 * Check if an endpoint has a defined policy
 * @param endpointId - The endpoint identifier
 * @returns True if policy exists
 */
export function hasEmptyResultPolicy(endpointId: string): boolean {
  return endpointId in EMPTY_RESULT_POLICIES;
}

/**
 * List all endpoints with defined policies
 * @returns Array of endpoint IDs with policies
 */
export function getEndpointsWithPolicies(): string[] {
  return Object.keys(EMPTY_RESULT_POLICIES);
}

/**
 * Validate that all policies are properly configured
 * @returns Array of validation errors
 */
export function validatePolicies(): string[] {
  const errors: string[] = [];
  
  for (const [endpointId, policy] of Object.entries(EMPTY_RESULT_POLICIES)) {
    if (!policy.treatStatus || !Array.isArray(policy.treatStatus)) {
      errors.push(`Endpoint ${endpointId}: treatStatus must be an array`);
    }
    
    if (typeof policy.treat404 !== 'boolean') {
      errors.push(`Endpoint ${endpointId}: treat404 must be a boolean`);
    }
    
    if (typeof policy.treatEmptyArray !== 'boolean') {
      errors.push(`Endpoint ${endpointId}: treatEmptyArray must be a boolean`);
    }
  }
  
  return errors;
}



