import { z } from 'zod';
import { CommonSchemas } from '../middleware/validation';

export const AuthValidators = {
  /**
   * User signup validation schema
   */
  signup: z.object({
    email: CommonSchemas.email,
    password: CommonSchemas.password,
    firstName: z.string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must not exceed 50 characters')
      .trim(),
    lastName: z.string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must not exceed 50 characters')
      .trim()
      .optional(),
    phone: CommonSchemas.phone.optional(),
    role: CommonSchemas.userRole.default('buyer')
  }),

  /**
   * User login validation schema
   */
  login: z.object({
    email: CommonSchemas.email,
    password: z.string().min(1, 'Password is required')
  }),

  /**
   * Google OAuth validation schema
   */
  googleAuth: z.object({
    googleToken: z.string().min(1, 'Google token is required')
  }),

  /**
   * Refresh token validation schema
   */
  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  }),

  /**
   * Logout validation schema
   */
  logout: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  }),

  /**
   * Change password validation schema
   */
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: CommonSchemas.password
  }).refine(
    (data) => data.currentPassword !== data.newPassword,
    {
      message: 'New password must be different from current password',
      path: ['newPassword']
    }
  )
};

// Export individual schemas for testing and convenience
export const signupSchema = AuthValidators.signup;
export const loginSchema = AuthValidators.login;
export const googleAuthSchema = AuthValidators.googleAuth;
export const refreshTokenSchema = AuthValidators.refreshToken;
export const logoutSchema = AuthValidators.logout;
export const changePasswordSchema = AuthValidators.changePassword; 