import { Router } from 'express';
import { CartController } from '@/controllers/cartController';
import { authenticate } from '@/middleware/auth';
import { rateLimiter } from '@/middleware/rateLimiter';

const router = Router();
const cartController = new CartController();

// Apply authentication middleware to all cart routes
router.use(authenticate);

// Apply rate limiting
router.use(rateLimiter);

// Cart management routes
router.get('/', cartController.getCart.bind(cartController));
router.get('/summary', cartController.getCartSummary.bind(cartController));
router.delete('/', cartController.clearCart.bind(cartController));

// Cart item management routes
router.post('/items', cartController.addItem.bind(cartController));
router.put('/items/:cartItemId', cartController.updateCartItem.bind(cartController));
router.delete('/items/:cartItemId', cartController.removeCartItem.bind(cartController));

// Product-based cart operations
router.delete('/products/:productId', cartController.removeProductFromCart.bind(cartController));

// Bulk operations
router.put('/items/bulk', cartController.bulkUpdateItems.bind(cartController));
router.delete('/items/bulk', cartController.bulkRemoveItems.bind(cartController));

// Cross-system operations
router.post('/move-to-wishlist', cartController.moveToWishlist.bind(cartController));

export default router;
