import express from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { createRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();
const paymentController = new PaymentController();

// Public endpoints (no authentication required)

/**
 * Payment webhook callback
 * POST /api/payments/callback/midtrans
 */
router.post(
  '/callback/midtrans',
  createRateLimiter(100, 15), // 100 requests per 15 minutes for callbacks
  asyncHandler(paymentController.processMidtransCallback)
);

/**
 * Get available payment methods
 * GET /api/payments/methods/available
 */
router.get(
  '/methods/available',
  createRateLimiter(60, 15), // 60 requests per 15 minutes
  asyncHandler(paymentController.getAvailablePaymentMethods)
);

// Protected user endpoints (authentication required)

/**
 * Create payment from order
 * POST /api/payments/from-order
 */
router.post(
  '/from-order',
  authenticate,
  createRateLimiter(10, 15), // 10 payment creations per 15 minutes
  asyncHandler(paymentController.createPaymentFromOrder)
);

/**
 * Get user's payments
 * GET /api/payments
 */
router.get(
  '/',
  authenticate,
  createRateLimiter(60, 15), // 60 requests per 15 minutes
  asyncHandler(paymentController.getUserPayments)
);

/**
 * Get payment by ID
 * GET /api/payments/:paymentId
 */
router.get(
  '/:paymentId',
  authenticate,
  createRateLimiter(60, 15), // 60 requests per 15 minutes
  asyncHandler(paymentController.getPaymentById)
);

/**
 * Get payment status from gateway
 * GET /api/payments/:paymentId/status
 */
router.get(
  '/:paymentId/status',
  authenticate,
  createRateLimiter(30, 15), // 30 status checks per 15 minutes
  asyncHandler(paymentController.getPaymentStatus)
);

/**
 * Cancel payment
 * POST /api/payments/:paymentId/cancel
 */
router.post(
  '/:paymentId/cancel',
  authenticate,
  createRateLimiter(5, 15), // 5 cancellations per 15 minutes
  asyncHandler(paymentController.cancelPayment)
);

/**
 * Get user payment statistics
 * GET /api/payments/stats
 */
router.get(
  '/user/stats',
  authenticate,
  createRateLimiter(30, 15), // 30 requests per 15 minutes
  asyncHandler(paymentController.getUserPaymentStats)
);

// Payment method management

/**
 * Create payment method
 * POST /api/payments/methods
 */
router.post(
  '/methods',
  authenticate,
  createRateLimiter(10, 15), // 10 method creations per 15 minutes
  asyncHandler(paymentController.createPaymentMethod)
);

/**
 * Get user's payment methods
 * GET /api/payments/methods
 */
router.get(
  '/methods',
  authenticate,
  createRateLimiter(60, 15), // 60 requests per 15 minutes
  asyncHandler(paymentController.getUserPaymentMethods)
);

/**
 * Delete payment method
 * DELETE /api/payments/methods/:methodId
 */
router.delete(
  '/methods/:methodId',
  authenticate,
  createRateLimiter(10, 15), // 10 deletions per 15 minutes
  asyncHandler(paymentController.deletePaymentMethod)
);

// Admin endpoints (authentication + admin role required)

/**
 * Get all payments (Admin)
 * GET /api/admin/payments
 */
router.get(
  '/admin/all',
  authenticate,
  authorize(['admin']),
  createRateLimiter(60, 15), // 60 requests per 15 minutes
  asyncHandler(paymentController.getAllPayments)
);

/**
 * Update payment status (Admin)
 * PUT /api/admin/payments/:paymentId/status
 */
router.put(
  '/admin/:paymentId/status',
  authenticate,
  authorize(['admin']),
  createRateLimiter(30, 15), // 30 status updates per 15 minutes
  asyncHandler(paymentController.updatePaymentStatus)
);

/**
 * Get payment statistics (Admin)
 * GET /api/admin/payments/stats
 */
router.get(
  '/admin/stats',
  authenticate,
  authorize(['admin']),
  createRateLimiter(30, 15), // 30 requests per 15 minutes
  asyncHandler(paymentController.getAdminPaymentStats)
);

export default router;
