import {
  BaseRepository,
  RepositoryOptions,
  PaginationOptions,
  PaginationResult,
} from './baseRepository';
import { Payment, PaymentMethod, Order, User } from '../models';
import { PaymentStatus, PaymentMethodType } from '../types';
import { Op } from 'sequelize';

export interface CreatePaymentData {
  orderId: number;
  paymentMethodId?: number;
  amount: number;
  currency?: string;
  status?: PaymentStatus;
  gatewayResponse?: Record<string, any>;
}

export interface UpdatePaymentData {
  status?: PaymentStatus;
  gatewayResponse?: Record<string, any>;
  paidAt?: Date;
}

export interface CreatePaymentMethodData {
  userId: number;
  type: PaymentMethodType;
  provider?: string;
  maskedAccount?: string;
  expiresAt?: Date;
}

export interface UpdatePaymentMethodData {
  provider?: string;
  maskedAccount?: string;
  expiresAt?: Date;
}

export interface PaymentFilters {
  userId?: number;
  orderId?: number;
  status?: PaymentStatus | PaymentStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
}

export class PaymentRepository extends BaseRepository<Payment> {
  constructor() {
    super(Payment);
  }

  /**
   * Find payment by order ID
   */
  async findByOrderId(orderId: number, options?: RepositoryOptions): Promise<Payment | null> {
    return this.findOne({
      where: { orderId },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'total', 'status'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email', 'firstName', 'lastName'],
            },
          ],
        },
        {
          model: PaymentMethod,
          as: 'paymentMethod',
          attributes: ['id', 'type', 'provider', 'maskedAccount'],
        },
      ],
      ...options,
    });
  }

  /**
   * Find payments by user ID
   */
  async findByUserId(
    userId: number,
    pagination: PaginationOptions = {},
    options?: RepositoryOptions
  ): Promise<PaginationResult<Payment>> {
    return this.findAndCountAll({
      include: [
        {
          model: Order,
          as: 'order',
          where: { userId },
          attributes: ['id', 'orderNumber', 'total', 'status'],
        },
        {
          model: PaymentMethod,
          as: 'paymentMethod',
          attributes: ['id', 'type', 'provider', 'maskedAccount'],
        },
      ],
      order: [['createdAt', 'DESC']],
      ...pagination,
      ...options,
    });
  }

  /**
   * Find payments with advanced filtering
   */
  async findWithFilters(
    filters: PaymentFilters,
    pagination: PaginationOptions = {},
    options?: RepositoryOptions
  ): Promise<PaginationResult<Payment>> {
    const whereClause: any = {};
    const orderWhere: any = {};

    if (filters.orderId) {
      whereClause.orderId = filters.orderId;
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        whereClause.status = { [Op.in]: filters.status };
      } else {
        whereClause.status = filters.status;
      }
    }

    if (filters.currency) {
      whereClause.currency = filters.currency;
    }

    if (filters.minAmount || filters.maxAmount) {
      whereClause.amount = {};
      if (filters.minAmount) {
        whereClause.amount[Op.gte] = filters.minAmount;
      }
      if (filters.maxAmount) {
        whereClause.amount[Op.lte] = filters.maxAmount;
      }
    }

    if (filters.dateFrom || filters.dateTo) {
      whereClause.createdAt = {};
      if (filters.dateFrom) {
        whereClause.createdAt[Op.gte] = filters.dateFrom;
      }
      if (filters.dateTo) {
        whereClause.createdAt[Op.lte] = filters.dateTo;
      }
    }

    if (filters.userId) {
      orderWhere.userId = filters.userId;
    }

    return this.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'total', 'status', 'userId'],
          where: Object.keys(orderWhere).length > 0 ? orderWhere : undefined,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email', 'firstName', 'lastName'],
            },
          ],
        },
        {
          model: PaymentMethod,
          as: 'paymentMethod',
          attributes: ['id', 'type', 'provider', 'maskedAccount'],
        },
      ],
      order: [['createdAt', 'DESC']],
      ...pagination,
      ...options,
    });
  }

  /**
   * Create payment
   */
  async createPayment(
    paymentData: CreatePaymentData,
    options?: RepositoryOptions
  ): Promise<Payment> {
    const payment = await this.create(paymentData, options);

    // Reload with associations
    return this.findByPk(payment.id, {
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'total', 'status'],
        },
        {
          model: PaymentMethod,
          as: 'paymentMethod',
          attributes: ['id', 'type', 'provider', 'maskedAccount'],
        },
      ],
      ...options,
    }) as Promise<Payment>;
  }

  /**
   * Update payment
   */
  async updatePayment(
    paymentId: number,
    updateData: UpdatePaymentData,
    options?: RepositoryOptions
  ): Promise<Payment | null> {
    const [affectedCount] = await this.update(updateData, {
      where: { id: paymentId },
      ...options,
    });

    if (affectedCount === 0) {
      return null;
    }

    return this.findByPk(paymentId, {
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'total', 'status'],
        },
        {
          model: PaymentMethod,
          as: 'paymentMethod',
          attributes: ['id', 'type', 'provider', 'maskedAccount'],
        },
      ],
      ...options,
    });
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    paymentId: number,
    status: PaymentStatus,
    gatewayResponse?: Record<string, any>,
    options?: RepositoryOptions
  ): Promise<Payment | null> {
    const updateData: UpdatePaymentData = {
      status,
      gatewayResponse,
      ...(status === 'success' && { paidAt: new Date() }),
    };

    return this.updatePayment(paymentId, updateData, options);
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(
    filters: Partial<PaymentFilters> = {},
    options?: RepositoryOptions
  ): Promise<any> {
    const whereClause: any = {};
    const orderWhere: any = {};

    if (filters.userId) {
      orderWhere.userId = filters.userId;
    }

    if (filters.dateFrom || filters.dateTo) {
      whereClause.createdAt = {};
      if (filters.dateFrom) {
        whereClause.createdAt[Op.gte] = filters.dateFrom;
      }
      if (filters.dateTo) {
        whereClause.createdAt[Op.lte] = filters.dateTo;
      }
    }

    const stats = await this.model.findAll({
      where: whereClause,
      attributes: [
        'status',
        [this.model.sequelize!.fn('COUNT', this.model.sequelize!.col('id')), 'count'],
        [this.model.sequelize!.fn('SUM', this.model.sequelize!.col('amount')), 'totalAmount'],
      ],
      include:
        Object.keys(orderWhere).length > 0
          ? [
              {
                model: Order,
                as: 'order',
                attributes: [],
                where: orderWhere,
              },
            ]
          : [],
      group: ['status'],
      raw: true,
      ...options,
    });

    return stats;
  }
}

export class PaymentMethodRepository extends BaseRepository<PaymentMethod> {
  constructor() {
    super(PaymentMethod);
  }

  /**
   * Find payment methods by user ID
   */
  async findByUserId(userId: number, options?: RepositoryOptions): Promise<PaymentMethod[]> {
    return this.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      ...options,
    });
  }

  /**
   * Find payment method by user and type
   */
  async findByUserIdAndType(
    userId: number,
    type: PaymentMethodType,
    options?: RepositoryOptions
  ): Promise<PaymentMethod[]> {
    return this.findAll({
      where: { userId, type },
      order: [['createdAt', 'DESC']],
      ...options,
    });
  }

  /**
   * Create payment method
   */
  async createPaymentMethod(
    methodData: CreatePaymentMethodData,
    options?: RepositoryOptions
  ): Promise<PaymentMethod> {
    return this.create(methodData, options);
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(
    methodId: number,
    updateData: UpdatePaymentMethodData,
    options?: RepositoryOptions
  ): Promise<PaymentMethod | null> {
    const [affectedCount] = await this.update(updateData, {
      where: { id: methodId },
      ...options,
    });

    if (affectedCount === 0) {
      return null;
    }

    return this.findByPk(methodId, options);
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(methodId: number, options?: RepositoryOptions): Promise<boolean> {
    const affectedCount = await this.destroy({
      where: { id: methodId },
      ...options,
    });

    return affectedCount > 0;
  }

  /**
   * Check if user owns payment method
   */
  async isOwnedByUser(
    methodId: number,
    userId: number,
    options?: RepositoryOptions
  ): Promise<boolean> {
    const method = await this.findOne({
      where: { id: methodId, userId },
      ...options,
    });

    return method !== null;
  }
}
