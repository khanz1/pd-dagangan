// Error message enums for consistency and maintainability
export enum ErrorMessages {
  // Authentication errors
  ACCESS_TOKEN_REQUIRED = 'Access token required',
  INVALID_TOKEN = 'Invalid token',
  TOKEN_EXPIRED = 'Token expired',
  AUTHENTICATION_REQUIRED = 'Authentication required',
  INVALID_CREDENTIALS = 'Invalid email or password',
  ACCOUNT_BLOCKED = 'Account is blocked',
  INSUFFICIENT_PERMISSIONS = 'Insufficient permissions',
  
  // Validation errors
  VALIDATION_FAILED = 'Validation failed',
  EMAIL_ALREADY_REGISTERED = 'Email is already registered',
  CURRENT_PASSWORD_INCORRECT = 'Current password is incorrect',
  
  // Resource errors
  USER_NOT_FOUND = 'User not found',
  PRODUCT_NOT_FOUND = 'Product not found',
  CATEGORY_NOT_FOUND = 'Category not found',
  ADDRESS_NOT_FOUND = 'Address not found',
  CART_NOT_FOUND = 'Cart not found',
  ORDER_NOT_FOUND = 'Order not found',
  
  // Authorization errors
  ACCESS_DENIED = 'Access denied',
  ADMIN_ROLE_REQUIRED = 'Admin role required',
  SELLER_ROLE_REQUIRED = 'Seller or admin role required',
  RESOURCE_OWNER_REQUIRED = 'You are not authorized to access this resource',
  
  // Business logic errors
  INSUFFICIENT_STOCK = 'Insufficient stock available',
  CART_IS_EMPTY = 'Cart is empty',
  INVALID_COUPON = 'Invalid or expired coupon',
  ORDER_ALREADY_PAID = 'Order has already been paid',
  
  // External service errors
  GOOGLE_AUTH_FAILED = 'Google authentication failed',
  PAYMENT_GATEWAY_ERROR = 'Payment gateway error',
  EMAIL_SERVICE_ERROR = 'Email service error',
  
  // Generic errors
  INTERNAL_SERVER_ERROR = 'Internal server error',
  ROUTE_NOT_FOUND = 'Route not found',
  INVALID_REQUEST_DATA = 'Invalid request data',
  RESOURCE_IDENTIFIER_REQUIRED = 'Resource identifier required'
}

// Base custom error class
export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 - Bad Request
export class BadRequestError extends AppError {
  constructor(message: ErrorMessages | string = ErrorMessages.INVALID_REQUEST_DATA) {
    super(message, 400);
  }
}

// 401 - Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message: ErrorMessages | string = ErrorMessages.AUTHENTICATION_REQUIRED) {
    super(message, 401);
  }
}

// 403 - Forbidden
export class ForbiddenError extends AppError {
  constructor(message: ErrorMessages | string = ErrorMessages.ACCESS_DENIED) {
    super(message, 403);
  }
}

// 404 - Not Found
export class NotFoundError extends AppError {
  constructor(message: ErrorMessages | string = ErrorMessages.USER_NOT_FOUND) {
    super(message, 404);
  }
}

// 409 - Conflict
export class ConflictError extends AppError {
  constructor(message: ErrorMessages | string = ErrorMessages.EMAIL_ALREADY_REGISTERED) {
    super(message, 409);
  }
}

// 422 - Unprocessable Entity
export class UnprocessableEntityError extends AppError {
  constructor(message: ErrorMessages | string = ErrorMessages.VALIDATION_FAILED) {
    super(message, 422);
  }
}

// 500 - Internal Server Error
export class InternalServerError extends AppError {
  constructor(message: ErrorMessages | string = ErrorMessages.INTERNAL_SERVER_ERROR) {
    super(message, 500, false); // Not operational
  }
}

// Validation error with details
export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class ValidationError extends BadRequestError {
  public readonly details: ValidationErrorDetail[];

  constructor(details: ValidationErrorDetail[], message: string = ErrorMessages.VALIDATION_FAILED) {
    super(message);
    this.details = details;
  }
} 