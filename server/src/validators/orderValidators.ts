import { z } from 'zod';
import { OrderStatus } from '../types';

// Base validation schemas
const orderStatusSchema = z.enum(['new', 'paid', 'shipped', 'delivered', 'closed']);

// Create order from cart schema
export const createOrderFromCartSchema = z.object({
  couponCode: z.string().optional(),
  shippingAddressId: z.number().int().positive().optional(),
  paymentMethodId: z.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
});

// Create order manually (admin) schema
export const createOrderSchema = z.object({
  userId: z.number().int().positive(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(999),
        unitPrice: z.number().min(0),
        discountAmount: z.number().min(0).default(0),
        taxAmount: z.number().min(0).default(0),
      })
    )
    .min(1)
    .max(100),
  couponCode: z.string().optional(),
  shippingFee: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  notes: z.string().max(500).optional(),
});

// Update order schema
export const updateOrderSchema = z.object({
  status: orderStatusSchema.optional(),
  notes: z.string().max(500).optional(),
});

// Order status update schema
export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
  reason: z.string().max(255).optional(),
});

// Order query filters schema
export const orderQuerySchema = z.object({
  page: z
    .string()
    .transform(val => parseInt(val) || 1)
    .default('1'),
  limit: z
    .string()
    .transform(val => {
      const num = parseInt(val) || 20;
      return Math.min(Math.max(num, 1), 100);
    })
    .default('20'),
  status: z
    .union([
      orderStatusSchema,
      z
        .string()
        .transform(val =>
          val.split(',').filter(s => ['new', 'paid', 'shipped', 'delivered', 'closed'].includes(s))
        ),
    ])
    .optional(),
  dateFrom: z
    .string()
    .transform(val => new Date(val))
    .optional(),
  dateTo: z
    .string()
    .transform(val => new Date(val))
    .optional(),
  minTotal: z
    .string()
    .transform(val => parseFloat(val))
    .optional(),
  maxTotal: z
    .string()
    .transform(val => parseFloat(val))
    .optional(),
  orderNumber: z.string().max(50).optional(),
  search: z.string().max(100).optional(),
});

// Admin order query filters schema (includes user search)
export const adminOrderQuerySchema = orderQuerySchema.extend({
  userId: z
    .string()
    .transform(val => parseInt(val))
    .optional(),
  userEmail: z.string().email().optional(),
});

// Order parameters schema
export const orderParamsSchema = z.object({
  orderId: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num) || num <= 0) {
      throw new Error('Order ID must be a positive number');
    }
    return num;
  }),
});

// Order number parameters schema
export const orderNumberParamsSchema = z.object({
  orderNumber: z.string().min(1).max(30),
});

// Cancel order schema
export const cancelOrderSchema = z.object({
  reason: z.string().min(1).max(255),
});

// Reorder schema
export const reorderSchema = z.object({
  orderId: z.number().int().positive(),
  excludeProductIds: z.array(z.number().int().positive()).optional(),
});

// Apply coupon schema
export const applyCouponSchema = z.object({
  couponCode: z.string().min(1).max(50),
});

// Order item schema for validation
export const orderItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(999),
  unitPrice: z.number().min(0),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
});

// Bulk order operations schema
export const bulkOrderUpdateSchema = z.object({
  orderIds: z.array(z.number().int().positive()).min(1).max(100),
  status: orderStatusSchema,
  reason: z.string().max(255).optional(),
});

// Export types for TypeScript
export type CreateOrderFromCartInput = z.infer<typeof createOrderFromCartSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type AdminOrderQueryInput = z.infer<typeof adminOrderQuerySchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type BulkOrderUpdateInput = z.infer<typeof bulkOrderUpdateSchema>;

// Validation helpers
export function validateOrderTotal(
  subtotal: number,
  tax: number,
  shipping: number,
  discount: number = 0
): boolean {
  const total = subtotal + tax + shipping - discount;
  return total >= 0 && total <= 999999.99;
}

export function validateOrderItems(items: OrderItemInput[]): boolean {
  if (items.length === 0 || items.length > 100) {
    return false;
  }

  // Check for duplicate products
  const productIds = items.map(item => item.productId);
  const uniqueProductIds = new Set(productIds);

  if (productIds.length !== uniqueProductIds.size) {
    return false;
  }

  // Validate each item
  return items.every(item => {
    const itemTotal = (item.unitPrice + item.taxAmount - item.discountAmount) * item.quantity;
    return itemTotal >= 0 && itemTotal <= 999999.99;
  });
}

export function validateOrderStatus(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    new: ['paid', 'closed'],
    paid: ['shipped', 'closed'],
    shipped: ['delivered', 'closed'],
    delivered: ['closed'],
    closed: [], // No transitions from closed
  };

  return validTransitions[currentStatus].includes(newStatus);
}
