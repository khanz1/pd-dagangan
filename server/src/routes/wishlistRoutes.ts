import { Router } from 'express';
import { WishlistController } from '../controllers/wishlistController';
import { authenticate } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();
const wishlistController = new WishlistController();

// Apply authentication to all wishlist routes
router.use(authenticate);

// Get user's wishlists
router.get('/', wishlistController.getUserWishlists.bind(wishlistController));

// Create new wishlist
router.post('/', rateLimiter, wishlistController.createWishlist.bind(wishlistController));

// Update wishlist
router.put('/:wishlistId', wishlistController.updateWishlist.bind(wishlistController));

// Delete wishlist
router.delete('/:wishlistId', wishlistController.deleteWishlist.bind(wishlistController));

// Get wishlist items
router.get('/:wishlistId/items', wishlistController.getWishlistItems.bind(wishlistController));

// Add item to wishlist
router.post('/:wishlistId/items', wishlistController.addItemToWishlist.bind(wishlistController));

// Remove item from wishlist
router.delete(
  '/items/:wishlistItemId',
  wishlistController.removeWishlistItem.bind(wishlistController)
);

// Remove product from all wishlists
router.delete(
  '/products/:productId',
  wishlistController.removeProductFromWishlist.bind(wishlistController)
);

// Check if product is in wishlist
router.get('/check/:productId', wishlistController.isProductInWishlist.bind(wishlistController));

// Bulk operations
router.delete('/items/bulk', wishlistController.bulkRemoveWishlistItems.bind(wishlistController));
router.post('/items/move', wishlistController.moveItemsBetweenWishlists.bind(wishlistController));
router.post('/copy-from-cart', wishlistController.copyFromCart.bind(wishlistController));

export default router;
