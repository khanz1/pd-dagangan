import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { logger } from '@/config/logger';
import { User } from '@/models';
import { JwtPayload, AuthenticatedRequest, UserRole } from '@/types';
import { UnauthorizedError, ForbiddenError, ErrorMessages } from '@/types/errors';

export class AuthMiddleware {
  /**
   * Verify JWT token and attach user to request
   */
  static async authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError(ErrorMessages.ACCESS_TOKEN_REQUIRED);
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      if (!token) {
        throw new UnauthorizedError(ErrorMessages.ACCESS_TOKEN_REQUIRED);
      }

      // Verify JWT token
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      
      // Find user in database
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['passwordHash'] }
      });

      if (!user) {
        throw new UnauthorizedError(ErrorMessages.INVALID_TOKEN);
      }

      if (user.status === 'blocked') {
        throw new ForbiddenError(ErrorMessages.ACCOUNT_BLOCKED);
      }

      // Attach user to request
      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Optional authentication - doesn't fail if no token provided
   */
  static async optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
      }

      const token = authHeader.substring(7);
      
      if (!token) {
        next();
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      
      // Find user in database
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['passwordHash'] }
      });

      if (user && user.status === 'active') {
        req.user = {
          userId: user.id,
          email: user.email,
          role: user.role
        };
      }

      next();
    } catch (error) {
      // Silently continue without user for optional auth
      logger.debug('Optional auth failed:', error);
      next();
    }
  }

  /**
   * Require specific role(s) - must be used after authenticate
   */
  static requireRole(allowedRoles: UserRole | UserRole[]) {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new UnauthorizedError(ErrorMessages.ACCESS_TOKEN_REQUIRED);
        }

        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        
        // Admin can access everything
        if (req.user.role === 'admin' || roles.includes(req.user.role)) {
          next();
          return;
        }

        throw new ForbiddenError(ErrorMessages.INSUFFICIENT_PERMISSIONS);
      } catch (error) {
        next(error);
      }
    };
  }
}

// Export individual functions for testing convenience
export const authenticate = AuthMiddleware.authenticate;
export const requireRole = AuthMiddleware.requireRole; 