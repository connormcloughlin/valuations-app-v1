/**
 * Transport policies for different endpoint types
 * Maps endpoint IDs to their specific timeout, retry, and caching policies
 */

export interface TransportPolicy {
  timeoutMs: number;
  retry: {
    attempts: number;
    strategy: 'exponential' | 'linear' | 'fixed';
  };
  cacheTTL?: number;
  interpretEmptyPolicyKey?: string;
}

export const policies = new Map<string, TransportPolicy>([
  // Appointments endpoints
  ['appointments.list', {
    timeoutMs: 15000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    interpretEmptyPolicyKey: 'appointments_empty'
  }],
  
  ['appointments.detail', {
    timeoutMs: 10000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 10 * 60 * 1000, // 10 minutes
    interpretEmptyPolicyKey: 'appointments_empty'
  }],
  
  ['appointments.update', {
    timeoutMs: 15000,
    retry: { attempts: 3, strategy: 'exponential' },
    interpretEmptyPolicyKey: 'appointments_empty'
  }],

  // Risk Templates endpoints
  ['risk-templates.list', {
    timeoutMs: 20000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    interpretEmptyPolicyKey: 'risk_templates_empty'
  }],
  
  ['risk-templates.sections', {
    timeoutMs: 15000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 12 * 60 * 60 * 1000, // 12 hours
    interpretEmptyPolicyKey: 'risk_templates_empty'
  }],
  
  ['risk-templates.categories', {
    timeoutMs: 15000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 12 * 60 * 60 * 1000, // 12 hours
    interpretEmptyPolicyKey: 'risk_templates_empty'
  }],
  
  ['risk-templates.items', {
    timeoutMs: 15000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 12 * 60 * 60 * 1000, // 12 hours
    interpretEmptyPolicyKey: 'risk_templates_empty'
  }],

  // Risk Assessment endpoints
  ['risk-assessments.sections', {
    timeoutMs: 15000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 30 * 60 * 1000, // 30 minutes
    interpretEmptyPolicyKey: 'risk_assessments_empty'
  }],
  
  ['risk-assessments.categories', {
    timeoutMs: 15000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 30 * 60 * 1000, // 30 minutes
    interpretEmptyPolicyKey: 'risk_assessments_empty'
  }],
  
  ['risk-assessments.items', {
    timeoutMs: 15000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 30 * 60 * 1000, // 30 minutes
    interpretEmptyPolicyKey: 'risk_assessments_empty'
  }],

  // Surveys endpoints
  ['surveys.list', {
    timeoutMs: 10000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 30 * 60 * 1000, // 30 minutes
    interpretEmptyPolicyKey: 'surveys_empty'
  }],
  
  ['surveys.submit', {
    timeoutMs: 30000,
    retry: { attempts: 3, strategy: 'exponential' },
    interpretEmptyPolicyKey: 'surveys_empty'
  }],

  // Media endpoints
  ['media.upload', {
    timeoutMs: 60000, // 1 minute for uploads
    retry: { attempts: 1, strategy: 'fixed' }, // Don't retry uploads aggressively
    interpretEmptyPolicyKey: 'media_empty'
  }],
  
  ['media.download', {
    timeoutMs: 30000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 4 * 60 * 60 * 1000, // 4 hours
    interpretEmptyPolicyKey: 'media_empty'
  }],

  ['media.image', {
    timeoutMs: 30000,
    retry: { attempts: 0, strategy: 'fixed' }, // No retries for missing images
    cacheTTL: 4 * 60 * 60 * 1000, // 4 hours
    interpretEmptyPolicyKey: 'media_empty'
  }],

  // Risk assessment endpoints
  ['risk-assessment.update-status', {
    timeoutMs: 15000,
    retry: { attempts: 2, strategy: 'exponential' },
    interpretEmptyPolicyKey: 'risk_assessment_empty'
  }],

  // Sync endpoints
  ['sync.changes', {
    timeoutMs: 20000,
    retry: { attempts: 2, strategy: 'exponential' },
    interpretEmptyPolicyKey: 'sync_empty'
  }],
  
  ['sync.batch', {
    timeoutMs: 45000,
    retry: { attempts: 2, strategy: 'exponential' },
    interpretEmptyPolicyKey: 'sync_empty'
  }],

  ['sync.media.upload', {
    timeoutMs: 120000, // 2 minutes for media uploads
    retry: { attempts: 1, strategy: 'fixed' }, // Don't retry uploads aggressively
    interpretEmptyPolicyKey: 'media_empty'
  }],

  // Mobile composite endpoints
  ['mobile.hierarchy', {
    timeoutMs: 30000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 15 * 60 * 1000, // 15 minutes
    interpretEmptyPolicyKey: 'mobile_empty'
  }],
  
  ['mobile.config', {
    timeoutMs: 20000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 30 * 60 * 1000, // 30 minutes
    interpretEmptyPolicyKey: 'mobile_empty'
  }],

  ['config.categories-all', {
    timeoutMs: 30000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours - long cache for config data
    interpretEmptyPolicyKey: 'config_empty'
  }],

  ['config.field-config', {
    timeoutMs: 15000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 12 * 60 * 60 * 1000, // 12 hours - medium cache for field config
    interpretEmptyPolicyKey: 'config_empty'
  }],

  ['config.category-details', {
    timeoutMs: 15000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 12 * 60 * 60 * 1000, // 12 hours - short cache for category details
    interpretEmptyPolicyKey: 'config_empty'
  }],

  ['config.category-complete', {
    timeoutMs: 20000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 12 * 60 * 60 * 1000, // 12 hours - medium cache for complete config
    interpretEmptyPolicyKey: 'config_empty'
  }],

  ['config.field-options', {
    timeoutMs: 10000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 12 * 60 * 60 * 1000, // 12 hours - short cache for field options
    interpretEmptyPolicyKey: 'config_empty'
  }],

  ['config.template-categories', {
    timeoutMs: 20000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 12 * 60 * 60 * 1000, // 12 hours - medium cache for template categories
    interpretEmptyPolicyKey: 'config_empty'
  }],

  ['config.category-fields', {
    timeoutMs: 15000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 12 * 60 * 60 * 1000, // 12 hours - short cache for category fields
    interpretEmptyPolicyKey: 'config_empty'
  }],

  // Authentication endpoints
  ['auth.token-exchange', {
    timeoutMs: 45000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 0, // No caching for auth
  }],

  ['auth.refresh-token', {
    timeoutMs: 30000,
    retry: { attempts: 3, strategy: 'exponential' },
    cacheTTL: 0, // No caching for auth
  }],

  // Risk Assessment QA submission
  ['risk-assessment.qa-submit', {
    timeoutMs: 30000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 0, // No caching for submissions
    interpretEmptyPolicyKey: 'risk_assessment_empty'
  }],

  // Default policy for unknown endpoints
  ['default', {
    timeoutMs: 10000,
    retry: { attempts: 2, strategy: 'exponential' },
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    interpretEmptyPolicyKey: 'default_empty'
  }]
]);

/**
 * Get policy for endpoint ID, fallback to default
 */
export function getPolicy(endpointId: string): TransportPolicy {
  return policies.get(endpointId) || policies.get('default')!;
}

/**
 * Check if endpoint has specific policy
 */
export function hasPolicy(endpointId: string): boolean {
  return policies.has(endpointId);
}
