import {
  BaseRepository,
  RepositoryOptions,
  PaginationOptions,
  PaginationResult,
} from './baseRepository';
import { InventoryLog, Product } from '@/models';
import { Op } from 'sequelize';

export interface CreateInventoryLogData {
  productId: number;
  changeAmount: number;
  reason: string;
}

export interface InventoryLogFilters {
  productId?: number;
  reason?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export class InventoryLogRepository extends BaseRepository<InventoryLog> {
  constructor() {
    super(InventoryLog);
  }

  /**
   * Find inventory logs by product ID
   */
  async findByProductId(
    productId: number,
    pagination: PaginationOptions = {},
    options?: RepositoryOptions
  ): Promise<PaginationResult<InventoryLog>> {
    return this.findAndCountAll({
      where: { productId },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku'],
        },
      ],
      order: [['createdAt', 'DESC']],
      ...pagination,
      ...options,
    });
  }

  /**
   * Find inventory logs with filters
   */
  async findWithFilters(
    filters: InventoryLogFilters = {},
    pagination: PaginationOptions = {},
    options?: RepositoryOptions
  ): Promise<PaginationResult<InventoryLog>> {
    const { productId, reason, dateFrom, dateTo } = filters;
    const whereConditions: any = {};

    if (productId) {
      whereConditions.productId = productId;
    }

    if (reason) {
      whereConditions.reason = { [Op.iLike]: `%${reason}%` };
    }

    if (dateFrom || dateTo) {
      whereConditions.createdAt = {};
      if (dateFrom) {
        whereConditions.createdAt[Op.gte] = dateFrom;
      }
      if (dateTo) {
        whereConditions.createdAt[Op.lte] = dateTo;
      }
    }

    return this.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku'],
        },
      ],
      order: [['createdAt', 'DESC']],
      ...pagination,
      ...options,
    });
  }

  /**
   * Create inventory log entry
   */
  async createLog(
    logData: CreateInventoryLogData,
    options?: RepositoryOptions
  ): Promise<InventoryLog> {
    return this.create(logData, options);
  }

  /**
   * Get total stock changes for a product
   */
  async getTotalStockChanges(productId: number, options?: RepositoryOptions): Promise<number> {
    const result = await this.model.sum('changeAmount', {
      where: { productId },
      ...options,
    });

    return result || 0;
  }

  /**
   * Get stock changes by reason for a product
   */
  async getStockChangesByReason(productId: number, options?: RepositoryOptions): Promise<any[]> {
    const result = await this.model.findAll({
      where: { productId },
      attributes: [
        'reason',
        [this.model.sequelize!.fn('SUM', this.model.sequelize!.col('changeAmount')), 'totalChange'],
        [this.model.sequelize!.fn('COUNT', this.model.sequelize!.col('id')), 'entryCount'],
      ],
      group: ['reason'],
      order: [[this.model.sequelize!.fn('SUM', this.model.sequelize!.col('changeAmount')), 'DESC']],
      ...options,
    });

    return result.map((item: any) => ({
      reason: item.reason,
      totalChange: parseInt(item.getDataValue('totalChange')),
      entryCount: parseInt(item.getDataValue('entryCount')),
    }));
  }

  /**
   * Get recent stock movements
   */
  async getRecentMovements(
    limit: number = 50,
    options?: RepositoryOptions
  ): Promise<InventoryLog[]> {
    return this.findAll({
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      ...options,
    });
  }
}
