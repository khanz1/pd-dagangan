import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '@/services/authService';
import { UserRepository } from '@/repositories/userRepository';
import { SellerProfileRepository } from '@/repositories/sellerProfileRepository';
import { ConflictError, UnauthorizedError, ForbiddenError } from '@/types/errors';

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('@/repositories/userRepository');
jest.mock('@/repositories/sellerProfileRepository');
jest.mock('@/config/database', () => ({
  sequelize: {
    transaction: jest.fn()
  }
}));

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;
const mockSellerProfileRepository = SellerProfileRepository as jest.MockedClass<typeof SellerProfileRepository>;

describe('AuthService Integration Tests', () => {
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockSellerRepo: jest.Mocked<SellerProfileRepository>;
  let mockTransaction: any;

  beforeEach(() => {
    mockUserRepo = new mockUserRepository() as jest.Mocked<UserRepository>;
    mockSellerRepo = new mockSellerProfileRepository() as jest.Mocked<SellerProfileRepository>;
    
    // Mock transaction
    mockTransaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined)
    };

    // Setup static method mocks
    (AuthService as any).userRepository = mockUserRepo;
    (AuthService as any).sellerProfileRepository = mockSellerRepo;

    jest.clearAllMocks();
  });

  describe('signup', () => {
    const validSignupData = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      role: 'buyer' as const
    };

    it('should create a new buyer account', async () => {
      const mockCreatedUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        role: 'buyer',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockUserWithProfile = {
        ...mockCreatedUser,
        sellerProfile: null
      };

      // Mock implementations
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashed-password' as never);
      mockUserRepo.createUser.mockResolvedValue(mockCreatedUser as any);
      mockUserRepo.findByIdWithProfile.mockResolvedValue(mockUserWithProfile as any);
      mockJwt.sign.mockReturnValue('mock-access-token' as never);

      // Mock sequelize transaction
      const { sequelize } = require('@/config/database');
      sequelize.transaction.mockImplementation((callback: any) => 
        callback(mockTransaction)
      );

      const result = await AuthService.signup(validSignupData);

      // Verify user creation flow
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
        { transaction: mockTransaction }
      );
      expect(mockBcrypt.hash).toHaveBeenCalledWith('Password123!', 12);
      expect(mockUserRepo.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        role: 'buyer',
        status: 'active'
      }, { transaction: mockTransaction });

      // Verify no seller profile created for buyer
      expect(mockSellerRepo.createSellerProfile).not.toHaveBeenCalled();
      
      // Verify transaction committed
      expect(mockTransaction.commit).toHaveBeenCalled();

      // Verify response structure
      expect(result).toEqual({
        user: expect.objectContaining({
          id: 1,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'buyer',
          sellerProfile: null
        }),
        tokens: expect.objectContaining({
          accessToken: 'mock-access-token',
          refreshToken: 'mock-access-token',
          expiresIn: 3600
        })
      });
    });

    it('should throw ConflictError if email already exists', async () => {
      const existingUser = { id: 1, email: 'test@example.com' };
      mockUserRepo.findByEmail.mockResolvedValue(existingUser as any);

      const { sequelize } = require('@/config/database');
      sequelize.transaction.mockImplementation((callback: any) => 
        callback(mockTransaction)
      );

      await expect(AuthService.signup(validSignupData))
        .rejects.toThrow(ConflictError);

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    it('should authenticate valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'buyer',
        status: 'active',
        passwordHash: 'hashed-password',
        sellerProfile: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepo.findByEmailWithProfile.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValue('mock-access-token' as never);

      const result = await AuthService.login(loginData);

      expect(mockUserRepo.findByEmailWithProfile).toHaveBeenCalledWith('test@example.com');
      expect(mockBcrypt.compare).toHaveBeenCalledWith('Password123!', 'hashed-password');

      expect(result).toEqual({
        user: expect.objectContaining({
          id: 1,
          email: 'test@example.com',
          firstName: 'John',
          role: 'buyer',
          sellerProfile: null
        }),
        tokens: expect.objectContaining({
          accessToken: 'mock-access-token',
          refreshToken: 'mock-access-token',
          expiresIn: 3600
        })
      });
    });

    it('should throw UnauthorizedError for non-existent user', async () => {
      mockUserRepo.findByEmailWithProfile.mockResolvedValue(null);

      await expect(AuthService.login(loginData))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should throw ForbiddenError for blocked user', async () => {
      const blockedUser = {
        id: 1,
        email: 'test@example.com',
        status: 'blocked',
        passwordHash: 'hashed-password'
      };

      mockUserRepo.findByEmailWithProfile.mockResolvedValue(blockedUser as any);

      await expect(AuthService.login(loginData))
        .rejects.toThrow(ForbiddenError);
    });

    it('should throw UnauthorizedError for invalid password', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        status: 'active',
        passwordHash: 'hashed-password'
      };

      mockUserRepo.findByEmailWithProfile.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(AuthService.login(loginData))
        .rejects.toThrow(UnauthorizedError);
    });
  });
}); 