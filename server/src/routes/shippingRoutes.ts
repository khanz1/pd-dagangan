import express from 'express';
import { ShippingController } from '../controllers/shippingController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { createRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();
const shippingController = new ShippingController();

// Public endpoints (no authentication required)

/**
 * Calculate shipping cost
 * POST /api/shipping/cost
 */
router.post(
  '/cost',
  createRateLimiter(30, 15), // 30 cost calculations per 15 minutes
  asyncHandler(shippingController.calculateShippingCost)
);

/**
 * Track package (public)
 * GET /api/shipping/track/:trackingNumber
 */
router.get(
  '/track/:trackingNumber',
  createRateLimiter(60, 15), // 60 tracking requests per 15 minutes
  asyncHandler(shippingController.trackPackage)
);

/**
 * Get provinces
 * GET /api/shipping/provinces
 */
router.get(
  '/provinces',
  createRateLimiter(60, 15), // 60 requests per 15 minutes
  asyncHandler(shippingController.getProvinces)
);

/**
 * Get cities
 * GET /api/shipping/cities
 */
router.get(
  '/cities',
  createRateLimiter(60, 15), // 60 requests per 15 minutes
  asyncHandler(shippingController.getCities)
);

/**
 * Get supported couriers
 * GET /api/shipping/couriers
 */
router.get(
  '/couriers',
  createRateLimiter(60, 15), // 60 requests per 15 minutes
  asyncHandler(shippingController.getSupportedCouriers)
);

/**
 * Validate address
 * POST /api/shipping/validate-address
 */
router.post(
  '/validate-address',
  createRateLimiter(30, 15), // 30 validations per 15 minutes
  asyncHandler(shippingController.validateAddress)
);

// Protected user endpoints (authentication required)

/**
 * Calculate shipping cost for order
 * POST /api/shipping/cost/order/:orderId
 */
router.post(
  '/cost/order/:orderId',
  authenticate,
  createRateLimiter(30, 15), // 30 cost calculations per 15 minutes
  asyncHandler(shippingController.calculateShippingCostForOrder)
);

/**
 * Get user's shipments
 * GET /api/shipping/shipments
 */
router.get(
  '/shipments',
  authenticate,
  createRateLimiter(60, 15), // 60 requests per 15 minutes
  asyncHandler(shippingController.getUserShipments)
);

/**
 * Get shipment by ID
 * GET /api/shipping/shipments/:shipmentId
 */
router.get(
  '/shipments/:shipmentId',
  authenticate,
  createRateLimiter(60, 15), // 60 requests per 15 minutes
  asyncHandler(shippingController.getShipmentById)
);

/**
 * Get user shipping statistics
 * GET /api/shipping/stats
 */
router.get(
  '/stats',
  authenticate,
  createRateLimiter(30, 15), // 30 requests per 15 minutes
  asyncHandler(shippingController.getUserShippingStats)
);

// Address management endpoints

/**
 * Create address
 * POST /api/shipping/addresses
 */
router.post(
  '/addresses',
  authenticate,
  createRateLimiter(10, 15), // 10 address creations per 15 minutes
  asyncHandler(shippingController.createAddress)
);

/**
 * Get user's addresses
 * GET /api/shipping/addresses
 */
router.get(
  '/addresses',
  authenticate,
  createRateLimiter(60, 15), // 60 requests per 15 minutes
  asyncHandler(shippingController.getUserAddresses)
);

/**
 * Update address
 * PUT /api/shipping/addresses/:addressId
 */
router.put(
  '/addresses/:addressId',
  authenticate,
  createRateLimiter(20, 15), // 20 address updates per 15 minutes
  asyncHandler(shippingController.updateAddress)
);

/**
 * Delete address
 * DELETE /api/shipping/addresses/:addressId
 */
router.delete(
  '/addresses/:addressId',
  authenticate,
  createRateLimiter(10, 15), // 10 address deletions per 15 minutes
  asyncHandler(shippingController.deleteAddress)
);

// Admin endpoints (authentication + admin role required)

/**
 * Create shipment (Admin)
 * POST /api/shipping/shipments
 */
router.post(
  '/shipments',
  authenticate,
  authorize(['admin']),
  createRateLimiter(30, 15), // 30 shipment creations per 15 minutes
  asyncHandler(shippingController.createShipment)
);

/**
 * Update shipment status (Admin)
 * PUT /api/shipping/shipments/:shipmentId/status
 */
router.put(
  '/shipments/:shipmentId/status',
  authenticate,
  authorize(['admin']),
  createRateLimiter(60, 15), // 60 status updates per 15 minutes
  asyncHandler(shippingController.updateShipmentStatus)
);

/**
 * Get all shipments (Admin)
 * GET /api/admin/shipments
 */
router.get(
  '/admin/shipments',
  authenticate,
  authorize(['admin']),
  createRateLimiter(60, 15), // 60 requests per 15 minutes
  asyncHandler(shippingController.getAllShipments)
);

/**
 * Bulk update shipment status (Admin)
 * PUT /api/admin/shipments/bulk-status
 */
router.put(
  '/admin/shipments/bulk-status',
  authenticate,
  authorize(['admin']),
  createRateLimiter(10, 15), // 10 bulk updates per 15 minutes
  asyncHandler(shippingController.bulkUpdateShipmentStatus)
);

/**
 * Get shipping statistics (Admin)
 * GET /api/admin/shipments/stats
 */
router.get(
  '/admin/shipments/stats',
  authenticate,
  authorize(['admin']),
  createRateLimiter(30, 15), // 30 requests per 15 minutes
  asyncHandler(shippingController.getAdminShippingStats)
);

export default router;
