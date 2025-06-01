import {
  BaseRepository,
  RepositoryOptions,
  PaginationOptions,
  PaginationResult,
} from './baseRepository';
import { Shipment, Order, Address, User } from '../models';
import { ShipmentStatus } from '../types';
import { Op } from 'sequelize';

export interface CreateShipmentData {
  orderId: number;
  addressId: number;
  courier?: string;
  trackingNumber?: string;
  status?: ShipmentStatus;
}

export interface UpdateShipmentData {
  courier?: string;
  trackingNumber?: string;
  status?: ShipmentStatus;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface ShipmentFilters {
  userId?: number;
  orderId?: number;
  status?: ShipmentStatus | ShipmentStatus[];
  courier?: string;
  dateFrom?: Date;
  dateTo?: Date;
  trackingNumber?: string;
}

export class ShipmentRepository extends BaseRepository<Shipment> {
  constructor() {
    super(Shipment);
  }

  /**
   * Find shipment by order ID
   */
  async findByOrderId(orderId: number, options?: RepositoryOptions): Promise<Shipment | null> {
    return this.findOne({
      where: { orderId },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'status', 'userId'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email', 'firstName', 'lastName'],
            },
          ],
        },
        {
          model: Address,
          as: 'address',
          attributes: [
            'id',
            'type',
            'street1',
            'street2',
            'city',
            'province',
            'postalCode',
            'country',
          ],
        },
      ],
      ...options,
    });
  }

  /**
   * Find shipment by tracking number
   */
  async findByTrackingNumber(
    trackingNumber: string,
    options?: RepositoryOptions
  ): Promise<Shipment | null> {
    return this.findOne({
      where: { trackingNumber },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'status', 'userId'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email', 'firstName', 'lastName'],
            },
          ],
        },
        {
          model: Address,
          as: 'address',
          attributes: [
            'id',
            'type',
            'street1',
            'street2',
            'city',
            'province',
            'postalCode',
            'country',
          ],
        },
      ],
      ...options,
    });
  }

  /**
   * Find shipments by user ID
   */
  async findByUserId(
    userId: number,
    pagination: PaginationOptions = {},
    options?: RepositoryOptions
  ): Promise<PaginationResult<Shipment>> {
    return this.findAndCountAll({
      include: [
        {
          model: Order,
          as: 'order',
          where: { userId },
          attributes: ['id', 'orderNumber', 'status'],
        },
        {
          model: Address,
          as: 'address',
          attributes: [
            'id',
            'type',
            'street1',
            'street2',
            'city',
            'province',
            'postalCode',
            'country',
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      ...pagination,
      ...options,
    });
  }

  /**
   * Find shipments with advanced filtering
   */
  async findWithFilters(
    filters: ShipmentFilters,
    pagination: PaginationOptions = {},
    options?: RepositoryOptions
  ): Promise<PaginationResult<Shipment>> {
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

    if (filters.courier) {
      whereClause.courier = { [Op.iLike]: `%${filters.courier}%` };
    }

    if (filters.trackingNumber) {
      whereClause.trackingNumber = { [Op.iLike]: `%${filters.trackingNumber}%` };
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
          attributes: ['id', 'orderNumber', 'status', 'userId'],
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
          model: Address,
          as: 'address',
          attributes: [
            'id',
            'type',
            'street1',
            'street2',
            'city',
            'province',
            'postalCode',
            'country',
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      ...pagination,
      ...options,
    });
  }

  /**
   * Create shipment
   */
  async createShipment(
    shipmentData: CreateShipmentData,
    options?: RepositoryOptions
  ): Promise<Shipment> {
    const shipment = await this.create(shipmentData, options);

    // Reload with associations
    return this.findByPk(shipment.id, {
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'status'],
        },
        {
          model: Address,
          as: 'address',
          attributes: [
            'id',
            'type',
            'street1',
            'street2',
            'city',
            'province',
            'postalCode',
            'country',
          ],
        },
      ],
      ...options,
    }) as Promise<Shipment>;
  }

  /**
   * Update shipment
   */
  async updateShipment(
    shipmentId: number,
    updateData: UpdateShipmentData,
    options?: RepositoryOptions
  ): Promise<Shipment | null> {
    const [affectedCount] = await this.update(updateData, {
      where: { id: shipmentId },
      ...options,
    });

    if (affectedCount === 0) {
      return null;
    }

    return this.findByPk(shipmentId, {
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'status'],
        },
        {
          model: Address,
          as: 'address',
          attributes: [
            'id',
            'type',
            'street1',
            'street2',
            'city',
            'province',
            'postalCode',
            'country',
          ],
        },
      ],
      ...options,
    });
  }

  /**
   * Update shipment status
   */
  async updateShipmentStatus(
    shipmentId: number,
    status: ShipmentStatus,
    options?: RepositoryOptions
  ): Promise<Shipment | null> {
    const updateData: UpdateShipmentData = {
      status,
      ...(status === 'in_transit' && { shippedAt: new Date() }),
      ...(status === 'delivered' && { deliveredAt: new Date() }),
    };

    return this.updateShipment(shipmentId, updateData, options);
  }

  /**
   * Generate tracking number
   */
  generateTrackingNumber(courier: string = 'JNE'): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${courier}${timestamp.slice(-8)}${random}`;
  }

  /**
   * Get shipment statistics
   */
  async getShipmentStats(
    filters: Partial<ShipmentFilters> = {},
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

  /**
   * Find shipments by courier
   */
  async findByCourier(
    courier: string,
    pagination: PaginationOptions = {},
    options?: RepositoryOptions
  ): Promise<PaginationResult<Shipment>> {
    return this.findAndCountAll({
      where: { courier: { [Op.iLike]: `%${courier}%` } },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'status'],
        },
        {
          model: Address,
          as: 'address',
          attributes: [
            'id',
            'type',
            'street1',
            'street2',
            'city',
            'province',
            'postalCode',
            'country',
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      ...pagination,
      ...options,
    });
  }

  /**
   * Check if shipment can be updated
   */
  async canUpdateShipment(
    shipmentId: number,
    options?: RepositoryOptions
  ): Promise<{ canUpdate: boolean; reason?: string }> {
    const shipment = await this.findByPk(shipmentId, {
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['status'],
        },
      ],
      ...options,
    });

    if (!shipment) {
      return { canUpdate: false, reason: 'Shipment not found' };
    }

    if (shipment.status === 'delivered') {
      return { canUpdate: false, reason: 'Cannot update delivered shipment' };
    }

    if (shipment.order?.status === 'closed') {
      return { canUpdate: false, reason: 'Cannot update shipment for closed order' };
    }

    return { canUpdate: true };
  }
}
