import { UserRepository } from '@/repositories/userRepository';
import { User, SellerProfile } from '@/models';

// Mock the models
jest.mock('@/models', () => ({
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    name: 'User'
  },
  SellerProfile: {
    name: 'SellerProfile'
  }
}));

const mockUser = User as jest.Mocked<typeof User>;

describe('UserRepository Integration Tests', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUserData = {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      mockUser.findOne.mockResolvedValue(mockUserData as any);

      const result = await userRepository.findByEmail('test@example.com');

      expect(mockUser.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
      expect(result).toEqual(mockUserData);
    });

    it('should return null when user not found', async () => {
      mockUser.findOne.mockResolvedValue(null);

      const result = await userRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockUser.findOne.mockRejectedValue(dbError);

      await expect(
        userRepository.findByEmail('test@example.com')
      ).rejects.toThrow(dbError);
    });
  });

  describe('findByIdWithProfile', () => {
    it('should find user with seller profile', async () => {
      const mockUserWithProfile = {
        id: 1,
        email: 'seller@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'seller',
        sellerProfile: {
          balance: 1000000
        }
      };

      mockUser.findByPk.mockResolvedValue(mockUserWithProfile as any);

      const result = await userRepository.findByIdWithProfile(1);

      expect(mockUser.findByPk).toHaveBeenCalledWith(1, {
        include: [{
          model: SellerProfile,
          as: 'sellerProfile',
          attributes: ['balance']
        }],
        attributes: { exclude: ['passwordHash'] }
      });
      expect(result).toEqual(mockUserWithProfile);
    });

    it('should find user without seller profile', async () => {
      const mockUserWithoutProfile = {
        id: 2,
        email: 'buyer@example.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        role: 'buyer',
        sellerProfile: null
      };

      mockUser.findByPk.mockResolvedValue(mockUserWithoutProfile as any);

      const result = await userRepository.findByIdWithProfile(2);

      expect(result).toEqual(mockUserWithoutProfile);
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'new@example.com',
        passwordHash: 'hashed-password',
        firstName: 'New',
        lastName: 'User',
        phone: '+1234567890',
        role: 'buyer' as const,
        status: 'active' as const
      };

      const mockCreatedUser = { id: 3, ...userData };
      mockUser.create.mockResolvedValue(mockCreatedUser as any);

      const result = await userRepository.createUser(userData);

      expect(mockUser.create).toHaveBeenCalledWith(userData, undefined);
      expect(result).toEqual(mockCreatedUser);
    });

    it('should create user with transaction', async () => {
      const userData = {
        email: 'new@example.com',
        passwordHash: 'hashed-password',
        firstName: 'New',
        lastName: 'User',
        role: 'buyer' as const,
        status: 'active' as const
      };

      const mockTransaction = { id: 'transaction-1' };
      const mockCreatedUser = { id: 3, ...userData };
      mockUser.create.mockResolvedValue(mockCreatedUser as any);

      const result = await userRepository.createUser(userData, { 
        transaction: mockTransaction as any 
      });

      expect(mockUser.create).toHaveBeenCalledWith(userData, {
        transaction: mockTransaction
      });
      expect(result).toEqual(mockCreatedUser);
    });

    it('should handle creation errors', async () => {
      const userData = {
        email: 'duplicate@example.com',
        passwordHash: 'hashed-password',
        firstName: 'Duplicate',
        role: 'buyer' as const,
        status: 'active' as const
      };

      const duplicateError = new Error('Email already exists');
      mockUser.create.mockRejectedValue(duplicateError);

      await expect(
        userRepository.createUser(userData)
      ).rejects.toThrow(duplicateError);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+9876543210'
      };

      const mockUpdatedUser = {
        id: 1,
        email: 'user@example.com',
        ...updateData
      };

      mockUser.update.mockResolvedValue([1] as any);
      jest.spyOn(userRepository, 'findByIdWithProfile')
        .mockResolvedValue(mockUpdatedUser as any);

      const result = await userRepository.updateUser(1, updateData);

      expect(mockUser.update).toHaveBeenCalledWith(updateData, {
        where: { id: 1 }
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should return null when user not found', async () => {
      const updateData = { firstName: 'Updated' };

      mockUser.update.mockResolvedValue([0] as any);

      const result = await userRepository.updateUser(999, updateData);

      expect(result).toBeNull();
    });
  });

  describe('emailExists', () => {
    it('should return true when email exists', async () => {
      mockUser.count.mockResolvedValue(1);

      const result = await userRepository.emailExists('existing@example.com');

      expect(mockUser.count).toHaveBeenCalledWith({
        where: { email: 'existing@example.com' }
      });
      expect(result).toBe(true);
    });

    it('should return false when email does not exist', async () => {
      mockUser.count.mockResolvedValue(0);

      const result = await userRepository.emailExists('new@example.com');

      expect(result).toBe(false);
    });

    it('should exclude specific user ID when checking', async () => {
      mockUser.count.mockResolvedValue(0);

      await userRepository.emailExists('test@example.com', 1);

      expect(mockUser.count).toHaveBeenCalledWith({
        where: { 
          email: 'test@example.com',
          id: { [require('sequelize').Op.ne]: 1 }
        }
      });
    });
  });

  describe('findUsersWithFilters', () => {
    it('should find users with pagination', async () => {
      const mockUsers = [
        { id: 1, email: 'user1@example.com', role: 'buyer' },
        { id: 2, email: 'user2@example.com', role: 'seller' }
      ];

      const mockResult = {
        rows: mockUsers,
        count: 2
      };

      mockUser.findAndCountAll.mockResolvedValue(mockResult as any);

      const result = await userRepository.findUsersWithFilters(
        {},
        { page: 1, limit: 20 }
      );

      expect(mockUser.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        include: [{
          model: SellerProfile,
          as: 'sellerProfile',
          attributes: ['balance'],
          required: false
        }],
        attributes: { exclude: ['passwordHash'] },
        order: [['createdAt', 'DESC']],
        limit: 20,
        offset: 0
      });

      expect(result.rows).toEqual(mockUsers);
      expect(result.count).toBe(2);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by role', async () => {
      const mockResult = { rows: [], count: 0 };
      mockUser.findAndCountAll.mockResolvedValue(mockResult as any);

      await userRepository.findUsersWithFilters(
        { role: 'seller' },
        { page: 1, limit: 20 }
      );

      expect(mockUser.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'seller' }
        })
      );
    });

    it('should filter by status', async () => {
      const mockResult = { rows: [], count: 0 };
      mockUser.findAndCountAll.mockResolvedValue(mockResult as any);

      await userRepository.findUsersWithFilters(
        { status: 'active' },
        { page: 1, limit: 20 }
      );

      expect(mockUser.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active' }
        })
      );
    });

    it('should search by text', async () => {
      const mockResult = { rows: [], count: 0 };
      mockUser.findAndCountAll.mockResolvedValue(mockResult as any);

      await userRepository.findUsersWithFilters(
        { search: 'john' },
        { page: 1, limit: 20 }
      );

      expect(mockUser.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            [require('sequelize').Op.or]: [
              { email: { [require('sequelize').Op.iLike]: '%john%' } },
              { firstName: { [require('sequelize').Op.iLike]: '%john%' } },
              { lastName: { [require('sequelize').Op.iLike]: '%john%' } }
            ]
          }
        })
      );
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status successfully', async () => {
      mockUser.update.mockResolvedValue([1] as any);

      const result = await userRepository.updateUserStatus(1, 'blocked');

      expect(mockUser.update).toHaveBeenCalledWith(
        { status: 'blocked' },
        { where: { id: 1 } }
      );
      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      mockUser.update.mockResolvedValue([0] as any);

      const result = await userRepository.updateUserStatus(999, 'blocked');

      expect(result).toBe(false);
    });
  });

  describe('getUserStatistics', () => {
    it('should return user statistics', async () => {
      const mockCounts = [100, 60, 35, 5, 95, 5];
      mockUser.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(60)  // buyers
        .mockResolvedValueOnce(35)  // sellers
        .mockResolvedValueOnce(5)   // admins
        .mockResolvedValueOnce(95)  // active
        .mockResolvedValueOnce(5);  // blocked

      const result = await userRepository.getUserStatistics();

      expect(result).toEqual({
        total: 100,
        buyers: 60,
        sellers: 35,
        admins: 5,
        active: 95,
        blocked: 5
      });

      expect(mockUser.count).toHaveBeenCalledTimes(6);
    });
  });
}); 