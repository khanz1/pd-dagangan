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
  INVALID_SELLER_ID = 'Invalid seller ID',
  ONE_OR_MORE_CATEGORY_IDS_ARE_INVALID = 'One or more category IDs are invalid',
  PARENT_CATEGORY_DOES_NOT_EXIST = 'Parent category does not exist',
  CATEGORY_CANNOT_BE_ITS_OWN_PARENT = 'Category cannot be its own parent',
  CANNOT_DELETE_CATEGORY_WITH_CHILDREN = 'Cannot delete category that has child categories',
  CANNOT_DELETE_CATEGORY_WITH_PRODUCTS = 'Cannot delete category that has associated products',

  // Resource errors
  USER_NOT_FOUND = 'User not found',
  PRODUCT_NOT_FOUND = 'Product not found',
  CATEGORY_NOT_FOUND = 'Category not found',
  ADDRESS_NOT_FOUND = 'Address not found',
  CART_NOT_FOUND = 'Cart not found',
  CART_ITEM_NOT_FOUND = 'Cart item not found',
  WISHLIST_NOT_FOUND = 'Wishlist not found',
  WISHLIST_ITEM_NOT_FOUND = 'Wishlist item not found',
  ORDER_NOT_FOUND = 'Order not found',

  // Authorization errors
  ACCESS_DENIED = 'Access denied',
  ADMIN_ROLE_REQUIRED = 'Admin role required',
  SELLER_ROLE_REQUIRED = 'Seller or admin role required',
  RESOURCE_OWNER_REQUIRED = 'You are not authorized to access this resource',

  // Business logic errors
  INSUFFICIENT_STOCK = 'Insufficient stock available',
  CART_IS_EMPTY = 'Cart is empty',
  ITEM_ALREADY_IN_CART = 'Item is already in cart',
  ITEM_ALREADY_IN_WISHLIST = 'Item is already in wishlist',
  INVALID_QUANTITY = 'Invalid quantity specified',
  CART_ITEM_LIMIT_EXCEEDED = 'Maximum cart items limit exceeded',
  PRODUCT_NOT_AVAILABLE = 'Product is not available for purchase',
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
  RESOURCE_IDENTIFIER_REQUIRED = 'Resource identifier required',
}

// Base custom error class
export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
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
  public override readonly details: ValidationErrorDetail[];

  constructor(details: ValidationErrorDetail[], message: string = ErrorMessages.VALIDATION_FAILED) {
    super(message);
    this.details = details;
  }
}
