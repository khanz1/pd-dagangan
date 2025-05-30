import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';
import { config } from '@/config';
import { AppError, ValidationError, ErrorMessages } from '@/types/errors';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';

export class ErrorHandler {
  /**
   * Global error handling middleware
   */
  static handle(error: Error, req: Request, res: Response, _next: NextFunction): void {
    // Log the error
    logger.error(`${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
      error: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Handle known application errors
    if (error instanceof AppError) {
      ErrorHandler.handleAppError(error, res);
      return;
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      ErrorHandler.handleZodError(error, res);
      return;
    }

    // Handle JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      ErrorHandler.handleJWTError(error, res);
      return;
    }

    // Handle unexpected errors
    ErrorHandler.handleUnexpectedError(error, res);
  }

  /**
   * Handle application errors (our custom errors)
   */
  private static handleAppError(error: AppError, res: Response): void {
    const response: any = {
      message: error.message
    };

    // Add validation details for ValidationError
    if (error instanceof ValidationError) {
      response.errors = error.details;
    }

    // Include stack trace in development
    if (config.app.nodeEnv === 'development') {
      response.stack = error.stack;
    }

    res.status(error.statusCode).json(response);
  }

  /**
   * Handle Zod validation errors
   */
  private static handleZodError(error: ZodError, res: Response): void {
    const errors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));

    const response: any = {
      message: ErrorMessages.VALIDATION_FAILED,
      errors
    };

    if (config.app.nodeEnv === 'development') {
      response.stack = error.stack;
    }

    res.status(400).json(response);
  }

  /**
   * Handle JWT errors
   */
  private static handleJWTError(error: jwt.JsonWebTokenError, res: Response): void {
    let message = ErrorMessages.INVALID_TOKEN;

    if (error instanceof jwt.TokenExpiredError) {
      message = ErrorMessages.TOKEN_EXPIRED;
    }

    const response: any = {
      message
    };

    if (config.app.nodeEnv === 'development') {
      response.stack = error.stack;
    }

    res.status(401).json(response);
  }

  /**
   * Handle unexpected errors
   */
  private static handleUnexpectedError(error: Error, res: Response): void {
    const response: any = {
      message: ErrorMessages.INTERNAL_SERVER_ERROR
    };

    if (config.app.nodeEnv === 'development') {
      response.originalError = error.message;
      response.stack = error.stack;
    }

    res.status(500).json(response);
  }

  /**
   * Handle 404 Not Found errors
   */
  static notFound(req: Request, res: Response): void {
    res.status(404).json({
      message: ErrorMessages.ROUTE_NOT_FOUND,
      path: req.originalUrl
    });
  }

  /**
   * Async wrapper to catch errors in async route handlers
   */
  static asyncWrapper(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Auth wrapper to handle authentication checks
   */
  static requireAuth(fn: (req: any, res: Response, next: NextFunction) => Promise<void>) {
    return ErrorHandler.asyncWrapper(async (req: any, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new Error(ErrorMessages.AUTHENTICATION_REQUIRED);
      }
      await fn(req, res, next);
    });
  }
} 