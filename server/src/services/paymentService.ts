import { Transaction } from 'sequelize';
import { PaymentRepository, PaymentMethodRepository } from '../repositories/paymentRepository';
import { OrderRepository } from '../repositories/orderRepository';
import { MockMidtransService, MidtransPaymentRequest } from './mockMidtransService';
import { logger } from '../config/logger';
import { AppError } from '../utils/errors';
import { PaymentStatus, PaymentMethodType } from '../types';

export interface CreatePaymentFromOrderData {
  orderId: number;
  paymentType?: string;
  paymentMethodId?: number;
}

export interface ProcessPaymentCallbackData {
  transactionId: string;
  orderId: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  amount: number;
  paymentType: string;
  signatureKey: string;
  rawResponse: Record<string, any>;
}

export interface CreatePaymentMethodData {
  userId: number;
  type: PaymentMethodType;
  provider?: string;
  maskedAccount?: string;
  expiresAt?: Date;
}

export class PaymentService {
  private paymentRepository: PaymentRepository;
  private paymentMethodRepository: PaymentMethodRepository;
  private orderRepository: OrderRepository;
  private midtransService: MockMidtransService;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.paymentMethodRepository = new PaymentMethodRepository();
    this.orderRepository = new OrderRepository();
    this.midtransService = new MockMidtransService();
  }

  /**
   * Create payment from order
   */
  async createPaymentFromOrder(paymentData: CreatePaymentFromOrderData, transaction?: Transaction) {
    try {
      logger.info('Creating payment from order', { orderId: paymentData.orderId });

      // Get order details
      const order = await this.orderRepository.findByPk(paymentData.orderId, {
        include: ['user', 'items.product'],
        transaction,
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.status !== 'new') {
        throw new AppError('Order is not eligible for payment', 400);
      }

      // Check if payment already exists
      const existingPayment = await this.paymentRepository.findByOrderId(paymentData.orderId, {
        transaction,
      });

      if (existingPayment && existingPayment.status === 'success') {
        throw new AppError('Order has already been paid', 400);
      }

      // Create payment in our system first
      const payment = await this.paymentRepository.createPayment(
        {
          orderId: paymentData.orderId,
          paymentMethodId: paymentData.paymentMethodId,
          amount: order.total,
          currency: 'IDR',
          status: 'pending',
        },
        { transaction }
      );

      // Prepare Midtrans payment request
      const midtransRequest: MidtransPaymentRequest = {
        orderId: order.orderNumber,
        amount: order.total,
        currency: 'IDR',
        paymentType: paymentData.paymentType || 'bank_transfer',
        customerDetails: {
          firstName: order.user?.firstName || 'Customer',
          lastName: order.user?.lastName || undefined,
          email: order.user?.email || 'customer@example.com',
          phone: order.user?.phone || undefined,
        },
        itemDetails:
          order.items?.map(item => ({
            id: item.productId.toString(),
            name: item.product?.name || 'Product',
            price: item.price,
            quantity: item.quantity,
          })) || [],
      };

      // Create payment in Midtrans
      const midtransResponse = await this.midtransService.createPayment(midtransRequest);

      // Update payment with Midtrans response
      const updatedPayment = await this.paymentRepository.updatePayment(
        payment.id,
        {
          gatewayResponse: midtransResponse.gatewayResponse,
        },
        { transaction }
      );

      logger.info('Payment created successfully', {
        paymentId: payment.id,
        transactionId: midtransResponse.transactionId,
        status: midtransResponse.status,
      });

      return {
        payment: updatedPayment,
        gatewayData: {
          transactionId: midtransResponse.transactionId,
          status: midtransResponse.status,
          paymentType: midtransResponse.paymentType,
          redirectUrl: midtransResponse.redirectUrl,
          qrCode: midtransResponse.qrCode,
          virtualAccount: midtransResponse.virtualAccount,
          expiryTime: midtransResponse.expiryTime,
        },
      };
    } catch (error) {
      logger.error('Error creating payment from order:', error);
      throw error instanceof AppError ? error : new AppError('Failed to create payment', 500);
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: number, userId?: number) {
    try {
      const payment = await this.paymentRepository.findByPk(paymentId, {
        include: ['order.user', 'paymentMethod'],
      });

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      // Check user access
      if (userId && payment.order?.userId !== userId) {
        throw new AppError('Access denied', 403);
      }

      return payment;
    } catch (error) {
      logger.error('Error getting payment by ID:', error);
      throw error instanceof AppError ? error : new AppError('Failed to get payment', 500);
    }
  }

  /**
   * Get payments by user
   */
  async getPaymentsByUser(userId: number, page = 1, limit = 20) {
    try {
      const pagination = { offset: (page - 1) * limit, limit };
      return await this.paymentRepository.findByUserId(userId, pagination);
    } catch (error) {
      logger.error('Error getting payments by user:', error);
      throw new AppError('Failed to get payments', 500);
    }
  }

  /**
   * Get payment status from gateway
   */
  async getPaymentStatusFromGateway(paymentId: number) {
    try {
      const payment = await this.paymentRepository.findByPk(paymentId);

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      const transactionId = payment.gatewayResponse?.transactionId;
      if (!transactionId) {
        throw new AppError('Payment transaction ID not found', 400);
      }

      // Get status from Midtrans
      const gatewayResponse = await this.midtransService.getPaymentStatus(transactionId);

      // Update payment status if changed
      if (gatewayResponse.status !== payment.status) {
        await this.paymentRepository.updatePaymentStatus(
          paymentId,
          gatewayResponse.status as PaymentStatus,
          gatewayResponse.gatewayResponse
        );
      }

      return gatewayResponse;
    } catch (error) {
      logger.error('Error getting payment status from gateway:', error);
      throw error instanceof AppError ? error : new AppError('Failed to get payment status', 500);
    }
  }

  /**
   * Process payment callback from Midtrans
   */
  async processPaymentCallback(callbackData: ProcessPaymentCallbackData) {
    try {
      logger.info('Processing payment callback', {
        transactionId: callbackData.transactionId,
        status: callbackData.status,
      });

      // Convert ProcessPaymentCallbackData to MidtransCallbackData
      const midtransCallbackData = {
        transactionId: callbackData.transactionId,
        orderId: callbackData.orderId,
        status: callbackData.status,
        amount: callbackData.amount,
        paymentType: callbackData.paymentType,
        signatureKey: callbackData.signatureKey,
        rawResponse: callbackData.rawResponse,
      };

      // Verify callback signature
      const isValidSignature = this.midtransService.verifyCallback(midtransCallbackData);
      if (!isValidSignature) {
        throw new AppError('Invalid callback signature', 401);
      }

      // Find payment by order ID
      const order = await this.orderRepository.findByOrderNumber(callbackData.orderId);
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      const payment = await this.paymentRepository.findByOrderId(order.id);
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      // Map Midtrans status to our status
      const paymentStatus = this.mapMidtransStatusToPaymentStatus(callbackData.status);

      // Update payment status
      const updatedPayment = await this.paymentRepository.updatePaymentStatus(
        payment.id,
        paymentStatus,
        callbackData.rawResponse
      );

      // Update order status if payment is successful
      if (paymentStatus === 'success') {
        await this.orderRepository.updateOrderStatus(order.id, 'paid');
        logger.info('Order status updated to paid', { orderId: order.id });
      }

      logger.info('Payment callback processed successfully', {
        paymentId: payment.id,
        newStatus: paymentStatus,
      });

      return updatedPayment;
    } catch (error) {
      logger.error('Error processing payment callback:', error);
      throw error instanceof AppError ? error : new AppError('Failed to process callback', 500);
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentId: number, userId?: number) {
    try {
      const payment = await this.paymentRepository.findByPk(paymentId, {
        include: ['order'],
      });

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      // Check user access
      if (userId && payment.order?.userId !== userId) {
        throw new AppError('Access denied', 403);
      }

      if (payment.status === 'success') {
        throw new AppError('Cannot cancel successful payment', 400);
      }

      if (payment.status === 'failed') {
        throw new AppError('Payment is already failed', 400);
      }

      const transactionId = payment.gatewayResponse?.transactionId;
      if (transactionId) {
        // Cancel in Midtrans
        await this.midtransService.cancelPayment(transactionId);
      }

      // Update payment status
      const updatedPayment = await this.paymentRepository.updatePaymentStatus(paymentId, 'failed');

      logger.info('Payment cancelled', { paymentId });

      return updatedPayment;
    } catch (error) {
      logger.error('Error cancelling payment:', error);
      throw error instanceof AppError ? error : new AppError('Failed to cancel payment', 500);
    }
  }

  /**
   * Create payment method
   */
  async createPaymentMethod(methodData: CreatePaymentMethodData) {
    try {
      return await this.paymentMethodRepository.createPaymentMethod(methodData);
    } catch (error) {
      logger.error('Error creating payment method:', error);
      throw new AppError('Failed to create payment method', 500);
    }
  }

  /**
   * Get payment methods by user
   */
  async getPaymentMethodsByUser(userId: number) {
    try {
      return await this.paymentMethodRepository.findByUserId(userId);
    } catch (error) {
      logger.error('Error getting payment methods:', error);
      throw new AppError('Failed to get payment methods', 500);
    }
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(methodId: number, userId: number) {
    try {
      // Check ownership
      const isOwned = await this.paymentMethodRepository.isOwnedByUser(methodId, userId);
      if (!isOwned) {
        throw new AppError('Payment method not found or access denied', 404);
      }

      const deleted = await this.paymentMethodRepository.deletePaymentMethod(methodId);
      if (!deleted) {
        throw new AppError('Failed to delete payment method', 500);
      }

      return { success: true };
    } catch (error) {
      logger.error('Error deleting payment method:', error);
      throw error instanceof AppError
        ? error
        : new AppError('Failed to delete payment method', 500);
    }
  }

  /**
   * Get available payment methods from gateway
   */
  getAvailablePaymentMethods() {
    return this.midtransService.getAvailablePaymentMethods();
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(filters: any = {}) {
    try {
      return await this.paymentRepository.getPaymentStats(filters);
    } catch (error) {
      logger.error('Error getting payment stats:', error);
      throw new AppError('Failed to get payment statistics', 500);
    }
  }

  // Private helper methods

  private mapMidtransStatusToPaymentStatus(midtransStatus: string): PaymentStatus {
    switch (midtransStatus.toLowerCase()) {
      case 'capture':
      case 'settlement':
      case 'success':
        return 'success';
      case 'pending':
        return 'pending';
      case 'deny':
      case 'cancel':
      case 'expire':
      case 'failed':
      default:
        return 'failed';
    }
  }
}
