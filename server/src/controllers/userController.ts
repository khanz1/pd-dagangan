import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types';
import { logger } from '@/config/logger';
import { ErrorHandler } from '@/middleware/errorHandler';
import { UserValidators } from '@/validators/userValidators';
import { UserService } from '@/services/userService';

export class UserController {
  /**
   * GET /api/v1/users/me
   * Get current user profile
   */
  static getProfile = ErrorHandler.requireAuth(async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const user = await UserService.getUserProfile(req.user!.userId);
    res.status(200).json(user);
  });

  /**
   * PUT /api/v1/users/me
   * Update current user profile
   */
  static updateProfile = ErrorHandler.requireAuth(async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    // Validate input
    const validatedData = UserValidators.updateProfile.parse(req.body);

    const user = await UserService.updateUserProfile(req.user!.userId, validatedData);

    logger.info(`Profile updated for user: ${req.user?.email}`);
    res.status(200).json(user);
  });

  /**
   * GET /api/v1/users/:id
   * Get user by ID (Admin only)
   */
  static getUserById = ErrorHandler.asyncWrapper(async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    // Validate parameters
    const { id: userId } = UserValidators.userIdParam.parse(req.params);

    const user = await UserService.getUserById(userId);
    res.status(200).json(user);
  });

  /**
   * PUT /api/v1/users/:id/status
   * Update user status (Admin only)
   */
  static updateUserStatus = ErrorHandler.asyncWrapper(async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    // Validate parameters and body
    const { id: userId } = UserValidators.userIdParam.parse(req.params);
    const validatedData = UserValidators.updateUserStatus.parse(req.body);

    const result = await UserService.updateUserStatus(userId, validatedData.status);

    logger.info(`User status updated: ${userId} -> ${validatedData.status}`);
    res.status(200).json(result);
  });

  /**
   * GET /api/v1/users
   * List all users (Admin only)
   */
  static listUsers = ErrorHandler.asyncWrapper(async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    // Validate query parameters
    const validatedQuery = UserValidators.listUsersQuery.parse(req.query);

    const result = await UserService.listUsers(validatedQuery);
    res.status(200).json(result);
  });

  /**
   * PUT /api/v1/users/me/password
   * Change current user password
   */
  static changePassword = ErrorHandler.requireAuth(async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    // Validate input
    const validatedData = UserValidators.changePassword.parse(req.body);

    await UserService.changePassword(
      req.user!.userId, 
      validatedData.currentPassword, 
      validatedData.newPassword
    );

    logger.info(`Password changed for user: ${req.user?.email}`);
    res.status(200).json({
      message: 'Password changed successfully'
    });
  });
} 