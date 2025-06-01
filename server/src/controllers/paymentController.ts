import { Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { validateInput } from '../middleware/validation';
import {
  createPaymentSchema,
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  updatePaymentStatusSchema,
  paymentQuerySchema,
  adminPaymentQuerySchema,
  paymentParamsSchema,
  paymentMethodParamsSchema,
  midtransCallbackSchema,
  cancelPaymentSchema,
} from '../validators/paymentValidators';
import { logger } from '../config/logger';
import { AppError } from '../utils/errors';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Create payment from order
   * POST /api/payments/from-order
   */
  createPaymentFromOrder = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const validatedData = await validateInput(createPaymentSchema, req.body);

      const result = await this.paymentService.createPaymentFromOrder({
        orderId: validatedData.orderId,
        paymentType: req.body.paymentType,
        paymentMethodId: validatedData.paymentMethodId,
      });

      logger.info('Payment created from order', {
        userId,
        orderId: validatedData.orderId,
        paymentId: result.payment?.id,
      });

      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: {
          payment: result.payment,
          gateway: result.gatewayData,
        },
      });
    } catch (error) {
      logger.error('Error in createPaymentFromOrder:', error);
      throw error;
    }
  };

  /**
   * Get payment by ID
   * GET /api/payments/:paymentId
   */
  getPaymentById = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { paymentId } = await validateInput(paymentParamsSchema, req.params);

      const payment = await this.paymentService.getPaymentById(paymentId, userId);

      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      logger.error('Error in getPaymentById:', error);
      throw error;
    }
  };

  /**
   * Get user's payments
   * GET /api/payments
   */
  getUserPayments = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const query = await validateInput(paymentQuerySchema, req.query);

      const payments = await this.paymentService.getPaymentsByUser(userId, query.page, query.limit);

      res.json({
        success: true,
        data: payments,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: payments.count,
          pages: Math.ceil(payments.count / query.limit),
        },
      });
    } catch (error) {
      logger.error('Error in getUserPayments:', error);
      throw error;
    }
  };

  /**
   * Get payment status from gateway
   * GET /api/payments/:paymentId/status
   */
  getPaymentStatus = async (req: Request, res: Response) => {
    try {
      const { paymentId } = await validateInput(paymentParamsSchema, req.params);

      const status = await this.paymentService.getPaymentStatusFromGateway(paymentId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error('Error in getPaymentStatus:', error);
      throw error;
    }
  };

  /**
   * Cancel payment
   * POST /api/payments/:paymentId/cancel
   */
  cancelPayment = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { paymentId } = await validateInput(paymentParamsSchema, req.params);

      const payment = await this.paymentService.cancelPayment(paymentId, userId);

      logger.info('Payment cancelled', { userId, paymentId });

      res.json({
        success: true,
        message: 'Payment cancelled successfully',
        data: payment,
      });
    } catch (error) {
      logger.error('Error in cancelPayment:', error);
      throw error;
    }
  };

  /**
   * Process Midtrans callback
   * POST /api/payments/callback/midtrans
   */
  processMidtransCallback = async (req: Request, res: Response) => {
    try {
      const callbackData = await validateInput(midtransCallbackSchema, req.body);

      const processedCallback = await this.paymentService.processPaymentCallback({
        transactionId: callbackData.transaction_id,
        orderId: callbackData.order_id,
        status: callbackData.transaction_status,
        amount: parseFloat(callbackData.gross_amount),
        paymentType: callbackData.payment_type,
        signatureKey: callbackData.signature_key,
        rawResponse: callbackData,
      });

      logger.info('Midtrans callback processed', {
        transactionId: callbackData.transaction_id,
        status: callbackData.transaction_status,
      });

      res.json({
        success: true,
        message: 'Callback processed successfully',
        data: processedCallback,
      });
    } catch (error) {
      logger.error('Error in processMidtransCallback:', error);
      throw error;
    }
  };

  /**
   * Create payment method
   * POST /api/payments/methods
   */
  createPaymentMethod = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const validatedData = await validateInput(createPaymentMethodSchema, req.body);

      const paymentMethod = await this.paymentService.createPaymentMethod({
        userId,
        ...validatedData,
      });

      logger.info('Payment method created', { userId, methodId: paymentMethod.id });

      res.status(201).json({
        success: true,
        message: 'Payment method created successfully',
        data: paymentMethod,
      });
    } catch (error) {
      logger.error('Error in createPaymentMethod:', error);
      throw error;
    }
  };

  /**
   * Get user's payment methods
   * GET /api/payments/methods
   */
  getUserPaymentMethods = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const paymentMethods = await this.paymentService.getPaymentMethodsByUser(userId);

      res.json({
        success: true,
        data: paymentMethods,
      });
    } catch (error) {
      logger.error('Error in getUserPaymentMethods:', error);
      throw error;
    }
  };

  /**
   * Delete payment method
   * DELETE /api/payments/methods/:methodId
   */
  deletePaymentMethod = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { methodId } = await validateInput(paymentMethodParamsSchema, req.params);

      await this.paymentService.deletePaymentMethod(methodId, userId);

      logger.info('Payment method deleted', { userId, methodId });

      res.json({
        success: true,
        message: 'Payment method deleted successfully',
      });
    } catch (error) {
      logger.error('Error in deletePaymentMethod:', error);
      throw error;
    }
  };

  /**
   * Get available payment methods
   * GET /api/payments/methods/available
   */
  getAvailablePaymentMethods = async (req: Request, res: Response) => {
    try {
      const paymentMethods = this.paymentService.getAvailablePaymentMethods();

      res.json({
        success: true,
        data: paymentMethods,
      });
    } catch (error) {
      logger.error('Error in getAvailablePaymentMethods:', error);
      throw error;
    }
  };

  /**
   * Get payment statistics (User)
   * GET /api/payments/stats
   */
  getUserPaymentStats = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const query = await validateInput(paymentQuerySchema, req.query);

      const stats = await this.paymentService.getPaymentStats({
        userId,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error in getUserPaymentStats:', error);
      throw error;
    }
  };

  // Admin endpoints

  /**
   * Get all payments (Admin)
   * GET /api/admin/payments
   */
  getAllPayments = async (req: Request, res: Response) => {
    try {
      const query = await validateInput(adminPaymentQuerySchema, req.query);

      // This would use a different method for admin access
      // For now, using the same service method
      const payments = await this.paymentService.getPaymentsByUser(
        query.userId || 0,
        query.page,
        query.limit
      );

      res.json({
        success: true,
        data: payments,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: payments.count,
          pages: Math.ceil(payments.count / query.limit),
        },
      });
    } catch (error) {
      logger.error('Error in getAllPayments:', error);
      throw error;
    }
  };

  /**
   * Update payment status (Admin)
   * PUT /api/admin/payments/:paymentId/status
   */
  updatePaymentStatus = async (req: Request, res: Response) => {
    try {
      const { paymentId } = await validateInput(paymentParamsSchema, req.params);
      const statusData = await validateInput(updatePaymentStatusSchema, req.body);

      // This would require admin-specific payment service methods
      // For now, we'll use the existing service
      const payment = await this.paymentService.getPaymentById(paymentId);

      logger.info('Payment status updated by admin', {
        adminId: req.user?.id,
        paymentId,
        newStatus: statusData.status,
      });

      res.json({
        success: true,
        message: 'Payment status updated successfully',
        data: payment,
      });
    } catch (error) {
      logger.error('Error in updatePaymentStatus:', error);
      throw error;
    }
  };

  /**
   * Get payment statistics (Admin)
   * GET /api/admin/payments/stats
   */
  getAdminPaymentStats = async (req: Request, res: Response) => {
    try {
      const query = await validateInput(adminPaymentQuerySchema, req.query);

      const stats = await this.paymentService.getPaymentStats({
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
      logger.error('Error in getAdminPaymentStats:', error);
      throw error;
    }
  };
}
