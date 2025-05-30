import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, requireRole } from '@/middleware/auth';
import { UnauthorizedError, ForbiddenError } from '@/types/errors';
import { JwtPayload } from '@/types';

// Mock modules
jest.mock('jsonwebtoken');
jest.mock('@/models', () => ({
  User: {
    findByPk: jest.fn()
  }
}));
jest.mock('@/config', () => ({
  config: {
    jwt: {
      secret: 'test-secret'
    }
  }
}));

const mockJwt = jwt as jest.Mocked<typeof jwt>;
const { User } = require('@/models');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid token', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'buyer',
        status: 'active'
      };

      const mockPayload: JwtPayload = {
        userId: 1,
        email: 'test@example.com',
        role: 'buyer'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };
      
      mockJwt.verify.mockReturnValue(mockPayload);
      User.findByPk.mockResolvedValue(mockUser);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(User.findByPk).toHaveBeenCalledWith(1, {
        attributes: { exclude: ['passwordHash'] }
      });
      expect(mockRequest.user).toEqual({
        userId: 1,
        email: 'test@example.com',
        role: 'buyer'
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject request without authorization header', async () => {
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(UnauthorizedError)
      );
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access token is required'
        })
      );
    });

    it('should reject request with invalid authorization format', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token'
      };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(UnauthorizedError)
      );
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access token is required'
        })
      );
    });

    it('should reject request with Bearer but no token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer '
      };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(UnauthorizedError)
      );
    });

    it('should reject invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(Error)
      );
    });

    it('should reject expired token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token'
      };

      const expiredError = new Error('jwt expired');
      expiredError.name = 'TokenExpiredError';
      mockJwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expiredError);
    });

    it('should reject when user not found', async () => {
      const mockPayload: JwtPayload = {
        userId: 999,
        email: 'test@example.com',
        role: 'buyer'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };
      
      mockJwt.verify.mockReturnValue(mockPayload);
      User.findByPk.mockResolvedValue(null);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(UnauthorizedError)
      );
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid or expired token'
        })
      );
    });

    it('should reject blocked user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'buyer',
        status: 'blocked'
      };

      const mockPayload: JwtPayload = {
        userId: 1,
        email: 'test@example.com',
        role: 'buyer'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };
      
      mockJwt.verify.mockReturnValue(mockPayload);
      User.findByPk.mockResolvedValue(mockUser);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ForbiddenError)
      );
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Account is blocked'
        })
      );
    });
  });

  describe('requireRole', () => {
    const mockUser: JwtPayload = {
      userId: 1,
      email: 'test@example.com',
      role: 'buyer'
    };

    beforeEach(() => {
      mockRequest.user = mockUser;
    });

    it('should allow access for correct role', () => {
      const middleware = requireRole(['buyer']);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow access for multiple roles', () => {
      const middleware = requireRole(['buyer', 'seller']);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow admin to access any resource', () => {
      mockRequest.user = { ...mockUser, role: 'admin' };
      const middleware = requireRole(['seller']);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access for incorrect role', () => {
      const middleware = requireRole(['seller']);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ForbiddenError)
      );
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Insufficient permissions'
        })
      );
    });

    it('should deny access if user is not authenticated', () => {
      mockRequest.user = undefined;
      const middleware = requireRole(['buyer']);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(UnauthorizedError)
      );
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access token is required'
        })
      );
    });

    it('should work with empty roles array', () => {
      const middleware = requireRole([]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ForbiddenError)
      );
    });

    it('should work with single role string', () => {
      const middleware = requireRole('buyer');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle seller role correctly', () => {
      mockRequest.user = { ...mockUser, role: 'seller' };
      const middleware = requireRole(['seller']);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
}); 