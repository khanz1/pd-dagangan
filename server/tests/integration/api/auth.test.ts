import request from 'supertest';
import { app } from '@/app';
import { AuthService } from '@/services/authService';

// Mock the AuthService
jest.mock('@/services/authService');

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/signup', () => {
    const validSignupData = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      role: 'buyer'
    };

    it('should create a new user successfully', async () => {
      const mockResponse = {
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          role: 'buyer',
          status: 'active',
          sellerProfile: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600
        }
      };

      mockAuthService.signup.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(validSignupData)
        .expect(201);

      expect(response.body).toEqual(mockResponse);
      expect(mockAuthService.signup).toHaveBeenCalledWith(validSignupData);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        email: 'test@example.com'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
      expect(mockAuthService.signup).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = {
        ...validSignupData,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'email'
        })
      );
    });

    it('should return 400 for weak password', async () => {
      const invalidData = {
        ...validSignupData,
        password: 'weak'
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'password'
        })
      );
    });

    it('should return 409 for duplicate email', async () => {
      const { ConflictError } = require('@/types/errors');
      mockAuthService.signup.mockRejectedValue(
        new ConflictError('Email is already registered')
      );

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(validSignupData)
        .expect(409);

      expect(response.body.message).toBe('Email is already registered');
    });

    it('should return 500 for server errors', async () => {
      mockAuthService.signup.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(validSignupData)
        .expect(500);

      expect(response.body.message).toBe('Internal server error');
    });

    it('should handle different user roles', async () => {
      const sellerData = { ...validSignupData, role: 'seller' };
      const mockSellerResponse = {
        user: { ...validSignupData, id: 1, role: 'seller', sellerProfile: { balance: 0 } },
        tokens: { accessToken: 'token', refreshToken: 'refresh', expiresIn: 3600 }
      };

      mockAuthService.signup.mockResolvedValue(mockSellerResponse as any);

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(sellerData)
        .expect(201);

      expect(response.body.user.role).toBe('seller');
      expect(response.body.user.sellerProfile).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'buyer',
          status: 'active',
          sellerProfile: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600
        }
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(validLoginData)
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(validLoginData);
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'email'
        })
      );
    });

    it('should return 401 for invalid credentials', async () => {
      const { UnauthorizedError } = require('@/types/errors');
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedError('Invalid email or password')
      );

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(validLoginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 403 for blocked account', async () => {
      const { ForbiddenError } = require('@/types/errors');
      mockAuthService.login.mockRejectedValue(
        new ForbiddenError('Account is blocked')
      );

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(validLoginData)
        .expect(403);

      expect(response.body.message).toBe('Account is blocked');
    });
  });

  describe('POST /api/v1/auth/token/refresh', () => {
    const validRefreshData = {
      refreshToken: 'valid-refresh-token'
    };

    it('should refresh token successfully', async () => {
      const mockResponse = {
        accessToken: 'new-access-token',
        expiresIn: 3600
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/v1/auth/token/refresh')
        .send(validRefreshData)
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/token/refresh')
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
      expect(mockAuthService.refreshToken).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid refresh token', async () => {
      const { UnauthorizedError } = require('@/types/errors');
      mockAuthService.refreshToken.mockRejectedValue(
        new UnauthorizedError('Invalid or expired refresh token')
      );

      const response = await request(app)
        .post('/api/v1/auth/token/refresh')
        .send(validRefreshData)
        .expect(401);

      expect(response.body.message).toBe('Invalid or expired refresh token');
    });
  });

  describe('POST /api/v1/auth/google', () => {
    const validGoogleData = {
      googleToken: 'valid-google-token'
    };

    it('should return error for disabled Google auth', async () => {
      mockAuthService.googleAuth.mockRejectedValue(
        new Error('Google authentication failed')
      );

      const response = await request(app)
        .post('/api/v1/auth/google')
        .send(validGoogleData)
        .expect(500);

      expect(response.body.message).toBe('Internal server error');
    });

    it('should return 400 for missing Google token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/google')
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
      expect(mockAuthService.googleAuth).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user info with valid token', async () => {
      // Mock authentication middleware
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'buyer',
        status: 'active',
        sellerProfile: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock UserService for getMe endpoint
      const { UserService } = require('@/services/userService');
      UserService.getUserProfile = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockUser);
    });

    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.message).toBe('Access token is required');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBe('Invalid or expired token');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const validLogoutData = {
        refreshToken: 'valid-refresh-token'
      };

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer valid-token')
        .send(validLogoutData)
        .expect(200);

      expect(response.body.message).toBe('Successfully logged out');
    });

    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'token' })
        .expect(401);

      expect(response.body.message).toBe('Access token is required');
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
    });
  });
}); 