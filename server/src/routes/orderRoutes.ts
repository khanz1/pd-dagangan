import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authenticate, requireRole } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();
const orderController = new OrderController();

// Apply authentication to all order routes
router.use(authenticate);

// User order routes
router.get('/stats', orderController.getUserOrderStats.bind(orderController));
router.get('/number/:orderNumber', orderController.getOrderByNumber.bind(orderController));
router.get('/:orderId', orderController.getOrderById.bind(orderController));
router.get('/', orderController.getUserOrders.bind(orderController));

// Order creation routes
router.post('/from-cart', rateLimiter, orderController.createOrderFromCart.bind(orderController));
router.post(
  '/manual',
  requireRole(['admin']),
  orderController.createOrderManually.bind(orderController)
);

// Order management routes
router.patch('/:orderId/status', orderController.updateOrderStatus.bind(orderController));
router.post('/:orderId/cancel', orderController.cancelOrder.bind(orderController));
router.post('/:orderId/reorder', rateLimiter, orderController.reorder.bind(orderController));

// Admin-only routes
router.get(
  '/admin/orders',
  requireRole(['admin']),
  orderController.getAdminOrders.bind(orderController)
);
router.put(
  '/admin/orders/:orderId',
  requireRole(['admin']),
  orderController.updateOrder.bind(orderController)
);
router.patch(
  '/admin/orders/bulk-status',
  requireRole(['admin']),
  orderController.bulkUpdateOrderStatus.bind(orderController)
);

export default router;
