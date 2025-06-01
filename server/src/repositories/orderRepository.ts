import {
  BaseRepository,
  RepositoryOptions,
  PaginationOptions,
  PaginationResult,
} from './baseRepository';
import { Order, OrderItem, Product, User, Coupon } from '../models';
import { OrderStatus } from '../types';
import { Op } from 'sequelize';

export interface CreateOrderData {
  userId: number;
  orderNumber: string;
  subtotal: number;
  tax: number;
  shippingFee: number;
  total: number;
  couponId?: number;
  status?: OrderStatus;
}

export interface CreateOrderItemData {
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxAmount?: number;
}

export interface UpdateOrderData {
  status?: OrderStatus;
  couponId?: number;
}

export interface OrderFilters {
  userId?: number;
  status?: OrderStatus | OrderStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  minTotal?: number;
  maxTotal?: number;
  orderNumber?: string;
}

export class OrderRepository extends BaseRepository<Order> {
  constructor() {
    super(Order);
  }

  /**
   * Find order by order number
   */
  async findByOrderNumber(orderNumber: string, options?: RepositoryOptions): Promise<Order | null> {
    return this.findOne({
      where: { orderNumber },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'price'],
            },
          ],
        },
        {
          model: Coupon,
          as: 'coupon',
          attributes: ['id', 'code', 'type', 'value'],
        },
      ],
      ...options,
    });
  }

  /**
   * Find orders by user ID with pagination
   */
  async findByUserId(
    userId: number,
    pagination: PaginationOptions = {},
    options?: RepositoryOptions
  ): Promise<PaginationResult<Order>> {
    return this.findAndCountAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'price', 'slug'],
            },
          ],
        },
        {
          model: Coupon,
          as: 'coupon',
          attributes: ['id', 'code', 'type', 'value'],
        },
      ],
      order: [['createdAt', 'DESC']],
      ...pagination,
      ...options,
    });
  }

  /**
   * Find orders with advanced filtering
   */
  async findWithFilters(
    filters: OrderFilters,
    pagination: PaginationOptions = {},
    options?: RepositoryOptions
  ): Promise<PaginationResult<Order>> {
    const whereClause: any = {};

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        whereClause.status = { [Op.in]: filters.status };
      } else {
        whereClause.status = filters.status;
      }
    }

    if (filters.orderNumber) {
      whereClause.orderNumber = { [Op.iLike]: `%${filters.orderNumber}%` };
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

    if (filters.minTotal || filters.maxTotal) {
      whereClause.total = {};
      if (filters.minTotal) {
        whereClause.total[Op.gte] = filters.minTotal;
      }
      if (filters.maxTotal) {
        whereClause.total[Op.lte] = filters.maxTotal;
      }
    }

    return this.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'price', 'slug'],
            },
          ],
        },
        {
          model: Coupon,
          as: 'coupon',
          attributes: ['id', 'code', 'type', 'value'],
        },
      ],
      order: [['createdAt', 'DESC']],
      ...pagination,
      ...options,
    });
  }

  /**
   * Create order with items
   */
  async createOrder(
    orderData: CreateOrderData,
    items: CreateOrderItemData[],
    options?: RepositoryOptions
  ): Promise<Order> {
    const order = await this.create(orderData, options);

    // Create order items data
    const orderItemsData = items.map(item => ({
      ...item,
      orderId: order.id,
      discountAmount: item.discountAmount || 0,
      taxAmount: item.taxAmount || 0,
    }));

    await OrderItem.bulkCreate(orderItemsData, {
      transaction: options?.transaction,
    });

    // Reload order with items
    return this.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'price'],
            },
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
        {
          model: Coupon,
          as: 'coupon',
          attributes: ['id', 'code', 'type', 'value'],
        },
      ],
      ...options,
    }) as Promise<Order>;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: number,
    status: OrderStatus,
    options?: RepositoryOptions
  ): Promise<Order | null> {
    const [affectedCount] = await this.update(
      { status },
      {
        where: { id: orderId },
        ...options,
      }
    );

    if (affectedCount === 0) {
      return null;
    }

    return this.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'price'],
            },
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
      ],
      ...options,
    });
  }

  /**
   * Get order statistics for user
   */
  async getUserOrderStats(userId: number, options?: RepositoryOptions): Promise<any> {
    const stats = await this.model.findAll({
      where: { userId },
      attributes: [
        'status',
        [this.model.sequelize!.fn('COUNT', this.model.sequelize!.col('id')), 'count'],
        [this.model.sequelize!.fn('SUM', this.model.sequelize!.col('total')), 'totalAmount'],
      ],
      group: ['status'],
      raw: true,
      ...options,
    });

    return stats;
  }

  /**
   * Generate unique order number
   */
  async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');

    const datePrefix = `${year}${month}${day}`;

    // Find the last order for today
    const lastOrder = await this.findOne({
      where: {
        orderNumber: {
          [Op.like]: `${datePrefix}%`,
        },
      },
      order: [['orderNumber', 'DESC']],
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${datePrefix}${sequence.toString().padStart(4, '0')}`;
  }
}

export class OrderItemRepository extends BaseRepository<OrderItem> {
  constructor() {
    super(OrderItem);
  }

  /**
   * Find items by order ID
   */
  async findByOrderId(orderId: number, options?: RepositoryOptions): Promise<OrderItem[]> {
    return this.findAll({
      where: { orderId },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'price', 'slug', 'stockQuantity'],
        },
      ],
      order: [['createdAt', 'ASC']],
      ...options,
    });
  }

  /**
   * Find items by product ID
   */
  async findByProductId(productId: number, options?: RepositoryOptions): Promise<OrderItem[]> {
    return this.findAll({
      where: { productId },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'status', 'userId'],
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'price'],
        },
      ],
      order: [['createdAt', 'DESC']],
      ...options,
    });
  }

  /**
   * Create order item
   */
  async createOrderItem(
    itemData: CreateOrderItemData,
    options?: RepositoryOptions
  ): Promise<OrderItem> {
    const orderItem = await this.create(itemData, options);

    // Reload with associations
    return this.findByPk(orderItem.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'price'],
        },
      ],
      ...options,
    }) as Promise<OrderItem>;
  }

  /**
   * Get order item total by order
   */
  async getOrderItemTotal(orderId: number, options?: RepositoryOptions): Promise<number> {
    const result = await this.model.findOne({
      where: { orderId },
      attributes: [
        [
          this.model.sequelize!.fn(
            'SUM',
            this.model.sequelize!.literal('(unit_price + tax_amount - discount_amount) * quantity')
          ),
          'total',
        ],
      ],
      raw: true,
      ...options,
    });

    return parseFloat((result as any)?.total || '0');
  }
}
