import { Transaction } from 'sequelize';
import { ShipmentRepository } from '../repositories/shippingRepository';
import { AddressRepository } from '../repositories/addressRepository';
import { OrderRepository } from '../repositories/orderRepository';
import {
  MockRajaOngkirService,
  ShippingCostRequest,
  TrackingRequest,
} from './mockRajaOngkirService';
import { logger } from '../config/logger';
import { AppError } from '../utils/errors';
import { ShipmentStatus, AddressType } from '../types';

export interface CreateShipmentData {
  orderId: number;
  addressId: number;
  courier?: string;
  service?: string;
  cost?: number;
}

export interface CreateAddressData {
  userId: number;
  type: AddressType;
  street1: string;
  street2?: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
}

export interface UpdateShipmentStatusData {
  status: ShipmentStatus;
  note?: string;
  location?: string;
}

export class ShippingService {
  private shipmentRepository: ShipmentRepository;
  private addressRepository: AddressRepository;
  private orderRepository: OrderRepository;
  private rajaOngkirService: MockRajaOngkirService;

  constructor() {
    this.shipmentRepository = new ShipmentRepository();
    this.addressRepository = new AddressRepository();
    this.orderRepository = new OrderRepository();
    this.rajaOngkirService = new MockRajaOngkirService();
  }

  /**
   * Calculate shipping costs
   */
  async calculateShippingCost(request: ShippingCostRequest) {
    try {
      logger.info('Calculating shipping cost', {
        origin: request.origin.city,
        destination: request.destination.city,
        weight: request.weight,
      });

      const response = await this.rajaOngkirService.getShippingCost(request);

      logger.info('Shipping cost calculated', {
        optionsCount: response.results.length,
        cheapestCost:
          response.results.length > 0 ? Math.min(...response.results.map(r => r.cost)) : 0,
      });

      return response;
    } catch (error) {
      logger.error('Error calculating shipping cost:', error);
      throw new AppError('Failed to calculate shipping cost', 500);
    }
  }

  /**
   * Calculate shipping cost for order
   */
  async calculateShippingCostForOrder(orderId: number, addressId: number, courier?: string) {
    try {
      // Get order details
      const order = await this.orderRepository.findByPk(orderId, {
        include: ['items.product'],
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // Get destination address
      const address = await this.addressRepository.findByPk(addressId);
      if (!address) {
        throw new AppError('Address not found', 404);
      }

      // Calculate total weight (assuming 500g per item if not specified)
      const totalWeight =
        order.items?.reduce((total, item) => {
          const itemWeight = item.product?.weight || 500; // Default 500g
          return total + itemWeight * item.quantity;
        }, 0) || 1000; // Default 1kg

      // Use default origin (can be configured)
      const origin = {
        city: 'Jakarta Pusat',
        province: 'DKI Jakarta',
        postalCode: '10540',
      };

      const destination = {
        city: address.city,
        province: address.province || '',
        postalCode: address.postalCode || '',
      };

      return await this.calculateShippingCost({
        origin,
        destination,
        weight: totalWeight,
        courier,
      });
    } catch (error) {
      logger.error('Error calculating shipping cost for order:', error);
      throw error instanceof AppError
        ? error
        : new AppError('Failed to calculate shipping cost', 500);
    }
  }

  /**
   * Create shipment
   */
  async createShipment(shipmentData: CreateShipmentData, transaction?: Transaction) {
    try {
      logger.info('Creating shipment', { orderId: shipmentData.orderId });

      // Validate order
      const order = await this.orderRepository.findByPk(shipmentData.orderId, { transaction });
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.status !== 'paid') {
        throw new AppError('Order must be paid before creating shipment', 400);
      }

      // Validate address
      const address = await this.addressRepository.findByPk(shipmentData.addressId, {
        transaction,
      });
      if (!address) {
        throw new AppError('Address not found', 404);
      }

      // Check if shipment already exists
      const existingShipment = await this.shipmentRepository.findByOrderId(shipmentData.orderId, {
        transaction,
      });

      if (existingShipment) {
        throw new AppError('Shipment already exists for this order', 400);
      }

      // Generate tracking number
      const trackingNumber = this.shipmentRepository.generateTrackingNumber(
        shipmentData.courier || 'JNE'
      );

      // Create shipment
      const shipment = await this.shipmentRepository.createShipment(
        {
          orderId: shipmentData.orderId,
          addressId: shipmentData.addressId,
          courier: shipmentData.courier || 'JNE',
          trackingNumber,
          status: 'pending',
        },
        { transaction }
      );

      // Update order status
      await this.orderRepository.updateOrderStatus(shipmentData.orderId, 'shipped', {
        transaction,
      });

      logger.info('Shipment created successfully', {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
      });

      return shipment;
    } catch (error) {
      logger.error('Error creating shipment:', error);
      throw error instanceof AppError ? error : new AppError('Failed to create shipment', 500);
    }
  }

  /**
   * Track package
   */
  async trackPackage(trackingNumber: string, courier: string) {
    try {
      logger.info('Tracking package', { trackingNumber, courier });

      const trackingRequest: TrackingRequest = {
        trackingNumber,
        courier,
      };

      const response = await this.rajaOngkirService.trackPackage(trackingRequest);

      // Update shipment status in database if found
      const shipment = await this.shipmentRepository.findByTrackingNumber(trackingNumber);
      if (shipment && shipment.status !== response.status) {
        await this.shipmentRepository.updateShipmentStatus(shipment.id, response.status);
      }

      logger.info('Package tracking retrieved', {
        trackingNumber,
        status: response.status,
      });

      return response;
    } catch (error) {
      logger.error('Error tracking package:', error);
      throw new AppError('Failed to track package', 500);
    }
  }

  /**
   * Get shipment by ID
   */
  async getShipmentById(shipmentId: number, userId?: number) {
    try {
      const shipment = await this.shipmentRepository.findByPk(shipmentId, {
        include: ['order.user', 'address'],
      });

      if (!shipment) {
        throw new AppError('Shipment not found', 404);
      }

      // Check user access
      if (userId && shipment.order?.userId !== userId) {
        throw new AppError('Access denied', 403);
      }

      return shipment;
    } catch (error) {
      logger.error('Error getting shipment by ID:', error);
      throw error instanceof AppError ? error : new AppError('Failed to get shipment', 500);
    }
  }

  /**
   * Get shipments by user
   */
  async getShipmentsByUser(userId: number, page = 1, limit = 20) {
    try {
      const pagination = { offset: (page - 1) * limit, limit };
      return await this.shipmentRepository.findByUserId(userId, pagination);
    } catch (error) {
      logger.error('Error getting shipments by user:', error);
      throw new AppError('Failed to get shipments', 500);
    }
  }

  /**
   * Update shipment status
   */
  async updateShipmentStatus(
    shipmentId: number,
    statusData: UpdateShipmentStatusData,
    userId?: number
  ) {
    try {
      const shipment = await this.shipmentRepository.findByPk(shipmentId, {
        include: ['order'],
      });

      if (!shipment) {
        throw new AppError('Shipment not found', 404);
      }

      // Check if update is allowed
      const canUpdate = await this.shipmentRepository.canUpdateShipment(shipmentId);
      if (!canUpdate.canUpdate) {
        throw new AppError(canUpdate.reason || 'Cannot update shipment', 400);
      }

      // Update shipment status
      const updatedShipment = await this.shipmentRepository.updateShipmentStatus(
        shipmentId,
        statusData.status
      );

      // Update order status if delivered
      if (statusData.status === 'delivered') {
        await this.orderRepository.updateOrderStatus(shipment.orderId, 'delivered');
      }

      logger.info('Shipment status updated', {
        shipmentId,
        newStatus: statusData.status,
      });

      return updatedShipment;
    } catch (error) {
      logger.error('Error updating shipment status:', error);
      throw error instanceof AppError
        ? error
        : new AppError('Failed to update shipment status', 500);
    }
  }

  /**
   * Create address
   */
  async createAddress(addressData: CreateAddressData) {
    try {
      // Validate address with Raja Ongkir
      const validation = await this.rajaOngkirService.validateAddress({
        city: addressData.city,
        province: addressData.province,
        postalCode: addressData.postalCode,
      });

      if (!validation.valid) {
        throw new AppError(`Address validation failed: ${validation.errors.join(', ')}`, 400);
      }

      const address = await this.addressRepository.createAddress({
        userId: addressData.userId,
        type: addressData.type,
        street1: addressData.street1,
        street2: addressData.street2,
        city: addressData.city,
        province: addressData.province,
        postalCode: addressData.postalCode,
        country: addressData.country || 'Indonesia',
      });

      logger.info('Address created successfully', { addressId: address.id });

      return address;
    } catch (error) {
      logger.error('Error creating address:', error);
      throw error instanceof AppError ? error : new AppError('Failed to create address', 500);
    }
  }

  /**
   * Get addresses by user
   */
  async getAddressesByUser(userId: number) {
    try {
      return await this.addressRepository.findByUserId(userId);
    } catch (error) {
      logger.error('Error getting addresses by user:', error);
      throw new AppError('Failed to get addresses', 500);
    }
  }

  /**
   * Update address
   */
  async updateAddress(addressId: number, updateData: Partial<CreateAddressData>, userId: number) {
    try {
      // Check ownership
      const isOwned = await this.addressRepository.isOwnedByUser(addressId, userId);
      if (!isOwned) {
        throw new AppError('Address not found or access denied', 404);
      }

      // Validate address if city/province/postal code is being updated
      if (updateData.city || updateData.province || updateData.postalCode) {
        const currentAddress = await this.addressRepository.findByPk(addressId);
        if (!currentAddress) {
          throw new AppError('Address not found', 404);
        }

        const validation = await this.rajaOngkirService.validateAddress({
          city: updateData.city || currentAddress.city,
          province: updateData.province || currentAddress.province || '',
          postalCode: updateData.postalCode || currentAddress.postalCode || '',
        });

        if (!validation.valid) {
          throw new AppError(`Address validation failed: ${validation.errors.join(', ')}`, 400);
        }
      }

      const updatedAddress = await this.addressRepository.updateAddress(addressId, updateData);
      if (!updatedAddress) {
        throw new AppError('Failed to update address', 500);
      }

      return updatedAddress;
    } catch (error) {
      logger.error('Error updating address:', error);
      throw error instanceof AppError ? error : new AppError('Failed to update address', 500);
    }
  }

  /**
   * Delete address
   */
  async deleteAddress(addressId: number, userId: number) {
    try {
      // Check ownership
      const isOwned = await this.addressRepository.isOwnedByUser(addressId, userId);
      if (!isOwned) {
        throw new AppError('Address not found or access denied', 404);
      }

      const deleted = await this.addressRepository.deleteAddress(addressId);
      if (!deleted) {
        throw new AppError('Failed to delete address', 500);
      }

      return { success: true };
    } catch (error) {
      logger.error('Error deleting address:', error);
      throw error instanceof AppError ? error : new AppError('Failed to delete address', 500);
    }
  }

  /**
   * Get provinces
   */
  async getProvinces() {
    try {
      return await this.rajaOngkirService.getProvinces();
    } catch (error) {
      logger.error('Error getting provinces:', error);
      throw new AppError('Failed to get provinces', 500);
    }
  }

  /**
   * Get cities
   */
  async getCities(provinceId?: string) {
    try {
      return await this.rajaOngkirService.getCities(provinceId);
    } catch (error) {
      logger.error('Error getting cities:', error);
      throw new AppError('Failed to get cities', 500);
    }
  }

  /**
   * Get supported couriers
   */
  getSupportedCouriers() {
    return this.rajaOngkirService.getSupportedCouriers();
  }

  /**
   * Validate address
   */
  async validateAddress(address: { city: string; province: string; postalCode?: string }) {
    try {
      return await this.rajaOngkirService.validateAddress(address);
    } catch (error) {
      logger.error('Error validating address:', error);
      throw new AppError('Failed to validate address', 500);
    }
  }

  /**
   * Get shipment statistics
   */
  async getShipmentStats(filters: any = {}) {
    try {
      return await this.shipmentRepository.getShipmentStats(filters);
    } catch (error) {
      logger.error('Error getting shipment stats:', error);
      throw new AppError('Failed to get shipment statistics', 500);
    }
  }
}
