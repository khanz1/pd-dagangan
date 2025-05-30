import bcrypt from 'bcryptjs';
import { UserRepository, UserFilters } from '@/repositories/userRepository';
import { logger } from '@/config/logger';
import { UserStatus } from '@/types';
import { NotFoundError, BadRequestError, ErrorMessages } from '@/types/errors';

export interface UpdateUserProfileData {
  firstName?: string | undefined;
  lastName?: string | undefined;
  phone?: string | undefined;
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  role?: string | undefined;
  status?: string | undefined;
  search?: string | undefined;
}

export interface UserProfileResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  role: string;
  status: string;
  sellerProfile?: {
    balance: number;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  private static userRepository = new UserRepository();

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: number): Promise<UserProfileResponse> {
    const user = await this.userRepository.findByIdWithProfile(userId);

    if (!user) {
      throw new NotFoundError(ErrorMessages.USER_NOT_FOUND);
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      sellerProfile: user.sellerProfile ? {
        balance: user.sellerProfile.balance
      } : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * Get user by ID (for admin use)
   */
  static async getUserById(userId: number): Promise<UserProfileResponse> {
    return this.getUserProfile(userId);
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: number, data: UpdateUserProfileData): Promise<UserProfileResponse> {
    const updatedUser = await this.userRepository.updateUser(userId, data);

    if (!updatedUser) {
      throw new NotFoundError(ErrorMessages.USER_NOT_FOUND);
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      role: updatedUser.role,
      status: updatedUser.status,
      sellerProfile: updatedUser.sellerProfile ? {
        balance: updatedUser.sellerProfile.balance
      } : null,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };
  }

  /**
   * Update user status (admin only)
   */
  static async updateUserStatus(userId: number, status: UserStatus): Promise<{
    message: string;
    user: {
      id: number;
      email: string;
      status: string;
      updatedAt: Date;
    };
  }> {
    const user = await this.userRepository.findByPk(userId);
    if (!user) {
      throw new NotFoundError(ErrorMessages.USER_NOT_FOUND);
    }

    const success = await this.userRepository.updateUserStatus(userId, status);
    if (!success) {
      throw new BadRequestError('Failed to update user status');
    }

    // Get updated user data
    const updatedUser = await this.userRepository.findByPk(userId);

    logger.info(`User status updated: ${user.email} -> ${status}`);

    return {
      message: 'User status updated successfully',
      user: {
        id: updatedUser!.id,
        email: updatedUser!.email,
        status: updatedUser!.status,
        updatedAt: updatedUser!.updatedAt
      }
    };
  }

  /**
   * List users with pagination and filters
   */
  static async listUsers(query: UserListQuery): Promise<{
    users: UserProfileResponse[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    const { page = 1, limit = 20, role, status, search } = query;

    const filters: UserFilters = {};
    if (role) filters.role = role as any;
    if (status) filters.status = status as any;
    if (search) filters.search = search;

    const result = await this.userRepository.findUsersWithFilters(
      filters,
      { page, limit }
    );

    const users = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      sellerProfile: user.sellerProfile ? {
        balance: user.sellerProfile.balance
      } : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    return {
      users,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.count,
        itemsPerPage: result.itemsPerPage
      }
    };
  }

  /**
   * Change user password
   */
  static async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findByPk(userId);
    if (!user) {
      throw new NotFoundError(ErrorMessages.USER_NOT_FOUND);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new BadRequestError(ErrorMessages.CURRENT_PASSWORD_INCORRECT);
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const success = await this.userRepository.updatePassword(userId, newPasswordHash);
    if (!success) {
      throw new BadRequestError('Failed to update password');
    }

    logger.info(`Password changed for user: ${user.email}`);
  }

  /**
   * Get user statistics (admin only)
   */
  static async getUserStatistics(): Promise<{
    total: number;
    buyers: number;
    sellers: number;
    admins: number;
    active: number;
    blocked: number;
  }> {
    return this.userRepository.getUserStatistics();
  }
} 