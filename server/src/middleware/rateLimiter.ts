import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Default rate limiter: 100 requests per 15 minutes
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60, // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: 15 * 60,
    });
  },
});

// Custom rate limiter factory
export const createRateLimiter = (max: number, windowMinutes: number) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: windowMinutes * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: windowMinutes * 60,
      });
    },
  });
};

// Auth rate limiter: 5 login attempts per 15 minutes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts from this IP, please try again later.',
    retryAfter: 15 * 60,
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many authentication attempts from this IP, please try again later.',
      retryAfter: 15 * 60,
    });
  },
});

// Password reset rate limiter: 3 attempts per hour
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    error: 'Too many password reset attempts from this IP, please try again later.',
    retryAfter: 60 * 60,
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many password reset attempts from this IP, please try again later.',
      retryAfter: 60 * 60,
    });
  },
});

// API rate limiter: 1000 requests per hour for authenticated users
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'API rate limit exceeded, please try again later.',
    retryAfter: 60 * 60,
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'API rate limit exceeded, please try again later.',
      retryAfter: 60 * 60,
    });
  },
});
