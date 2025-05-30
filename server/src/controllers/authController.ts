import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/authService';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/types';
import { ErrorHandler } from '@/middleware/errorHandler';
import { AuthValidators } from '@/validators/authValidators';
import { UserService } from '@/services/userService';

export class AuthController {
  /**
   * POST /api/v1/auth/signup
   * Register a new user
   */
  static signup = ErrorHandler.asyncWrapper(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    // Validate input
    const validatedData = AuthValidators.signup.parse(req.body);

    const result = await AuthService.signup(validatedData);

    logger.info(`User registered successfully: ${validatedData.email}`);
    res.status(201).json(result);
  });

  /**
   * POST /api/v1/auth/login
   * Authenticate user
   */
  static login = ErrorHandler.asyncWrapper(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    // Validate input
    const validatedData = AuthValidators.login.parse(req.body);

    const result = await AuthService.login(validatedData);

    logger.info(`User logged in successfully: ${validatedData.email}`);
    res.status(200).json(result);
  });

  /**
   * POST /api/v1/auth/google
   * Authenticate with Google OAuth
   */
  static googleAuth = ErrorHandler.asyncWrapper(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    // Validate input
    const validatedData = AuthValidators.googleAuth.parse(req.body);

    const result = await AuthService.googleAuth(validatedData.googleToken);

    logger.info(`Google auth successful: ${result.user.email}`);
    res.status(200).json(result);
  });

  /**
   * POST /api/v1/auth/token/refresh
   * Refresh access token
   */
  static refreshToken = ErrorHandler.asyncWrapper(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    // Validate input
    const validatedData = AuthValidators.refreshToken.parse(req.body);

    const result = await AuthService.refreshToken(validatedData.refreshToken);

    res.status(200).json(result);
  });

  /**
   * POST /api/v1/auth/logout
   * Logout user (revoke refresh token)
   */
  static logout = ErrorHandler.requireAuth(async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    // In a more complex implementation, we would maintain a blacklist
    // of revoked tokens in Redis or database
    // For now, we just return success as the client will discard the tokens

    logger.info(`User logged out: ${req.user?.email}`);

    res.status(200).json({
      message: 'Successfully logged out'
    });
  });

  /**
   * GET /api/v1/auth/me
   * Get current user info
   */
  static getMe = ErrorHandler.requireAuth(async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const user = await UserService.getUserProfile(req.user!.userId);
    res.status(200).json(user);
  });
} 