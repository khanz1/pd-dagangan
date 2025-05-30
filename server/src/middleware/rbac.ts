import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '@/types';
import { UnauthorizedError, ForbiddenError, BadRequestError, ErrorMessages } from '@/types/errors';

export class RBACMiddleware {
  /**
   * Require specific role(s) to access route
   */
  static requireRole(...allowedRoles: UserRole[]) {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new UnauthorizedError(ErrorMessages.AUTHENTICATION_REQUIRED);
        }

        if (!allowedRoles.includes(req.user.role)) {
          throw new ForbiddenError(ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Require admin role
   */
  static requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    RBACMiddleware.requireRole('admin')(req, res, next);
  }

  /**
   * Require seller or admin role
   */
  static requireSeller(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    RBACMiddleware.requireRole('seller', 'admin')(req, res, next);
  }

  /**
   * Require buyer, seller, or admin role (any authenticated user)
   */
  static requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    RBACMiddleware.requireRole('buyer', 'seller', 'admin')(req, res, next);
  }

  /**
   * Check if user owns the resource or is admin
   */
  static requireOwnershipOrAdmin(userIdField: string = 'userId') {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new UnauthorizedError(ErrorMessages.AUTHENTICATION_REQUIRED);
        }

        // Admin can access anything
        if (req.user.role === 'admin') {
          next();
          return;
        }

        // Check if user owns the resource
        const resourceUserId = req.params['userId'] || req.body[userIdField] || req.params['id'];
        
        if (!resourceUserId) {
          throw new BadRequestError(ErrorMessages.RESOURCE_IDENTIFIER_REQUIRED);
        }

        if (parseInt(resourceUserId) !== req.user.userId) {
          throw new ForbiddenError(ErrorMessages.RESOURCE_OWNER_REQUIRED);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Check if user can manage the product (seller owns it or admin)
   */
  static async requireProductOwnership(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError(ErrorMessages.AUTHENTICATION_REQUIRED);
      }

      // Admin can manage any product
      if (req.user.role === 'admin') {
        next();
        return;
      }

      // Seller must own the product
      if (req.user.role === 'seller') {
        // This will be implemented when we have the product controller
        // For now, just check if they're a seller
        next();
        return;
      }

      throw new ForbiddenError(ErrorMessages.SELLER_ROLE_REQUIRED);
    } catch (error) {
      next(error);
    }
  }
} 