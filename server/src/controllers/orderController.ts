import { Request, Response } from 'express';
import { OrderService } from '../services/orderService';
import { validateInput } from '../middleware/validation';
import {
  createOrderFromCartSchema,
  createOrderSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
  orderQuerySchema,
  adminOrderQuerySchema,
  orderParamsSchema,
  orderNumberParamsSchema,
  cancelOrderSchema,
  reorderSchema,
  CreateOrderFromCartInput,
  CreateOrderInput,
  UpdateOrderInput,
  UpdateOrderStatusInput,
  OrderQueryInput,
  AdminOrderQueryInput,
  CancelOrderInput,
  ReorderInput,
} from '../validators/orderValidators';
import { AuthenticatedRequest } from '../types/auth';
import { logger } from '../config/logger';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  /**
   * Create order from cart
   * POST /api/v1/orders/from-cart
   */
  async createOrderFromCart(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const validatedData = validateInput(
        createOrderFromCartSchema,
        req.body
      ) as CreateOrderFromCartInput;

      const order = await this.orderService.createOrderFromCart(userId, validatedData);

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully',
      });
    } catch (error: any) {
      logger.error('Failed to create order from cart:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to create order',
        ...(error.details && { details: error.details }),
      });
    }
  }

  /**
   * Create order manually (admin only)
   * POST /api/v1/orders/manual
   */
  async createOrderManually(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminUserId = req.user!.id;
      const validatedData = validateInput(createOrderSchema, req.body) as CreateOrderInput;

      const order = await this.orderService.createOrderManually(adminUserId, validatedData);

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created manually',
      });
    } catch (error: any) {
      logger.error('Failed to create order manually:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to create order',
        ...(error.details && { details: error.details }),
      });
    }
  }

  /**
   * Get user's orders
   * GET /api/v1/orders
   */
  async getUserOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { page, limit, status, dateFrom, dateTo, minTotal, maxTotal, orderNumber } =
        validateInput(orderQuerySchema, req.query) as OrderQueryInput;

      const pagination = { page, limit };
      const orders = await this.orderService.getUserOrders(userId, pagination);

      res.json({
        success: true,
        data: orders,
      });
    } catch (error: any) {
      logger.error('Failed to get user orders:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to get orders',
      });
    }
  }

  /**
   * Get order by ID
   * GET /api/v1/orders/:orderId
   */
  async getOrderById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { orderId } = validateInput(orderParamsSchema, req.params) as { orderId: number };

      const order = await this.orderService.getOrderById(orderId, userId, userRole);

      res.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      logger.error('Failed to get order by ID:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to get order',
      });
    }
  }

  /**
   * Get order by order number
   * GET /api/v1/orders/number/:orderNumber
   */
  async getOrderByNumber(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { orderNumber } = validateInput(orderNumberParamsSchema, req.params) as {
        orderNumber: string;
      };

      const order = await this.orderService.getOrderByNumber(orderNumber, userId, userRole);

      res.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      logger.error('Failed to get order by number:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to get order',
      });
    }
  }

  /**
   * Update order status
   * PATCH /api/v1/orders/:orderId/status
   */
  async updateOrderStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { orderId } = validateInput(orderParamsSchema, req.params) as { orderId: number };
      const { status, reason } = validateInput(
        updateOrderStatusSchema,
        req.body
      ) as UpdateOrderStatusInput;

      const order = await this.orderService.updateOrderStatus(
        orderId,
        status,
        userId,
        userRole,
        reason
      );

      res.json({
        success: true,
        data: order,
        message: `Order status updated to ${status}`,
      });
    } catch (error: any) {
      logger.error('Failed to update order status:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update order status',
        ...(error.details && { details: error.details }),
      });
    }
  }

  /**
   * Cancel order
   * POST /api/v1/orders/:orderId/cancel
   */
  async cancelOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { orderId } = validateInput(orderParamsSchema, req.params) as { orderId: number };
      const { reason } = validateInput(cancelOrderSchema, req.body) as CancelOrderInput;

      const order = await this.orderService.cancelOrder(orderId, userId, userRole, reason);

      res.json({
        success: true,
        data: order,
        message: 'Order cancelled successfully',
      });
    } catch (error: any) {
      logger.error('Failed to cancel order:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to cancel order',
        ...(error.details && { details: error.details }),
      });
    }
  }

  /**
   * Get user order statistics
   * GET /api/v1/orders/stats
   */
  async getUserOrderStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const stats = await this.orderService.getUserOrderStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Failed to get user order stats:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to get order statistics',
      });
    }
  }

  /**
   * Reorder from previous order
   * POST /api/v1/orders/:orderId/reorder
   */
  async reorder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { orderId } = validateInput(orderParamsSchema, req.params) as { orderId: number };
      const { excludeProductIds = [] } = req.body;

      const result = await this.orderService.reorder(userId, orderId, excludeProductIds);

      res.json({
        success: true,
        data: result,
        message: 'Reorder completed',
      });
    } catch (error: any) {
      logger.error('Failed to reorder:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to reorder',
        ...(error.details && { details: error.details }),
      });
    }
  }

  // Admin-only endpoints

  /**
   * Get all orders (admin only)
   * GET /api/v1/admin/orders
   */
  async getAdminOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        page,
        limit,
        status,
        dateFrom,
        dateTo,
        minTotal,
        maxTotal,
        orderNumber,
        userId,
        userEmail,
      } = validateInput(adminOrderQuerySchema, req.query) as AdminOrderQueryInput;

      const filters = {
        status: Array.isArray(status) ? (status as any[]) : status,
        dateFrom,
        dateTo,
        minTotal,
        maxTotal,
        orderNumber,
        userId,
      };

      const pagination = { page, limit };
      const orders = await this.orderService.getAdminOrders(filters, pagination);

      res.json({
        success: true,
        data: orders,
      });
    } catch (error: any) {
      logger.error('Failed to get admin orders:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to get orders',
      });
    }
  }

  /**
   * Update order (admin only)
   * PUT /api/v1/admin/orders/:orderId
   */
  async updateOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderId } = validateInput(orderParamsSchema, req.params) as { orderId: number };
      const updateData = validateInput(updateOrderSchema, req.body) as UpdateOrderInput;

      // For now, only status updates are supported
      if (updateData.status) {
        const userId = req.user!.id;
        const userRole = req.user!.role;

        const order = await this.orderService.updateOrderStatus(
          orderId,
          updateData.status,
          userId,
          userRole
        );

        res.json({
          success: true,
          data: order,
          message: 'Order updated successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'No valid update fields provided',
        });
      }
    } catch (error: any) {
      logger.error('Failed to update order:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update order',
        ...(error.details && { details: error.details }),
      });
    }
  }

  /**
   * Bulk update order status (admin only)
   * PATCH /api/v1/admin/orders/bulk-status
   */
  async bulkUpdateOrderStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderIds, status, reason } = req.body;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const results = [];
      const errors = [];

      for (const orderId of orderIds) {
        try {
          const order = await this.orderService.updateOrderStatus(
            orderId,
            status,
            userId,
            userRole,
            reason
          );
          results.push({
            orderId,
            success: true,
            order,
          });
        } catch (error: any) {
          errors.push({
            orderId,
            success: false,
            error: error.message,
          });
        }
      }

      res.json({
        success: errors.length === 0,
        data: {
          results,
          summary: {
            total: orderIds.length,
            successful: results.length,
            failed: errors.length,
          },
        },
        ...(errors.length > 0 && { errors }),
        message: `Bulk update completed: ${results.length} successful, ${errors.length} failed`,
      });
    } catch (error: any) {
      logger.error('Failed to bulk update order status:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to bulk update orders',
      });
    }
  }
}
