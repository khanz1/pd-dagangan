import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../types/errors';

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export class ValidationMiddleware {
  /**
   * Validate request using Zod schemas
   */
  static validate(schemas: ValidationSchemas) {
    return (req: Request, _res: Response, next: NextFunction): void => {
      try {
        // Validate request body
        if (schemas.body) {
          const result = schemas.body.safeParse(req.body);
          if (!result.success) {
            throw result.error;
          }
          req.body = result.data;
        }

        // Validate request params
        if (schemas.params) {
          const result = schemas.params.safeParse(req.params);
          if (!result.success) {
            throw result.error;
          }
          req.params = result.data;
        }

        // Validate query parameters
        if (schemas.query) {
          const result = schemas.query.safeParse(req.query);
          if (!result.success) {
            throw result.error;
          }
          req.query = result.data;
        }

        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          const validationErrors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }));
          next(new ValidationError(validationErrors, 'Validation failed'));
        } else {
          next(error);
        }
      }
    };
  }
}

/**
 * Individual validation functions for testing convenience
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const validationErrors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        throw new ValidationError(validationErrors, 'Validation failed');
      }
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        const validationErrors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        throw new ValidationError(validationErrors, 'Validation failed');
      }
      req.query = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        const validationErrors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        throw new ValidationError(validationErrors, 'Validation failed');
      }
      req.params = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Common validation schemas
export const CommonSchemas = {
  // ID parameter validation
  idParam: z.object({
    id: z.string().transform((val) => {
      const num = parseInt(val);
      if (isNaN(num) || num <= 0) {
        throw new Error('ID must be a positive number');
      }
      return num;
    })
  }),

  // Pagination query validation
  paginationQuery: z.object({
    page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
    limit: z.string().optional().transform((val) => {
      const num = val ? parseInt(val) : 20;
      return Math.min(Math.max(num, 1), 100); // Between 1 and 100
    })
  }),

  // Email validation
  email: z.string().email('Invalid email format'),

  // Password validation
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  // Phone validation (Indonesian format)
  phone: z.string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,9}$/, 'Phone number must be a valid Indonesian mobile number'),

  // Currency amount validation (in rupiah cents)
  currency: z.number().int().min(0, 'Amount must be non-negative'),

  // User role validation
  userRole: z.enum(['buyer', 'seller', 'admin']),

  // User status validation
  userStatus: z.enum(['active', 'blocked']),

  // Product status validation
  productStatus: z.enum(['active', 'archived']),

  // Order status validation
  orderStatus: z.enum(['new', 'paid', 'shipped', 'delivered', 'closed'])
}; 