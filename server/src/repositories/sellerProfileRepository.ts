import { BaseRepository, RepositoryOptions } from './baseRepository';
import { SellerProfile } from '@/models';

export interface CreateSellerProfileData {
  userId: number;
  balance?: number;
}

export interface UpdateSellerProfileData {
  balance?: number;
}

export class SellerProfileRepository extends BaseRepository<SellerProfile> {
  constructor() {
    super(SellerProfile);
  }

  /**
   * Find seller profile by user ID
   */
  async findByUserId(userId: number, options?: RepositoryOptions): Promise<SellerProfile | null> {
    return this.findOne({
      where: { userId },
      ...options
    });
  }

  /**
   * Create seller profile
   */
  async createSellerProfile(data: CreateSellerProfileData, options?: RepositoryOptions): Promise<SellerProfile> {
    return this.create({
      userId: data.userId,
      balance: data.balance || 0
    }, options);
  }

  /**
   * Update seller profile
   */
  async updateSellerProfile(
    userId: number, 
    data: UpdateSellerProfileData, 
    options?: RepositoryOptions
  ): Promise<SellerProfile | null> {
    const [affectedRows] = await this.update(data, {
      where: { userId },
      ...options
    });

    if (affectedRows === 0) {
      return null;
    }

    return this.findByUserId(userId, options);
  }

  /**
   * Update seller balance
   */
  async updateBalance(userId: number, newBalance: number, options?: RepositoryOptions): Promise<boolean> {
    const [affectedRows] = await this.update(
      { balance: newBalance },
      {
        where: { userId },
        ...options
      }
    );

    return affectedRows > 0;
  }

  /**
   * Add to seller balance
   */
  async addToBalance(userId: number, amount: number, options?: RepositoryOptions): Promise<boolean> {
    // Using raw SQL to avoid race conditions
    const { QueryTypes } = require('sequelize');
    const sequelize = this.model.sequelize;

    const [, results] = await sequelize!.query(
      'UPDATE "SellerProfiles" SET balance = balance + :amount WHERE "userId" = :userId',
      {
        replacements: { amount, userId },
        type: QueryTypes.UPDATE,
        ...(options?.transaction && { transaction: options.transaction })
      }
    );

    return (results as number) > 0;
  }

  /**
   * Subtract from seller balance (with validation)
   */
  async subtractFromBalance(userId: number, amount: number, options?: RepositoryOptions): Promise<boolean> {
    // Check if seller has sufficient balance first
    const profile = await this.findByUserId(userId, options);
    if (!profile || profile.balance < amount) {
      return false;
    }

    // Using raw SQL to avoid race conditions
    const { QueryTypes } = require('sequelize');
    const sequelize = this.model.sequelize;

    const [, results] = await sequelize!.query(
      'UPDATE "SellerProfiles" SET balance = balance - :amount WHERE "userId" = :userId AND balance >= :amount',
      {
        replacements: { amount, userId },
        type: QueryTypes.UPDATE,
        ...(options?.transaction && { transaction: options.transaction })
      }
    );

    return (results as number) > 0;
  }

  /**
   * Get total balance across all sellers
   */
  async getTotalBalance(options?: RepositoryOptions): Promise<number> {
    const { QueryTypes } = require('sequelize');
    const sequelize = this.model.sequelize;

    const result = await sequelize!.query(
      'SELECT COALESCE(SUM(balance), 0) as total FROM "SellerProfiles"',
      {
        type: QueryTypes.SELECT,
        plain: true,
        ...(options?.transaction && { transaction: options.transaction })
      }
    ) as unknown as { total: string };

    return parseFloat(result.total);
  }

  /**
   * Get sellers with highest balances
   */
  async getTopSellersByBalance(limit: number = 10, options?: RepositoryOptions): Promise<SellerProfile[]> {
    return this.findAll({
      order: [['balance', 'DESC']],
      limit,
      ...options
    });
  }

  /**
   * Check if seller profile exists
   */
  async existsByUserId(userId: number, options?: RepositoryOptions): Promise<boolean> {
    return this.exists({ userId }, options);
  }

  /**
   * Get seller balance
   */
  async getBalance(userId: number, options?: RepositoryOptions): Promise<number> {
    const profile = await this.findByUserId(userId, options);
    return profile?.balance || 0;
  }

  /**
   * Transfer balance between sellers
   */
  async transferBalance(
    fromUserId: number, 
    toUserId: number, 
    amount: number, 
    options?: RepositoryOptions
  ): Promise<boolean> {
    // This should be wrapped in a transaction by the service layer
    const success = await this.subtractFromBalance(fromUserId, amount, options);
    if (!success) {
      return false;
    }

    return this.addToBalance(toUserId, amount, options);
  }

  /**
   * Get balance statistics
   */
  async getBalanceStatistics(options?: RepositoryOptions): Promise<{
    totalBalance: number;
    averageBalance: number;
    sellerCount: number;
    maxBalance: number;
    minBalance: number;
  }> {
    const { QueryTypes } = require('sequelize');
    const sequelize = this.model.sequelize;

    const result = await sequelize!.query(
      `SELECT 
        COALESCE(SUM(balance), 0) as "totalBalance",
        COALESCE(AVG(balance), 0) as "averageBalance",
        COUNT(*) as "sellerCount",
        COALESCE(MAX(balance), 0) as "maxBalance",
        COALESCE(MIN(balance), 0) as "minBalance"
       FROM "SellerProfiles"`,
      {
        type: QueryTypes.SELECT,
        plain: true,
        ...(options?.transaction && { transaction: options.transaction })
      }
    ) as unknown as {
      totalBalance: string;
      averageBalance: string;
      sellerCount: string;
      maxBalance: string;
      minBalance: string;
    };

    return {
      totalBalance: parseFloat(result.totalBalance),
      averageBalance: parseFloat(result.averageBalance),
      sellerCount: parseInt(result.sellerCount),
      maxBalance: parseFloat(result.maxBalance),
      minBalance: parseFloat(result.minBalance)
    };
  }
} 