import { z } from 'zod';
import { PaymentStatus, PaymentMethodType } from '../types';

// Base validation schemas
const paymentStatusSchema = z.enum(['pending', 'success', 'failed']);
const paymentMethodTypeSchema = z.enum(['card', 'wallet', 'bank']);

// Create payment schema
export const createPaymentSchema = z.object({
  orderId: z.number().int().positive(),
  paymentMethodId: z.number().int().positive().optional(),
  amount: z.number().min(0),
  currency: z.string().length(3).default('IDR'),
  paymentType: z.string().min(1).max(50).optional(),
});

// Payment method management schemas
export const createPaymentMethodSchema = z.object({
  type: paymentMethodTypeSchema,
  provider: z.string().min(1).max(50).optional(),
  maskedAccount: z.string().min(1).max(50).optional(),
  expiresAt: z
    .string()
    .transform(val => new Date(val))
    .optional(),
});

export const updatePaymentMethodSchema = z.object({
  provider: z.string().min(1).max(50).optional(),
  maskedAccount: z.string().min(1).max(50).optional(),
  expiresAt: z
    .string()
    .transform(val => new Date(val))
    .optional(),
});

// Payment status update schema
export const updatePaymentStatusSchema = z.object({
  status: paymentStatusSchema,
  gatewayResponse: z.record(z.any()).optional(),
  transactionId: z.string().min(1).optional(),
});

// Payment query filters schema
export const paymentQuerySchema = z.object({
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
      paymentStatusSchema,
      z
        .string()
        .transform(val => val.split(',').filter(s => ['pending', 'success', 'failed'].includes(s))),
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
  minAmount: z
    .string()
    .transform(val => parseFloat(val))
    .optional(),
  maxAmount: z
    .string()
    .transform(val => parseFloat(val))
    .optional(),
  currency: z.string().length(3).optional(),
  orderId: z
    .string()
    .transform(val => parseInt(val))
    .optional(),
});

// Admin payment query schema
export const adminPaymentQuerySchema = paymentQuerySchema.extend({
  userId: z
    .string()
    .transform(val => parseInt(val))
    .optional(),
  userEmail: z.string().email().optional(),
});

// Payment parameters schema
export const paymentParamsSchema = z.object({
  paymentId: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num) || num <= 0) {
      throw new Error('Payment ID must be a positive number');
    }
    return num;
  }),
});

// Payment method parameters schema
export const paymentMethodParamsSchema = z.object({
  methodId: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num) || num <= 0) {
      throw new Error('Payment method ID must be a positive number');
    }
    return num;
  }),
});

// Midtrans payment request schema
export const midtransPaymentRequestSchema = z.object({
  orderId: z.string().min(1).max(50),
  amount: z.number().min(0),
  currency: z.string().length(3).default('IDR'),
  paymentType: z
    .enum(['bank_transfer', 'credit_card', 'qris', 'gopay', 'shopeepay', 'ovo'])
    .default('bank_transfer'),
  customerDetails: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().max(100).optional(),
    email: z.string().email(),
    phone: z.string().max(20).optional(),
  }),
  itemDetails: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(200),
        price: z.number().min(0),
        quantity: z.number().int().min(1),
      })
    )
    .min(1)
    .max(100),
});

// Midtrans callback schema
export const midtransCallbackSchema = z.object({
  transaction_id: z.string(),
  order_id: z.string(),
  transaction_status: z.string(),
  gross_amount: z.string(),
  payment_type: z.string(),
  signature_key: z.string(),
  fraud_status: z.string().optional(),
  status_code: z.string().optional(),
  status_message: z.string().optional(),
  settlement_time: z.string().optional(),
  transaction_time: z.string().optional(),
});

// Payment cancellation schema
export const cancelPaymentSchema = z.object({
  reason: z.string().min(1).max(255),
});

// Payment retry schema
export const retryPaymentSchema = z.object({
  paymentType: z
    .enum(['bank_transfer', 'credit_card', 'qris', 'gopay', 'shopeepay', 'ovo'])
    .optional(),
});

// Refund request schema
export const refundRequestSchema = z.object({
  amount: z.number().min(0).optional(), // Partial refund if specified
  reason: z.string().min(1).max(255),
});

// Export types for TypeScript
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>;
export type AdminPaymentQueryInput = z.infer<typeof adminPaymentQuerySchema>;
export type MidtransPaymentRequestInput = z.infer<typeof midtransPaymentRequestSchema>;
export type MidtransCallbackInput = z.infer<typeof midtransCallbackSchema>;
export type CancelPaymentInput = z.infer<typeof cancelPaymentSchema>;
export type RetryPaymentInput = z.infer<typeof retryPaymentSchema>;
export type RefundRequestInput = z.infer<typeof refundRequestSchema>;

// Validation helpers
export function validatePaymentAmount(amount: number): boolean {
  return amount >= 1000 && amount <= 999999999; // Min 1k, Max 999M IDR
}

export function validatePaymentMethodExpiry(expiresAt: Date): boolean {
  const now = new Date();
  const maxExpiry = new Date();
  maxExpiry.setFullYear(now.getFullYear() + 10); // Max 10 years from now

  return expiresAt > now && expiresAt <= maxExpiry;
}

export function validateCurrency(currency: string): boolean {
  const supportedCurrencies = ['IDR', 'USD', 'SGD', 'MYR'];
  return supportedCurrencies.includes(currency.toUpperCase());
}

export function validatePaymentType(paymentType: string): boolean {
  const supportedTypes = [
    'bank_transfer',
    'credit_card',
    'qris',
    'gopay',
    'shopeepay',
    'ovo',
    'dana',
    'linkaja',
  ];
  return supportedTypes.includes(paymentType.toLowerCase());
}

export function sanitizeCardNumber(cardNumber: string): string {
  // Return masked card number (show last 4 digits only)
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 4) return '****';
  return `****-****-****-${cleaned.slice(-4)}`;
}

export function validateSignature(
  orderId: string,
  status: string,
  grossAmount: string,
  serverKey: string,
  signatureKey: string
): boolean {
  // In real implementation, this would validate Midtrans signature
  // For mock validation, just check if all required fields are present
  return !!(orderId && status && grossAmount && serverKey && signatureKey);
}
