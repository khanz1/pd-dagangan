import { BaseRepository, RepositoryOptions, PaginationOptions, PaginationResult } from './baseRepository';
import { User, SellerProfile } from '@/models';
import { UserRole, UserStatus } from '@/types';

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string; // Search in email, firstName, lastName
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName?: string | undefined;
  phone?: string | undefined;
  role: UserRole;
  status: UserStatus;
}

export interface UpdateUserData {
  firstName?: string | undefined;
  lastName?: string | undefined;
  phone?: string | undefined;
  status?: UserStatus;
}

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string, options?: RepositoryOptions): Promise<User | null> {
    return this.findOne({
      where: { email },
      ...options
    });
  }

  /**
   * Find user by ID with seller profile included
   */
  async findByIdWithProfile(userId: number, options?: RepositoryOptions): Promise<User | null> {
    return this.findByPk(userId, {
      include: [{
        model: SellerProfile,
        as: 'sellerProfile',
        attributes: ['balance']
      }],
      attributes: { exclude: ['passwordHash'] },
      ...options
    });
  }

  /**
   * Find user by email with seller profile included
   */
  async findByEmailWithProfile(email: string, options?: RepositoryOptions): Promise<User | null> {
    return this.findOne({
      where: { email },
      include: [{
        model: SellerProfile,
        as: 'sellerProfile',
        attributes: ['balance']
      }],
      ...options
    });
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserData, options?: RepositoryOptions): Promise<User> {
    return this.create(userData, options);
  }

  /**
   * Update user by ID
   */
  async updateUser(userId: number, userData: UpdateUserData, options?: RepositoryOptions): Promise<User | null> {
    const [affectedRows] = await this.update(userData, {
      where: { id: userId },
      ...options
    });

    if (affectedRows === 0) {
      return null;
    }

    // Return updated user with profile
    return this.findByIdWithProfile(userId, options);
  }

  /**
   * Update user password
   */
  async updatePassword(userId: number, passwordHash: string, options?: RepositoryOptions): Promise<boolean> {
    const [affectedRows] = await this.update(
      { passwordHash },
      {
        where: { id: userId },
        ...options
      }
    );

    return affectedRows > 0;
  }

  /**
   * Check if email exists (excluding specific user ID)
   */
  async emailExists(email: string, excludeUserId?: number, options?: RepositoryOptions): Promise<boolean> {
    const whereConditions: any = { email };
    
    if (excludeUserId) {
      whereConditions.id = { [require('sequelize').Op.ne]: excludeUserId };
    }

    return this.exists(whereConditions, options);
  }

  /**
   * Find users with pagination and filters
   */
  async findUsersWithFilters(
    filters: UserFilters = {},
    pagination: PaginationOptions = {},
    options?: RepositoryOptions
  ): Promise<PaginationResult<User>> {
    const { role, status, search } = filters;
    const whereConditions: any = {};

    // Apply filters
    if (role) {
      whereConditions.role = role;
    }

    if (status) {
      whereConditions.status = status;
    }

    if (search) {
      const { Op } = require('sequelize');
      whereConditions[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    return this.findAndCountAll({
      where: whereConditions,
      include: [{
        model: SellerProfile,
        as: 'sellerProfile',
        attributes: ['balance'],
        required: false
      }],
      attributes: { exclude: ['passwordHash'] },
      order: [['createdAt', 'DESC']],
      ...pagination,
      ...options
    });
  }

  /**
   * Get users by role
   */
  async findByRole(role: UserRole, options?: RepositoryOptions): Promise<User[]> {
    return this.findAll({
      where: { role },
      attributes: { exclude: ['passwordHash'] },
      ...options
    });
  }

  /**
   * Get active users count by role
   */
  async countActiveUsersByRole(role?: UserRole, options?: RepositoryOptions): Promise<number> {
    const whereConditions: any = { status: 'active' };
    
    if (role) {
      whereConditions.role = role;
    }

    return this.count({
      where: whereConditions,
      ...options
    });
  }

  /**
   * Block/unblock user
   */
  async updateUserStatus(userId: number, status: UserStatus, options?: RepositoryOptions): Promise<boolean> {
    const [affectedRows] = await this.update(
      { status },
      {
        where: { id: userId },
        ...options
      }
    );

    return affectedRows > 0;
  }

  /**
   * Get users with seller profiles only
   */
  async findSellers(pagination: PaginationOptions = {}, options?: RepositoryOptions): Promise<PaginationResult<User>> {
    return this.findAndCountAll({
      where: { role: 'seller' },
      include: [{
        model: SellerProfile,
        as: 'sellerProfile',
        attributes: ['balance']
      }],
      attributes: { exclude: ['passwordHash'] },
      order: [['createdAt', 'DESC']],
      ...pagination,
      ...options
    });
  }

  /**
   * Soft delete user (set status to blocked)
   */
  async softDeleteUser(userId: number, options?: RepositoryOptions): Promise<boolean> {
    return this.updateUserStatus(userId, 'blocked', options);
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(options?: RepositoryOptions): Promise<{
    total: number;
    buyers: number;
    sellers: number;
    admins: number;
    active: number;
    blocked: number;
  }> {
    const [total, buyers, sellers, admins, active, blocked] = await Promise.all([
      this.count(options),
      this.count({ where: { role: 'buyer' }, ...options }),
      this.count({ where: { role: 'seller' }, ...options }),
      this.count({ where: { role: 'admin' }, ...options }),
      this.count({ where: { status: 'active' }, ...options }),
      this.count({ where: { status: 'blocked' }, ...options })
    ]);

    return {
      total,
      buyers,
      sellers,
      admins,
      active,
      blocked
    };
  }
} 