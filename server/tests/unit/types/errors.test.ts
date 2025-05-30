import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
  InternalServerError,
  ErrorMessages
} from '@/types/errors';

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create base AppError correctly', () => {
      const error = new AppError('Test error', 400);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('should have correct stack trace', () => {
      const error = new AppError('Test error', 400);
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('ValidationError', () => {
    const validationErrors = [
      { field: 'email', message: 'Email is required' },
      { field: 'password', message: 'Password must be at least 8 characters' }
    ];

    it('should create ValidationError with errors array', () => {
      const error = new ValidationError('Validation failed', validationErrors);

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.errors).toEqual(validationErrors);
      expect(error.name).toBe('ValidationError');
    });

    it('should create ValidationError without errors array', () => {
      const error = new ValidationError('Validation failed');

      expect(error.errors).toEqual([]);
    });

    it('should use default message', () => {
      const error = new ValidationError();

      expect(error.message).toBe('Validation failed');
      expect(error.errors).toEqual([]);
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with custom message', () => {
      const error = new NotFoundError('User not found');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should use default message', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Resource not found');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create UnauthorizedError with custom message', () => {
      const error = new UnauthorizedError('Invalid token');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid token');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should use default message', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Unauthorized access');
    });
  });

  describe('ForbiddenError', () => {
    it('should create ForbiddenError with custom message', () => {
      const error = new ForbiddenError('Insufficient permissions');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Insufficient permissions');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('ForbiddenError');
    });

    it('should use default message', () => {
      const error = new ForbiddenError();

      expect(error.message).toBe('Access forbidden');
    });
  });

  describe('ConflictError', () => {
    it('should create ConflictError with custom message', () => {
      const error = new ConflictError('Email already exists');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Email already exists');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
    });

    it('should use default message', () => {
      const error = new ConflictError();

      expect(error.message).toBe('Resource conflict');
    });
  });

  describe('BadRequestError', () => {
    it('should create BadRequestError with custom message', () => {
      const error = new BadRequestError('Invalid request data');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid request data');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('BadRequestError');
    });

    it('should use default message', () => {
      const error = new BadRequestError();

      expect(error.message).toBe('Bad request');
    });
  });

  describe('InternalServerError', () => {
    it('should create InternalServerError with custom message', () => {
      const error = new InternalServerError('Database connection failed');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Database connection failed');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('InternalServerError');
    });

    it('should use default message', () => {
      const error = new InternalServerError();

      expect(error.message).toBe('Internal server error');
    });
  });

  describe('ErrorMessages', () => {
    it('should have all required error message constants', () => {
      expect(ErrorMessages.EMAIL_ALREADY_REGISTERED).toBe('Email is already registered');
      expect(ErrorMessages.INVALID_CREDENTIALS).toBe('Invalid email or password');
      expect(ErrorMessages.ACCOUNT_BLOCKED).toBe('Account is blocked');
      expect(ErrorMessages.ACCESS_TOKEN_REQUIRED).toBe('Access token is required');
      expect(ErrorMessages.INVALID_TOKEN).toBe('Invalid or expired token');
      expect(ErrorMessages.INSUFFICIENT_PERMISSIONS).toBe('Insufficient permissions');
      expect(ErrorMessages.USER_NOT_FOUND).toBe('User not found');
      expect(ErrorMessages.CURRENT_PASSWORD_INCORRECT).toBe('Current password is incorrect');
      expect(ErrorMessages.GOOGLE_AUTH_FAILED).toBe('Google authentication failed');
    });

    it('should be readonly constants', () => {
      // This test ensures the constants can't be modified
      expect(() => {
        (ErrorMessages as any).EMAIL_ALREADY_REGISTERED = 'Modified';
      }).toThrow();
    });
  });

  describe('Error serialization', () => {
    it('should serialize ValidationError to JSON correctly', () => {
      const validationErrors = [
        { field: 'email', message: 'Email is required' }
      ];
      const error = new ValidationError('Validation failed', validationErrors);

      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);

      expect(parsed.message).toBe('Validation failed');
      expect(parsed.statusCode).toBe(400);
      expect(parsed.errors).toEqual(validationErrors);
    });

    it('should serialize basic AppError to JSON correctly', () => {
      const error = new NotFoundError('User not found');

      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);

      expect(parsed.message).toBe('User not found');
      expect(parsed.statusCode).toBe(404);
    });
  });

  describe('Error inheritance chain', () => {
    it('should maintain proper inheritance chain', () => {
      const validationError = new ValidationError();
      const notFoundError = new NotFoundError();
      const unauthorizedError = new UnauthorizedError();

      expect(validationError instanceof Error).toBe(true);
      expect(validationError instanceof AppError).toBe(true);
      expect(validationError instanceof ValidationError).toBe(true);

      expect(notFoundError instanceof Error).toBe(true);
      expect(notFoundError instanceof AppError).toBe(true);
      expect(notFoundError instanceof NotFoundError).toBe(true);

      expect(unauthorizedError instanceof Error).toBe(true);
      expect(unauthorizedError instanceof AppError).toBe(true);
      expect(unauthorizedError instanceof UnauthorizedError).toBe(true);
    });
  });
}); 