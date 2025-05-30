import { z } from 'zod';
import { CommonSchemas } from '../middleware/validation';

export const UserValidators = {
  /**
   * Update profile validation schema
   */
  updateProfile: z.object({
    firstName: z.string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must not exceed 50 characters')
      .trim()
      .optional(),
    lastName: z.string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must not exceed 50 characters')
      .trim()
      .optional(),
    phone: CommonSchemas.phone.optional()
  }),

  /**
   * Update user status validation schema
   */
  updateUserStatus: z.object({
    status: CommonSchemas.userStatus
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
  ),

  /**
   * List users query validation schema
   */
  listUsersQuery: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    role: CommonSchemas.userRole.optional(),
    status: CommonSchemas.userStatus.optional(),
    search: z.string().optional()
  }),

  /**
   * User ID parameter validation schema
   */
  userIdParam: z.object({
    id: z.coerce.number().int().positive('User ID must be a positive number')
  })
};

// Export individual schemas for testing
export const updateProfileSchema = UserValidators.updateProfile;
export const updateUserStatusSchema = UserValidators.updateUserStatus;
export const changePasswordSchema = UserValidators.changePassword;
export const listUsersQuerySchema = UserValidators.listUsersQuery;
export const userIdParamSchema = UserValidators.userIdParam; 