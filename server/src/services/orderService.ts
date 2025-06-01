import {
  OrderRepository,
  OrderItemRepository,
  CreateOrderData,
  CreateOrderItemData,
  OrderFilters,
} from '../repositories/orderRepository';
import { CartRepository, CartItemRepository } from '../repositories/cartRepository';
import { ProductRepository } from '../repositories/productRepository';
import { UserRepository } from '../repositories/userRepository';
import { Order, OrderItem, Product, User, Coupon, CartItem } from '../models';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError,
  ErrorMessages,
  AppError,
} from '../types/errors';
import { OrderStatus, UserRole } from '../types';
import { sequelize } from '../config/database';
import { logger } from '../config/logger';
import {
  validateOrderStatus,
  validateOrderItems,
  validateOrderTotal,
  OrderItemInput,
} from '../validators/orderValidators';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface CreateOrderFromCartData {
  couponCode?: string;
  shippingAddressId?: number;
  paymentMethodId?: number;
  notes?: string;
}

export interface CreateOrderManualData {
  userId: number;
  items: OrderItemInput[];
  couponCode?: string;
  shippingFee?: number;
  tax?: number;
  notes?: string;
}

export interface OrderCalculation {
  subtotal: number;
  tax: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  items: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    taxAmount: number;
    itemTotal: number;
  }>;
}

export class OrderService {
  private orderRepository: OrderRepository;
  private orderItemRepository: OrderItemRepository;
  private cartRepository: CartRepository;
  private cartItemRepository: CartItemRepository;
  private productRepository: ProductRepository;
  private userRepository: UserRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.orderItemRepository = new OrderItemRepository();
    this.cartRepository = new CartRepository();
    this.cartItemRepository = new CartItemRepository();
    this.productRepository = new ProductRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * Create order from user's cart
   */
  async createOrderFromCart(userId: number, orderData: CreateOrderFromCartData): Promise<any> {
    const transaction = await sequelize.transaction();

    try {
      logger.debug(`Creating order from cart for user ${userId}`, orderData);

      // Get user's cart with items
      const cart = await this.cartRepository.findByUserId(userId, { transaction });
      if (!cart || !cart.items || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
      }

      // Validate all products are available and have sufficient stock
      const validationResult = await this.validateCartForOrder(cart.items, { transaction });
      if (!validationResult.valid) {
        throw new AppError('Cart validation failed', 400, validationResult.errors);
      }

      // Calculate order totals
      const calculation = await this.calculateOrderFromCart(cart.items, orderData.couponCode, {
        transaction,
      });

      // Generate unique order number
      const orderNumber = await this.orderRepository.generateOrderNumber();

      // Create the order
      const newOrderData: CreateOrderData = {
        userId,
        orderNumber,
        subtotal: calculation.subtotal,
        tax: calculation.tax,
        shippingFee: calculation.shippingFee,
        total: calculation.total,
        status: 'new',
      };

      // Apply coupon if provided
      if (orderData.couponCode) {
        const coupon = await this.validateAndApplyCoupon(
          orderData.couponCode,
          userId,
          calculation.subtotal,
          { transaction }
        );
        newOrderData.couponId = coupon.id;
      }

      // Create order items data
      const orderItemsData: CreateOrderItemData[] = calculation.items.map(item => ({
        orderId: 0, // Will be set by repository
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount,
        taxAmount: item.taxAmount,
      }));

      // Create the order with items
      const order = await this.orderRepository.createOrder(newOrderData, orderItemsData, {
        transaction,
      });

      // Update product inventory
      await this.updateInventoryForOrder(calculation.items, 'decrease', { transaction });

      // Clear the cart
      await this.cartRepository.clearCart(cart.id, { transaction });

      await transaction.commit();

      logger.info(`Order ${order.orderNumber} created successfully for user ${userId}`);

      return this.formatOrderResponse(order);
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create order from cart:', error);
      throw error;
    }
  }

  /**
   * Create order manually (for admin)
   */
  async createOrderManually(adminUserId: number, orderData: CreateOrderManualData): Promise<any> {
    const transaction = await sequelize.transaction();

    try {
      logger.debug(
        `Admin ${adminUserId} creating order manually for user ${orderData.userId}`,
        orderData
      );

      // Validate admin permissions
      const admin = await this.userRepository.findByPk(adminUserId);
      if (!admin || admin.role !== 'admin') {
        throw new ForbiddenError('Admin access required');
      }

      // Validate target user exists
      const targetUser = await this.userRepository.findByPk(orderData.userId);
      if (!targetUser) {
        throw new NotFoundError('Target user not found');
      }

      // Validate order items
      if (!validateOrderItems(orderData.items)) {
        throw new ValidationError([{ field: 'items', message: 'Invalid order items' }]);
      }

      // Validate products and stock
      const stockValidation = await this.validateProductsAndStock(orderData.items, { transaction });
      if (!stockValidation.valid) {
        throw new AppError('Product validation failed', 400, stockValidation.errors);
      }

      // Calculate totals
      const calculation = await this.calculateOrderManual(orderData, { transaction });

      // Generate order number
      const orderNumber = await this.orderRepository.generateOrderNumber();

      // Create order data
      const newOrderData: CreateOrderData = {
        userId: orderData.userId,
        orderNumber,
        subtotal: calculation.subtotal,
        tax: calculation.tax,
        shippingFee: calculation.shippingFee,
        total: calculation.total,
        status: 'new',
      };

      // Apply coupon if provided
      if (orderData.couponCode) {
        const coupon = await this.validateAndApplyCoupon(
          orderData.couponCode,
          orderData.userId,
          calculation.subtotal,
          { transaction }
        );
        newOrderData.couponId = coupon.id;
      }

      // Create order items data
      const orderItemsData: CreateOrderItemData[] = orderData.items.map(item => ({
        orderId: 0,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount,
        taxAmount: item.taxAmount,
      }));

      // Create the order
      const order = await this.orderRepository.createOrder(newOrderData, orderItemsData, {
        transaction,
      });

      // Update inventory
      await this.updateInventoryForOrder(orderData.items, 'decrease', { transaction });

      await transaction.commit();

      logger.info(
        `Order ${order.orderNumber} created manually by admin ${adminUserId} for user ${orderData.userId}`
      );

      return this.formatOrderResponse(order);
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create order manually:', error);
      throw error;
    }
  }

  /**
   * Get user's orders with pagination
   */
  async getUserOrders(userId: number, pagination: PaginationParams = {}): Promise<any> {
    try {
      logger.debug(`Getting orders for user ${userId}`, pagination);

      const result = await this.orderRepository.findByUserId(userId, pagination);

      return {
        orders: result.rows.map(order => this.formatOrderResponse(order)),
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalItems: result.count,
          itemsPerPage: result.itemsPerPage,
        },
      };
    } catch (error) {
      logger.error('Failed to get user orders:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: number, userId: number, userRole: UserRole = 'buyer'): Promise<any> {
    try {
      logger.debug(`Getting order ${orderId} for user ${userId}`);

      const order = await this.orderRepository.findByPk(orderId, {
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
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      // Check access permissions
      if (userRole !== 'admin' && order.userId !== userId) {
        throw new ForbiddenError('Access denied');
      }

      return this.formatOrderResponse(order);
    } catch (error) {
      logger.error('Failed to get order:', error);
      throw error;
    }
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(
    orderNumber: string,
    userId: number,
    userRole: UserRole = 'buyer'
  ): Promise<any> {
    try {
      logger.debug(`Getting order by number ${orderNumber} for user ${userId}`);

      const order = await this.orderRepository.findByOrderNumber(orderNumber);

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      // Check access permissions
      if (userRole !== 'admin' && order.userId !== userId) {
        throw new ForbiddenError('Access denied');
      }

      return this.formatOrderResponse(order);
    } catch (error) {
      logger.error('Failed to get order by number:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: number,
    newStatus: OrderStatus,
    userId: number,
    userRole: UserRole,
    reason?: string
  ): Promise<any> {
    const transaction = await sequelize.transaction();

    try {
      logger.debug(`Updating order ${orderId} status to ${newStatus}`, {
        userId,
        userRole,
        reason,
      });

      const order = await this.orderRepository.findByPk(orderId, { transaction });
      if (!order) {
        throw new NotFoundError('Order not found');
      }

      // Check permissions
      if (userRole !== 'admin' && order.userId !== userId) {
        throw new ForbiddenError('Access denied');
      }

      // Validate status transition
      if (!validateOrderStatus(order.status, newStatus)) {
        throw new ValidationError([
          {
            field: 'status',
            message: `Cannot change order status from ${order.status} to ${newStatus}`,
          },
        ]);
      }

      // Handle specific status changes
      if (newStatus === 'closed' && order.status !== 'delivered') {
        // Restore inventory for cancelled/closed orders
        const orderItems = await this.orderItemRepository.findByOrderId(orderId, { transaction });
        await this.updateInventoryForOrder(orderItems, 'increase', { transaction });
      }

      // Update the order status
      const updatedOrder = await this.orderRepository.updateOrderStatus(orderId, newStatus, {
        transaction,
      });

      await transaction.commit();

      logger.info(
        `Order ${orderId} status updated from ${order.status} to ${newStatus} by user ${userId}`
      );

      return this.formatOrderResponse(updatedOrder!);
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to update order status:', error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    orderId: number,
    userId: number,
    userRole: UserRole,
    reason: string
  ): Promise<any> {
    try {
      logger.debug(`Cancelling order ${orderId}`, { userId, userRole, reason });

      // Only allow cancellation for new or paid orders
      const order = await this.orderRepository.findByPk(orderId);
      if (!order) {
        throw new NotFoundError('Order not found');
      }

      if (userRole !== 'admin' && order.userId !== userId) {
        throw new ForbiddenError('Access denied');
      }

      if (!['new', 'paid'].includes(order.status)) {
        throw new ValidationError([
          {
            field: 'status',
            message: 'Only new or paid orders can be cancelled',
          },
        ]);
      }

      return this.updateOrderStatus(orderId, 'closed', userId, userRole, reason);
    } catch (error) {
      logger.error('Failed to cancel order:', error);
      throw error;
    }
  }

  /**
   * Get admin orders with filtering
   */
  async getAdminOrders(filters: OrderFilters, pagination: PaginationParams = {}): Promise<any> {
    try {
      logger.debug('Getting admin orders', { filters, pagination });

      const result = await this.orderRepository.findWithFilters(filters, pagination);

      return {
        orders: result.rows.map(order => this.formatOrderResponse(order, true)),
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalItems: result.count,
          itemsPerPage: result.itemsPerPage,
        },
        filters,
      };
    } catch (error) {
      logger.error('Failed to get admin orders:', error);
      throw error;
    }
  }

  /**
   * Get order statistics for user
   */
  async getUserOrderStats(userId: number): Promise<any> {
    try {
      logger.debug(`Getting order stats for user ${userId}`);

      const stats = await this.orderRepository.getUserOrderStats(userId);

      const formattedStats = {
        totalOrders: 0,
        totalSpent: 0,
        statusBreakdown: {} as Record<OrderStatus, { count: number; amount: number }>,
      };

      stats.forEach((stat: any) => {
        formattedStats.totalOrders += parseInt(stat.count);
        formattedStats.totalSpent += parseFloat(stat.totalAmount || '0');
        formattedStats.statusBreakdown[stat.status as OrderStatus] = {
          count: parseInt(stat.count),
          amount: parseFloat(stat.totalAmount || '0'),
        };
      });

      return formattedStats;
    } catch (error) {
      logger.error('Failed to get user order stats:', error);
      throw error;
    }
  }

  /**
   * Reorder from previous order
   */
  async reorder(userId: number, orderId: number, excludeProductIds: number[] = []): Promise<any> {
    const transaction = await sequelize.transaction();

    try {
      logger.debug(`Reordering from order ${orderId} for user ${userId}`, { excludeProductIds });

      // Get original order
      const originalOrder = await this.orderRepository.findByPk(orderId, {
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
              },
            ],
          },
        ],
        transaction,
      });

      if (!originalOrder || originalOrder.userId !== userId) {
        throw new NotFoundError('Order not found');
      }

      // Get user's current cart
      let cart = await this.cartRepository.findByUserId(userId, { transaction });
      if (!cart) {
        cart = await this.cartRepository.create({ userId }, { transaction });
      }

      // Add available items to cart
      const addedItems = [];
      const unavailableItems = [];

      for (const orderItem of originalOrder.items!) {
        if (excludeProductIds.includes(orderItem.productId)) {
          continue;
        }

        // Check if product is still available
        const product = await this.productRepository.findByPk(orderItem.productId, { transaction });
        if (!product || product.status !== 'active') {
          unavailableItems.push({
            productId: orderItem.productId,
            productName: orderItem.product?.name || 'Unknown Product',
            reason: 'Product no longer available',
          });
          continue;
        }

        // Check stock
        if (product.stockQuantity < orderItem.quantity) {
          unavailableItems.push({
            productId: orderItem.productId,
            productName: product.name,
            reason: `Insufficient stock (available: ${product.stockQuantity}, requested: ${orderItem.quantity})`,
          });
          continue;
        }

        // Check if item already exists in cart
        const existingCartItem = await this.cartItemRepository.findByCartAndProduct(
          cart.id,
          orderItem.productId,
          { transaction }
        );

        if (existingCartItem) {
          // Update quantity
          const newQuantity = existingCartItem.quantity + orderItem.quantity;
          if (product.stockQuantity >= newQuantity) {
            await this.cartItemRepository.updateCartItem(
              existingCartItem.id,
              {
                quantity: newQuantity,
              },
              { transaction }
            );

            addedItems.push({
              productId: orderItem.productId,
              productName: product.name,
              quantity: orderItem.quantity,
              newTotalQuantity: newQuantity,
            });
          } else {
            unavailableItems.push({
              productId: orderItem.productId,
              productName: product.name,
              reason: `Would exceed available stock (current in cart: ${existingCartItem.quantity}, available: ${product.stockQuantity})`,
            });
          }
        } else {
          // Create new cart item
          await this.cartItemRepository.createCartItem(
            {
              cartId: cart.id,
              productId: orderItem.productId,
              quantity: orderItem.quantity,
            },
            { transaction }
          );

          addedItems.push({
            productId: orderItem.productId,
            productName: product.name,
            quantity: orderItem.quantity,
          });
        }
      }

      await transaction.commit();

      logger.info(
        `Reorder completed for user ${userId}. Added ${addedItems.length} items, ${unavailableItems.length} unavailable`
      );

      return {
        success: true,
        addedItems,
        unavailableItems,
        summary: {
          originalOrderId: orderId,
          itemsAdded: addedItems.length,
          itemsUnavailable: unavailableItems.length,
        },
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to reorder:', error);
      throw error;
    }
  }

  /**
   * Validate cart items for order creation
   */
  private async validateCartForOrder(
    cartItems: CartItem[],
    options: any = {}
  ): Promise<{ valid: boolean; errors: any[] }> {
    const errors = [];

    for (const cartItem of cartItems) {
      const product = await this.productRepository.findByPk(cartItem.productId, options);

      if (!product) {
        errors.push({
          productId: cartItem.productId,
          error: 'Product not found',
        });
        continue;
      }

      if (product.status !== 'active') {
        errors.push({
          productId: cartItem.productId,
          productName: product.name,
          error: 'Product is not available',
        });
        continue;
      }

      if (product.stockQuantity < cartItem.quantity) {
        errors.push({
          productId: cartItem.productId,
          productName: product.name,
          error: `Insufficient stock (available: ${product.stockQuantity}, requested: ${cartItem.quantity})`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate products and stock for manual order creation
   */
  private async validateProductsAndStock(
    items: OrderItemInput[],
    options: any = {}
  ): Promise<{ valid: boolean; errors: any[] }> {
    const errors = [];

    for (const item of items) {
      const product = await this.productRepository.findByPk(item.productId, options);

      if (!product) {
        errors.push({
          productId: item.productId,
          error: 'Product not found',
        });
        continue;
      }

      if (product.status !== 'active') {
        errors.push({
          productId: item.productId,
          productName: product.name,
          error: 'Product is not available',
        });
        continue;
      }

      if (product.stockQuantity < item.quantity) {
        errors.push({
          productId: item.productId,
          productName: product.name,
          error: `Insufficient stock (available: ${product.stockQuantity}, requested: ${item.quantity})`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate order totals from cart items
   */
  private async calculateOrderFromCart(
    cartItems: CartItem[],
    couponCode?: string,
    options: any = {}
  ): Promise<OrderCalculation> {
    let subtotal = 0;
    const items = [];

    for (const cartItem of cartItems) {
      const product = await this.productRepository.findByPk(cartItem.productId, options);
      const unitPrice = product!.price;
      const quantity = cartItem.quantity;
      const itemSubtotal = unitPrice * quantity;

      // Simple tax calculation (10%)
      const taxAmount = itemSubtotal * 0.1;

      items.push({
        productId: cartItem.productId,
        quantity,
        unitPrice,
        discountAmount: 0,
        taxAmount,
        itemTotal: itemSubtotal + taxAmount,
      });

      subtotal += itemSubtotal;
    }

    const tax = subtotal * 0.1; // 10% tax
    const shippingFee = subtotal > 500000 ? 0 : 25000; // Free shipping over 500k
    let discountAmount = 0;

    // Apply coupon discount calculation if provided
    if (couponCode) {
      // This would integrate with coupon validation logic
      // For now, just a placeholder
      discountAmount = 0;
    }

    const total = subtotal + tax + shippingFee - discountAmount;

    return {
      subtotal,
      tax,
      shippingFee,
      discountAmount,
      total,
      items,
    };
  }

  /**
   * Calculate order totals for manual order
   */
  private async calculateOrderManual(
    orderData: CreateOrderManualData,
    options: any = {}
  ): Promise<OrderCalculation> {
    let subtotal = 0;
    const items = [];

    for (const item of orderData.items) {
      const itemSubtotal = item.unitPrice * item.quantity;
      const taxAmount = item.taxAmount || itemSubtotal * 0.1;
      const discountAmount = item.discountAmount || 0;

      items.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount,
        taxAmount,
        itemTotal: itemSubtotal + taxAmount - discountAmount,
      });

      subtotal += itemSubtotal;
    }

    const tax = orderData.tax || subtotal * 0.1;
    const shippingFee = orderData.shippingFee || (subtotal > 500000 ? 0 : 25000);
    const discountAmount = 0; // Will be calculated if coupon is applied

    const total = subtotal + tax + shippingFee - discountAmount;

    return {
      subtotal,
      tax,
      shippingFee,
      discountAmount,
      total,
      items,
    };
  }

  /**
   * Validate and apply coupon (placeholder)
   */
  private async validateAndApplyCoupon(
    couponCode: string,
    userId: number,
    orderSubtotal: number,
    options: any = {}
  ): Promise<Coupon> {
    // This would integrate with the coupon service
    // For now, just a placeholder that throws an error
    throw new NotFoundError('Coupon validation not implemented yet');
  }

  /**
   * Update inventory for order
   */
  private async updateInventoryForOrder(
    items: Array<{ productId: number; quantity: number }>,
    action: 'increase' | 'decrease',
    options: any = {}
  ): Promise<void> {
    for (const item of items) {
      const product = await this.productRepository.findByPk(item.productId, options);
      if (product) {
        const multiplier = action === 'decrease' ? -1 : 1;
        const newStock = product.stockQuantity + item.quantity * multiplier;

        await this.productRepository.update(
          { stockQuantity: Math.max(0, newStock) },
          {
            where: { id: item.productId },
            ...options,
          }
        );
      }
    }
  }

  /**
   * Format order response for API
   */
  private formatOrderResponse(order: Order, includeUserDetails: boolean = false): any {
    const formatted: any = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: parseFloat(order.subtotal.toString()),
      tax: parseFloat(order.tax.toString()),
      shippingFee: parseFloat(order.shippingFee.toString()),
      total: parseFloat(order.total.toString()),
      items:
        order.items?.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice.toString()),
          discountAmount: parseFloat(item.discountAmount.toString()),
          taxAmount: parseFloat(item.taxAmount.toString()),
          product: item.product
            ? {
                id: item.product.id,
                name: item.product.name,
                sku: item.product.sku,
                slug: item.product.slug,
              }
            : null,
        })) || [],
      coupon: order.coupon
        ? {
            id: order.coupon.id,
            code: order.coupon.code,
            type: order.coupon.type,
            value: order.coupon.value,
          }
        : null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    if (includeUserDetails && order.user) {
      formatted.user = {
        id: order.user.id,
        email: order.user.email,
        firstName: order.user.firstName,
        lastName: order.user.lastName,
      };
    }

    return formatted;
  }
}
