/**
 * Empty Result Policy Tests
 * 
 * Tests for S3 - Centralized Empty/404 Semantics to ensure
 * consistent error handling and prevent silent masking of errors.
 */

import {
  evaluateEmptyResponse,
  getEmptyResultPolicy,
  hasEmptyResultPolicy,
  getEndpointsWithPolicies,
  validatePolicies,
  EMPTY_RESULT_POLICIES
} from '../core/errors/emptyResultPolicy';
import { handleApiError, handleApiSuccess } from '../core/errors/errorHandler';

describe('Empty Result Policy (S3)', () => {
  describe('Policy Configuration', () => {
    it('should have policies for all major endpoints', () => {
      const endpoints = getEndpointsWithPolicies();
      
      expect(endpoints).toContain('risk-assessments.items');
      expect(endpoints).toContain('appointments.list');
      expect(endpoints).toContain('appointments.dashboard');
      expect(endpoints).toContain('config.categories-all');
    });

    it('should validate all policies are properly configured', () => {
      const errors = validatePolicies();
      expect(errors).toHaveLength(0);
    });

    it('should return policy for existing endpoint', () => {
      const policy = getEmptyResultPolicy('risk-assessments.items');
      expect(policy).toBeDefined();
      expect(policy?.treat404).toBe(true);
      expect(policy?.treatEmptyArray).toBe(true);
    });

    it('should return null for non-existent endpoint', () => {
      const policy = getEmptyResultPolicy('non-existent-endpoint');
      expect(policy).toBeNull();
    });

    it('should check if endpoint has policy', () => {
      expect(hasEmptyResultPolicy('risk-assessments.items')).toBe(true);
      expect(hasEmptyResultPolicy('non-existent-endpoint')).toBe(false);
    });
  });

  describe('Empty Response Evaluation', () => {
    it('should treat 404 as empty for risk assessment items', () => {
      const result = evaluateEmptyResponse(
        'risk-assessments.items',
        404,
        null,
        'No items found for this category'
      );
      
      expect(result.treatAsEmpty).toBe(true);
      expect(result.reason).toContain('404 treated as empty result');
      expect(result.shouldLogWarning).toBe(false);
    });

    it('should not treat 404 as empty for dashboard', () => {
      const result = evaluateEmptyResponse(
        'appointments.dashboard',
        404,
        null,
        'Dashboard not found'
      );
      
      expect(result.treatAsEmpty).toBe(false);
      expect(result.reason).toContain('404 not treated as empty result');
      expect(result.shouldLogWarning).toBe(true);
    });

    it('should treat 204 status as empty', () => {
      const result = evaluateEmptyResponse(
        'risk-assessments.items',
        204,
        null
      );
      
      expect(result.treatAsEmpty).toBe(true);
      expect(result.reason).toContain('Status 204 is configured as empty result');
    });

    it('should treat empty array as valid for items endpoint', () => {
      const result = evaluateEmptyResponse(
        'risk-assessments.items',
        200,
        []
      );
      
      expect(result.treatAsEmpty).toBe(true);
      expect(result.reason).toContain('Empty array treated as valid empty result');
    });

    it('should not treat empty array as valid for dashboard', () => {
      const result = evaluateEmptyResponse(
        'appointments.dashboard',
        200,
        []
      );
      
      expect(result.treatAsEmpty).toBe(false);
      expect(result.reason).toContain('Response does not match empty result criteria');
    });

    it('should handle non-existent endpoint', () => {
      const result = evaluateEmptyResponse(
        'non-existent-endpoint',
        404,
        null
      );
      
      expect(result.treatAsEmpty).toBe(false);
      expect(result.reason).toContain('No policy defined for endpoint');
      expect(result.shouldLogWarning).toBe(true);
    });
  });

  describe('Error Handler Integration', () => {
    it('should handle 404 as empty result for items endpoint', () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'No items found for this category' }
        }
      };
      
      const result = handleApiError(error, 'risk-assessments.items');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.status).toBe(204);
      expect(result.treatAsEmpty).toBe(true);
    });

    it('should not treat 404 as empty for dashboard endpoint', () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Dashboard not found' }
        }
      };
      
      const result = handleApiError(error, 'appointments.dashboard');
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
      expect(result.treatAsEmpty).toBeUndefined();
    });

    it('should handle successful responses', () => {
      const response = {
        status: 200,
        data: [{ id: 1, name: 'Item 1' }]
      };
      
      const result = handleApiSuccess(response, 'risk-assessments.items');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ id: 1, name: 'Item 1' }]);
      expect(result.status).toBe(200);
    });

    it('should handle empty array responses', () => {
      const response = {
        status: 200,
        data: []
      };
      
      const result = handleApiSuccess(response, 'risk-assessments.items');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.status).toBe(200);
    });

    it('should fall back to cached data on network error', () => {
      const error = {
        request: {},
        message: 'Network Error'
      };
      
      const cachedData = {
        data: [{ id: 1, name: 'Cached Item' }]
      };
      
      const result = handleApiError(error, 'risk-assessments.items', cachedData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ id: 1, name: 'Cached Item' }]);
      expect(result.fromCache).toBe(true);
    });
  });

  describe('Legacy Error Handler', () => {
    it('should handle legacy 404 with substring heuristics', () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'No items found for this category' }
        }
      };
      
      const result = handleApiError(error);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.status).toBe(204);
      expect(result.treatAsEmpty).toBe(true);
    });

    it('should not treat 404 as empty without substring match', () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Resource not found' }
        }
      };
      
      const result = handleApiError(error);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
    });
  });

  describe('Policy Documentation', () => {
    it('should have documented reasons for all policies', () => {
      for (const [endpointId, policy] of Object.entries(EMPTY_RESULT_POLICIES)) {
        expect(policy.reason).toBeDefined();
        expect(policy.reason).not.toBe('');
        expect(policy.reason).toContain('should') // Should contain business justification
      }
    });

    it('should have consistent policy structure', () => {
      for (const [endpointId, policy] of Object.entries(EMPTY_RESULT_POLICIES)) {
        expect(Array.isArray(policy.treatStatus)).toBe(true);
        expect(typeof policy.treat404).toBe('boolean');
        expect(typeof policy.treatEmptyArray).toBe('boolean');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined error gracefully', () => {
      const result = handleApiError(undefined, 'risk-assessments.items');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown error occurred');
    });

    it('should handle malformed error objects', () => {
      const error = {
        response: {
          status: 404
          // Missing data property
        }
      };
      
      const result = handleApiError(error, 'risk-assessments.items');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.treatAsEmpty).toBe(true);
    });

    it('should handle non-array data in empty array check', () => {
      const result = evaluateEmptyResponse(
        'risk-assessments.items',
        200,
        'not-an-array'
      );
      
      expect(result.treatAsEmpty).toBe(false);
    });
  });
});
