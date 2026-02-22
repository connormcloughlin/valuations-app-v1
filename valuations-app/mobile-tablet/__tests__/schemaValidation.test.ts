/**
 * Schema Validation Tests
 * 
 * Comprehensive tests for the schema validation system to ensure
 * data integrity and proper error handling.
 */

import { 
  AppointmentSchema, 
  AppointmentListSchema, 
  RiskAssessmentItemSchema,
  RiskAssessmentMasterSchema,
  SurveyItemSchema,
  DashboardStatsSchema,
  validateOrReject,
  validateArray,
  validateWithWarnings,
  ValidationError
} from '../core/schemas';

describe('Schema Validation', () => {
  describe('Appointment Schema', () => {
    const validAppointment = {
      appointmentID: 12345,
      orderID: 67890,
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T12:00:00Z',
      inviteStatus: 'Booked',
      location: '123 Main St, City',
      comments: 'Test appointment',
      category: 'Residential',
      surveyorEmail: 'surveyor@example.com'
    };

    const minimalAppointment = {
      // Minimal valid appointment with just required fields
      id: 'appointment-123',
      address: '123 Main St'
    };

    const appointmentWithNulls = {
      appointmentID: 12345,
      orderID: '67890', // String orderID
      startTime: null,
      endTime: null,
      inviteStatus: null,
      location: null,
      comments: null,
      surveyorEmail: null
    };

    it('should validate a correct appointment', () => {
      const result = validateOrReject(AppointmentSchema, validAppointment, 'test');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validAppointment);
    });

    it('should validate a minimal appointment', () => {
      const result = validateOrReject(AppointmentSchema, minimalAppointment, 'test');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(minimalAppointment);
    });

    it('should validate an appointment with null values', () => {
      const result = validateOrReject(AppointmentSchema, appointmentWithNulls, 'test');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(appointmentWithNulls);
    });

    it('should validate an appointment with string orderID', () => {
      const appointmentWithStringOrderID = {
        appointmentID: 12345,
        orderID: '67890', // String orderID should be valid
        inviteStatus: 'Booked'
      };
      const result = validateOrReject(AppointmentSchema, appointmentWithStringOrderID, 'test');
      expect(result.success).toBe(true);
    });

    it('should reject appointment with invalid ID', () => {
      const invalidAppointment = { ...validAppointment, appointmentID: -1 };
      const result = validateOrReject(AppointmentSchema, invalidAppointment, 'test');
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].message).toContain('positive integer');
    });

    it('should reject appointment with invalid status', () => {
      const invalidAppointment = { ...validAppointment, inviteStatus: 'InvalidStatus' };
      const result = validateOrReject(AppointmentSchema, invalidAppointment, 'test');
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Booked, In-Progress, Completed, Finalise, Cancelled');
    });

    it('should reject appointment with invalid email', () => {
      const invalidAppointment = { ...validAppointment, surveyorEmail: 'invalid-email' };
      const result = validateOrReject(AppointmentSchema, invalidAppointment, 'test');
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('valid email address');
    });

    it('should reject appointment with invalid datetime', () => {
      const invalidAppointment = { ...validAppointment, startTime: 'invalid-datetime' };
      const result = validateOrReject(AppointmentSchema, invalidAppointment, 'test');
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('valid ISO datetime');
    });
  });

  describe('Appointment List Schema', () => {
    const validAppointments = [
      {
        appointmentID: 1,
        inviteStatus: 'Booked',
        location: 'Location 1'
      },
      {
        appointmentID: 2,
        inviteStatus: 'In-Progress',
        location: 'Location 2'
      }
    ];

    it('should validate a correct appointment list', () => {
      const result = validateArray(AppointmentSchema, validAppointments, 'test');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should reject list with invalid appointments', () => {
      const invalidAppointments = [
        { appointmentID: 1, inviteStatus: 'Booked' },
        { appointmentID: -1, inviteStatus: 'InvalidStatus' } // Invalid ID and status
      ];
      const result = validateArray(AppointmentSchema, invalidAppointments, 'test');
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it('should reject non-array data', () => {
      const result = validateArray(AppointmentSchema, 'not-an-array', 'test');
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Expected array data');
    });
  });

  describe('Risk Assessment Schema', () => {
    const validRiskItem = {
      riskassessmentitemid: 12345,
      riskassessmentcategoryid: 67890,
      itemprompt: 'Test prompt',
      itemtype: 1,
      rank: 1,
      qty: 5,
      price: 100.50,
      description: 'Test description',
      latitude: 40.7128,
      longitude: -74.0060
    };

    it('should validate a correct risk assessment item', () => {
      const result = validateOrReject(RiskAssessmentItemSchema, validRiskItem, 'test');
      expect(result.success).toBe(true);
    });

    it('should reject item with invalid coordinates', () => {
      const invalidItem = { ...validRiskItem, latitude: 200, longitude: 300 };
      const result = validateOrReject(RiskAssessmentItemSchema, invalidItem, 'test');
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors![0].message).toContain('latitude');
      expect(result.errors![1].message).toContain('longitude');
    });

    it('should reject item with negative quantity', () => {
      const invalidItem = { ...validRiskItem, qty: -1 };
      const result = validateOrReject(RiskAssessmentItemSchema, invalidItem, 'test');
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('non-negative');
    });
  });

  describe('Survey Schema', () => {
    const validSurveyItem = {
      id: 'survey-123',
      categoryId: 'cat-456',
      type: 'text',
      description: 'Test survey item',
      quantity: '5',
      price: '100.50',
      room: 'Living Room',
      notes: 'Test notes'
    };

    it('should validate a correct survey item', () => {
      const result = validateOrReject(SurveyItemSchema, validSurveyItem, 'test');
      expect(result.success).toBe(true);
    });

    it('should reject item with invalid quantity format', () => {
      const invalidItem = { ...validSurveyItem, quantity: 'not-a-number' };
      const result = validateOrReject(SurveyItemSchema, invalidItem, 'test');
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('valid number string');
    });

    it('should reject item with invalid price format', () => {
      const invalidItem = { ...validSurveyItem, price: 'invalid-price' };
      const result = validateOrReject(SurveyItemSchema, invalidItem, 'test');
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('valid decimal number');
    });
  });

  describe('Dashboard Stats Schema', () => {
    const validStats = {
      statusCounts: [
        { count: 5, inviteStatus: 'Booked' },
        { count: 3, inviteStatus: 'In-Progress' },
        { count: 2, inviteStatus: 'Completed' }
      ],
      totalAppointments: 10,
      lastUpdated: '2024-01-15T10:00:00Z'
    };

    it('should validate correct dashboard stats', () => {
      const result = validateOrReject(DashboardStatsSchema, validStats, 'test');
      expect(result.success).toBe(true);
    });

    it('should reject stats with negative counts', () => {
      const invalidStats = {
        ...validStats,
        statusCounts: [
          { count: -1, inviteStatus: 'Booked' }
        ]
      };
      const result = validateOrReject(DashboardStatsSchema, invalidStats, 'test');
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('non-negative');
    });

    it('should reject stats with invalid status', () => {
      const invalidStats = {
        ...validStats,
        statusCounts: [
          { count: 5, inviteStatus: 'InvalidStatus' }
        ]
      };
      const result = validateOrReject(DashboardStatsSchema, invalidStats, 'test');
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Booked, In-Progress, Completed, Finalise');
    });
  });

  describe('Validation Utilities', () => {
    describe('validateWithWarnings', () => {
      it('should return warnings for empty strings', () => {
        const dataWithEmptyStrings = {
          appointmentID: 12345,
          inviteStatus: 'Booked',
          location: '', // Empty string
          comments: '' // Empty string
        };
        
        const result = validateWithWarnings(AppointmentSchema, dataWithEmptyStrings, 'test');
        expect(result.success).toBe(true);
        expect(result.warnings).toBeDefined();
        expect(result.warnings!.length).toBeGreaterThan(0);
        expect(result.warnings![0]).toContain('Empty string value');
      });

      it('should return warnings for null values', () => {
        const dataWithNulls = {
          appointmentID: 12345,
          inviteStatus: 'Booked',
          location: null,
          comments: null
        };
        
        const result = validateWithWarnings(AppointmentSchema, dataWithNulls, 'test');
        expect(result.success).toBe(true);
        expect(result.warnings).toBeDefined();
        expect(result.warnings!.length).toBeGreaterThan(0);
        expect(result.warnings![0]).toContain('Null value');
      });
    });

    describe('ValidationError', () => {
      it('should create validation error with correct properties', () => {
        const error = new ValidationError(
          'Test error message',
          'testField',
          'testValue',
          'testContext'
        );
        
        expect(error.message).toBe('Test error message');
        expect(error.field).toBe('testField');
        expect(error.value).toBe('testValue');
        expect(error.context).toBe('testContext');
        expect(error.name).toBe('ValidationError');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined data gracefully', () => {
      const result = validateOrReject(AppointmentSchema, undefined, 'test');
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle null data gracefully', () => {
      const result = validateOrReject(AppointmentSchema, null, 'test');
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle empty object gracefully', () => {
      const result = validateOrReject(AppointmentSchema, {}, 'test');
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle array with mixed valid/invalid items', () => {
      const mixedArray = [
        { appointmentID: 1, inviteStatus: 'Booked' }, // Valid
        { appointmentID: -1, inviteStatus: 'InvalidStatus' }, // Invalid
        { appointmentID: 2, inviteStatus: 'In-Progress' } // Valid
      ];
      
      const result = validateArray(AppointmentSchema, mixedArray, 'test');
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2); // Two validation errors
    });
  });

  describe('Performance', () => {
    it('should validate large arrays efficiently', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        appointmentID: i + 1,
        inviteStatus: 'Booked',
        location: `Location ${i}`
      }));
      
      const startTime = Date.now();
      const result = validateArray(AppointmentSchema, largeArray, 'test');
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
