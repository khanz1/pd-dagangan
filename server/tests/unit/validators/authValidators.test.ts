import {
  signupSchema,
  loginSchema,
  googleAuthSchema,
  refreshTokenSchema,
  logoutSchema,
  changePasswordSchema
} from '../../../src/validators/authValidators';

describe('Auth Validators', () => {
  describe('signupSchema', () => {
    const validSignupData = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+6281234567890',
      role: 'buyer' as const
    };

    it('should validate valid signup data', () => {
      const result = signupSchema.safeParse(validSignupData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validSignupData);
      }
    });

    it('should require email', () => {
      const invalidData = { ...validSignupData };
      const { email, ...dataWithoutEmail } = invalidData;
      
      const result = signupSchema.safeParse(dataWithoutEmail);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['email'],
            code: 'invalid_type'
          })
        );
      }
    });

    it('should validate email format', () => {
      const invalidData = { ...validSignupData, email: 'invalid-email' };
      
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['email']
          })
        );
      }
    });

    it('should require strong password', () => {
      const invalidData = { ...validSignupData, password: 'weak' };
      
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['password']
          })
        );
      }
    });

    it('should require firstName', () => {
      const invalidData = { ...validSignupData };
      const { firstName, ...dataWithoutFirstName } = invalidData;
      
      const result = signupSchema.safeParse(dataWithoutFirstName);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['firstName']
          })
        );
      }
    });

    it('should validate role enum', () => {
      const invalidData = { ...validSignupData, role: 'invalid-role' };
      
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['role']
          })
        );
      }
    });

    it('should accept valid roles', () => {
      const roles = ['buyer', 'seller', 'admin'];
      
      roles.forEach(role => {
        const data = { ...validSignupData, role };
        const result = signupSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should make lastName optional', () => {
      const { lastName, ...dataWithoutLastName } = validSignupData;
      
      const result = signupSchema.safeParse(dataWithoutLastName);
      expect(result.success).toBe(true);
    });

    it('should make phone optional', () => {
      const { phone, ...dataWithoutPhone } = validSignupData;
      
      const result = signupSchema.safeParse(dataWithoutPhone);
      expect(result.success).toBe(true);
    });

    it('should validate phone format when provided', () => {
      const invalidData = { ...validSignupData, phone: 'invalid-phone' };
      
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['phone']
          })
        );
      }
    });
  });

  describe('loginSchema', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    it('should validate valid login data', () => {
      const result = loginSchema.safeParse(validLoginData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validLoginData);
      }
    });

    it('should require email', () => {
      const invalidData = { password: 'Password123!' };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['email']
          })
        );
      }
    });

    it('should require password', () => {
      const invalidData = { email: 'test@example.com' };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['password']
          })
        );
      }
    });

    it('should validate email format', () => {
      const invalidData = { ...validLoginData, email: 'invalid-email' };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('googleAuthSchema', () => {
    it('should validate valid google token', () => {
      const validData = { googleToken: 'valid-google-token-123' };
      
      const result = googleAuthSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should require googleToken', () => {
      const invalidData = {};
      
      const result = googleAuthSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['googleToken']
          })
        );
      }
    });

    it('should require non-empty googleToken', () => {
      const invalidData = { googleToken: '' };
      
      const result = googleAuthSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('refreshTokenSchema', () => {
    it('should validate valid refresh token', () => {
      const validData = { refreshToken: 'valid-refresh-token-123' };
      
      const result = refreshTokenSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should require refreshToken', () => {
      const invalidData = {};
      
      const result = refreshTokenSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['refreshToken']
          })
        );
      }
    });
  });

  describe('logoutSchema', () => {
    it('should validate valid logout data', () => {
      const validData = { refreshToken: 'valid-refresh-token-123' };
      
      const result = logoutSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should require refreshToken', () => {
      const invalidData = {};
      
      const result = logoutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['refreshToken']
          })
        );
      }
    });

    it('should require non-empty refreshToken', () => {
      const invalidData = { refreshToken: '' };
      
      const result = logoutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
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

    it('should validate new password strength', () => {
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

    it('should prevent same current and new password', () => {
      const invalidData = { 
        currentPassword: 'SamePassword123!',
        newPassword: 'SamePassword123!'
      };
      
      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
}); 