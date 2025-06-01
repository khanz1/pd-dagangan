import { Request, Response } from 'express';
import { ShippingService } from '../services/shippingService';
import { validateInput } from '../middleware/validation';
import {
  createAddressSchema,
  updateAddressSchema,
  createShipmentSchema,
  updateShipmentSchema,
  shippingCostRequestSchema,
  trackingRequestSchema,
  addressQuerySchema,
  shipmentQuerySchema,
  adminShipmentQuerySchema,
  addressParamsSchema,
  shipmentParamsSchema,
  trackingParamsSchema,
  updateShipmentStatusSchema,
  bulkShipmentUpdateSchema,
  validateAddressSchema,
  provinceQuerySchema,
  cityQuerySchema,
} from '../validators/shippingValidators';
import { logger } from '../config/logger';
import { AppError } from '../utils/errors';

export class ShippingController {
  private shippingService: ShippingService;

  constructor() {
    this.shippingService = new ShippingService();
  }

  // Shipping Cost Endpoints

  /**
   * Calculate shipping cost
   * POST /api/shipping/cost
   */
  calculateShippingCost = async (req: Request, res: Response) => {
    try {
      const validatedData = await validateInput(shippingCostRequestSchema, req.body);

      const result = await this.shippingService.calculateShippingCost(validatedData);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error in calculateShippingCost:', error);
      throw error;
    }
  };

  /**
   * Calculate shipping cost for order
   * POST /api/shipping/cost/order/:orderId
   */
  calculateShippingCostForOrder = async (req: Request, res: Response) => {
    try {
      const orderIdParam = req.params.orderId;
      if (!orderIdParam) {
        throw new AppError('Order ID is required', 400);
      }

      const orderId = parseInt(orderIdParam);
      if (isNaN(orderId)) {
        throw new AppError('Invalid Order ID', 400);
      }

      const { addressId, courier } = req.body;

      if (!addressId) {
        throw new AppError('Address ID is required', 400);
      }

      const result = await this.shippingService.calculateShippingCostForOrder(
        orderId,
        addressId,
        courier
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error in calculateShippingCostForOrder:', error);
      throw error;
    }
  };

  // Package Tracking Endpoints

  /**
   * Track package
   * GET /api/shipping/track/:trackingNumber
   */
  trackPackage = async (req: Request, res: Response) => {
    try {
      const { trackingNumber } = await validateInput(trackingParamsSchema, req.params);
      const { courier } = req.query;

      if (!courier || typeof courier !== 'string') {
        throw new AppError('Courier parameter is required', 400);
      }

      const result = await this.shippingService.trackPackage(trackingNumber, courier);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error in trackPackage:', error);
      throw error;
    }
  };

  // Shipment Management Endpoints

  /**
   * Create shipment
   * POST /api/shipping/shipments
   */
  createShipment = async (req: Request, res: Response) => {
    try {
      const validatedData = await validateInput(createShipmentSchema, req.body);

      const shipment = await this.shippingService.createShipment(validatedData);

      logger.info('Shipment created', {
        adminId: req.user?.id,
        shipmentId: shipment.id,
        orderId: validatedData.orderId,
      });

      res.status(201).json({
        success: true,
        message: 'Shipment created successfully',
        data: shipment,
      });
    } catch (error) {
      logger.error('Error in createShipment:', error);
      throw error;
    }
  };

  /**
   * Get shipment by ID
   * GET /api/shipping/shipments/:shipmentId
   */
  getShipmentById = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { shipmentId } = await validateInput(shipmentParamsSchema, req.params);

      const shipment = await this.shippingService.getShipmentById(shipmentId, userId);

      res.json({
        success: true,
        data: shipment,
      });
    } catch (error) {
      logger.error('Error in getShipmentById:', error);
      throw error;
    }
  };

  /**
   * Get user's shipments
   * GET /api/shipping/shipments
   */
  getUserShipments = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const query = await validateInput(shipmentQuerySchema, req.query);

      const shipments = await this.shippingService.getShipmentsByUser(
        userId,
        query.page,
        query.limit
      );

      res.json({
        success: true,
        data: shipments,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: shipments.count,
          pages: Math.ceil(shipments.count / query.limit),
        },
      });
    } catch (error) {
      logger.error('Error in getUserShipments:', error);
      throw error;
    }
  };

  /**
   * Update shipment status
   * PUT /api/shipping/shipments/:shipmentId/status
   */
  updateShipmentStatus = async (req: Request, res: Response) => {
    try {
      const { shipmentId } = await validateInput(shipmentParamsSchema, req.params);
      const statusData = await validateInput(updateShipmentStatusSchema, req.body);

      const shipment = await this.shippingService.updateShipmentStatus(
        shipmentId,
        statusData,
        req.user?.id
      );

      logger.info('Shipment status updated', {
        userId: req.user?.id,
        shipmentId,
        newStatus: statusData.status,
      });

      res.json({
        success: true,
        message: 'Shipment status updated successfully',
        data: shipment,
      });
    } catch (error) {
      logger.error('Error in updateShipmentStatus:', error);
      throw error;
    }
  };

  // Address Management Endpoints

  /**
   * Create address
   * POST /api/shipping/addresses
   */
  createAddress = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const validatedData = await validateInput(createAddressSchema, req.body);

      const address = await this.shippingService.createAddress({
        userId,
        ...validatedData,
      });

      logger.info('Address created', { userId, addressId: address.id });

      res.status(201).json({
        success: true,
        message: 'Address created successfully',
        data: address,
      });
    } catch (error) {
      logger.error('Error in createAddress:', error);
      throw error;
    }
  };

  /**
   * Get user's addresses
   * GET /api/shipping/addresses
   */
  getUserAddresses = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const addresses = await this.shippingService.getAddressesByUser(userId);

      res.json({
        success: true,
        data: addresses,
      });
    } catch (error) {
      logger.error('Error in getUserAddresses:', error);
      throw error;
    }
  };

  /**
   * Update address
   * PUT /api/shipping/addresses/:addressId
   */
  updateAddress = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { addressId } = await validateInput(addressParamsSchema, req.params);
      const updateData = await validateInput(updateAddressSchema, req.body);

      const address = await this.shippingService.updateAddress(addressId, updateData, userId);

      logger.info('Address updated', { userId, addressId });

      res.json({
        success: true,
        message: 'Address updated successfully',
        data: address,
      });
    } catch (error) {
      logger.error('Error in updateAddress:', error);
      throw error;
    }
  };

  /**
   * Delete address
   * DELETE /api/shipping/addresses/:addressId
   */
  deleteAddress = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { addressId } = await validateInput(addressParamsSchema, req.params);

      await this.shippingService.deleteAddress(addressId, userId);

      logger.info('Address deleted', { userId, addressId });

      res.json({
        success: true,
        message: 'Address deleted successfully',
      });
    } catch (error) {
      logger.error('Error in deleteAddress:', error);
      throw error;
    }
  };

  // Location Data Endpoints

  /**
   * Get provinces
   * GET /api/shipping/provinces
   */
  getProvinces = async (req: Request, res: Response) => {
    try {
      const provinces = await this.shippingService.getProvinces();

      res.json({
        success: true,
        data: provinces,
      });
    } catch (error) {
      logger.error('Error in getProvinces:', error);
      throw error;
    }
  };

  /**
   * Get cities
   * GET /api/shipping/cities
   */
  getCities = async (req: Request, res: Response) => {
    try {
      const query = await validateInput(cityQuerySchema, req.query);

      const cities = await this.shippingService.getCities(query.provinceId);

      res.json({
        success: true,
        data: cities,
      });
    } catch (error) {
      logger.error('Error in getCities:', error);
      throw error;
    }
  };

  /**
   * Get supported couriers
   * GET /api/shipping/couriers
   */
  getSupportedCouriers = async (req: Request, res: Response) => {
    try {
      const couriers = this.shippingService.getSupportedCouriers();

      res.json({
        success: true,
        data: couriers,
      });
    } catch (error) {
      logger.error('Error in getSupportedCouriers:', error);
      throw error;
    }
  };

  /**
   * Validate address
   * POST /api/shipping/validate-address
   */
  validateAddress = async (req: Request, res: Response) => {
    try {
      const validatedData = await validateInput(validateAddressSchema, req.body);

      const result = await this.shippingService.validateAddress(validatedData);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error in validateAddress:', error);
      throw error;
    }
  };

  /**
   * Get shipping statistics (User)
   * GET /api/shipping/stats
   */
  getUserShippingStats = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const query = await validateInput(shipmentQuerySchema, req.query);

      const stats = await this.shippingService.getShipmentStats({
        userId,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error in getUserShippingStats:', error);
      throw error;
    }
  };

  // Admin Endpoints

  /**
   * Get all shipments (Admin)
   * GET /api/admin/shipments
   */
  getAllShipments = async (req: Request, res: Response) => {
    try {
      const query = await validateInput(adminShipmentQuerySchema, req.query);

      // This would use a different method for admin access
      // For now, using the same service method
      const shipments = await this.shippingService.getShipmentsByUser(
        query.userId || 0,
        query.page,
        query.limit
      );

      res.json({
        success: true,
        data: shipments,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: shipments.count,
          pages: Math.ceil(shipments.count / query.limit),
        },
      });
    } catch (error) {
      logger.error('Error in getAllShipments:', error);
      throw error;
    }
  };

  /**
   * Bulk update shipment status (Admin)
   * PUT /api/admin/shipments/bulk-status
   */
  bulkUpdateShipmentStatus = async (req: Request, res: Response) => {
    try {
      const validatedData = await validateInput(bulkShipmentUpdateSchema, req.body);

      // This would require admin-specific service methods
      // For now, we'll update them one by one
      const results = await Promise.all(
        validatedData.shipmentIds.map((shipmentId: number) =>
          this.shippingService.updateShipmentStatus(shipmentId, {
            status: validatedData.status,
            note: validatedData.note,
          })
        )
      );

      logger.info('Bulk shipment status update', {
        adminId: req.user?.id,
        shipmentCount: validatedData.shipmentIds.length,
        newStatus: validatedData.status,
      });

      res.json({
        success: true,
        message: `${results.length} shipments updated successfully`,
        data: results,
      });
    } catch (error) {
      logger.error('Error in bulkUpdateShipmentStatus:', error);
      throw error;
    }
  };

  /**
   * Get shipping statistics (Admin)
   * GET /api/admin/shipments/stats
   */
  getAdminShippingStats = async (req: Request, res: Response) => {
    try {
      const query = await validateInput(adminShipmentQuerySchema, req.query);

      const stats = await this.shippingService.getShipmentStats({
        userId: query.userId,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        status: query.status,
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error in getAdminShippingStats:', error);
      throw error;
    }
  };
}
