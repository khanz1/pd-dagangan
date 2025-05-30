import {
  updateProfileSchema,
  updateUserStatusSchema,
  changePasswordSchema,
  listUsersQuerySchema,
  userIdParamSchema
} from '../../../src/validators/userValidators';

describe('User Validators', () => {
  describe('updateProfileSchema', () => {
    it('should validate valid profile update data', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+6281234567890'
      };
      
      const result = updateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should allow partial updates', () => {
      const partialData = {
        firstName: 'John'
      };
      
      const result = updateProfileSchema.safeParse(partialData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(partialData);
      }
    });

    it('should validate firstName when provided', () => {
      const invalidData = {
        firstName: 'J'
      };
      
      const result = updateProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['firstName']
          })
        );
      }
    });

    it('should validate lastName when provided', () => {
      const invalidData = {
        lastName: 'D'
      };
      
      const result = updateProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['lastName']
          })
        );
      }
    });

    it('should validate phone format when provided', () => {
      const invalidData = {
        phone: 'invalid-phone'
      };
      
      const result = updateProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['phone']
          })
        );
      }
    });

    it('should accept empty object', () => {
      const emptyData = {};
      
      const result = updateProfileSchema.safeParse(emptyData);
      expect(result.success).toBe(true);
    });

    it('should reject extra fields', () => {
      const dataWithExtra = {
        firstName: 'John',
        extraField: 'should not be allowed'
      };
      
      const result = updateProfileSchema.safeParse(dataWithExtra);
      expect(result.success).toBe(false);
    });
  });

  describe('updateUserStatusSchema', () => {
    it('should validate active status', () => {
      const validData = { status: 'active' };
      
      const result = updateUserStatusSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should validate blocked status', () => {
      const validData = { status: 'blocked' };
      
      const result = updateUserStatusSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should require status field', () => {
      const invalidData = {};
      
      const result = updateUserStatusSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['status']
          })
        );
      }
    });

    it('should reject invalid status values', () => {
      const invalidData = { status: 'invalid-status' };
      
      const result = updateUserStatusSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['status']
          })
        );
      }
    });
  });

  describe('changePasswordSchema', () => {
    const validData = {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword123!'
    };

    it('should validate valid password change data', () => {
      const result = changePasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should require currentPassword', () => {
      const invalidData = { newPassword: 'NewPassword123!' };
      
      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['currentPassword']
          })
        );
      }
    });

    it('should require newPassword', () => {
      const invalidData = { currentPassword: 'OldPassword123!' };
      
      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['newPassword']
          })
        );
      }
    });

    it('should validate password strength', () => {
      const invalidData = { ...validData, newPassword: 'weak' };
      
      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['newPassword']
          })
        );
      }
    });
  });

  describe('listUsersQuerySchema', () => {
    it('should validate valid query parameters', () => {
      const validData = {
        page: 1,
        limit: 20,
        role: 'buyer',
        status: 'active',
        search: 'john'
      };
      
      const result = listUsersQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should provide default values', () => {
      const emptyData = {};
      
      const result = listUsersQuerySchema.safeParse(emptyData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should validate page number', () => {
      const invalidData = { page: 0 };
      
      const result = listUsersQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['page']
          })
        );
      }
    });

    it('should validate limit bounds', () => {
      const invalidData = { limit: 101 };
      
      const result = listUsersQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['limit']
          })
        );
      }
    });

    it('should validate role enum', () => {
      const invalidData = { role: 'invalid-role' };
      
      const result = listUsersQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['role']
          })
        );
      }
    });

    it('should validate status enum', () => {
      const invalidData = { status: 'invalid-status' };
      
      const result = listUsersQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['status']
          })
        );
      }
    });

    it('should handle string numbers for page and limit', () => {
      const stringData = { page: '2', limit: '30' };
      
      const result = listUsersQuerySchema.safeParse(stringData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(30);
      }
    });
  });

  describe('userIdParamSchema', () => {
    it('should validate valid user ID', () => {
      const validData = { id: '123' };
      
      const result = userIdParamSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(123);
      }
    });

    it('should convert string ID to number', () => {
      const stringData = { id: '456' };
      
      const result = userIdParamSchema.safeParse(stringData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.id).toBe('number');
        expect(result.data.id).toBe(456);
      }
    });

    it('should require positive ID', () => {
      const invalidData = { id: '0' };
      
      const result = userIdParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['id']
          })
        );
      }
    });

    it('should reject non-numeric ID', () => {
      const invalidData = { id: 'abc' };
      
      const result = userIdParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['id']
          })
        );
      }
    });

    it('should require id field', () => {
      const invalidData = {};
      
      const result = userIdParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['id']
          })
        );
      }
    });
  });
}); 