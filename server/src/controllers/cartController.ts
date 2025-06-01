import { Request, Response } from 'express';
import { CartService } from '@/services/cartService';
import { validateInput } from '@/middleware/validation';
import {
  createCartItemSchema,
  updateCartItemSchema,
  cartItemParamsSchema,
  productParamsSchema,
  bulkUpdateCartItemsSchema,
  bulkRemoveCartItemsSchema,
  moveToWishlistSchema,
  CreateCartItemInput,
  UpdateCartItemInput,
  BulkUpdateCartItemsInput,
  BulkRemoveCartItemsInput,
  MoveToWishlistInput,
} from '@/validators/cartValidators';
import { AuthenticatedRequest } from '@/types/auth';

export class CartController {
  private cartService: CartService;

  constructor() {
    this.cartService = new CartService();
  }

  /**
   * Get user's cart
   * GET /api/v1/cart
   */
  async getCart(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const cart = await this.cartService.getUserCart(userId);

      res.json(cart);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to get cart', error: error.message });
    }
  }

  /**
   * Get cart summary (totals only)
   * GET /api/v1/cart/summary
   */
  async getCartSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const summary = await this.cartService.getCartSummary(userId);

      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to get cart summary', error: error.message });
    }
  }

  /**
   * Add item to cart
   * POST /api/v1/cart/items
   */
  async addItem(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const validatedData = validateInput(createCartItemSchema, req.body) as CreateCartItemInput;

      const cartItem = await this.cartService.addItemToCart(userId, {
        cartId: 0, // Will be set by service
        productId: validatedData.productId,
        quantity: validatedData.quantity,
      });

      res.status(201).json(cartItem);
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        message: error.message || 'Failed to add item to cart',
        ...(error.details && { details: error.details }),
      });
    }
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const params = validateInput(cartItemParamsSchema as any, req.params) as {
        cartItemId: number;
      };
      const validatedData = validateInput(updateCartItemSchema, req.body);

      const cartItem = await this.cartService.updateCartItem(
        userId,
        params.cartItemId,
        validatedData
      );
      res.json(cartItem);
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        message: error.message || 'Failed to update cart item',
        ...(error.details && { details: error.details }),
      });
    }
  }

  /**
   * Remove cart item
   */
  async removeCartItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const params = validateInput(cartItemParamsSchema as any, req.params) as {
        cartItemId: number;
      };

      await this.cartService.removeCartItem(userId, params.cartItemId);
      res.status(204).send();
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        message: error.message || 'Failed to remove cart item',
      });
    }
  }

  /**
   * Remove product from cart
   */
  async removeProductFromCart(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const params = validateInput(productParamsSchema, req.params) as { productId: number };
      const userId = req.user!.id;

      // This functionality can be achieved by getting cart items and removing specific ones
      // For now, we'll return a not implemented response
      res.status(501).json({
        success: false,
        message: 'Feature not implemented - use bulk remove cart items instead',
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to remove product from cart',
      });
    }
  }

  /**
   * Clear entire cart
   * DELETE /api/v1/cart
   */
  async clearCart(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      await this.cartService.clearCart(userId);

      res.status(204).send();
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        message: error.message || 'Failed to clear cart',
      });
    }
  }

  /**
   * Bulk update cart items
   * PUT /api/v1/cart/items/bulk
   */
  async bulkUpdateItems(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const validatedData = validateInput(
        bulkUpdateCartItemsSchema,
        req.body
      ) as BulkUpdateCartItemsInput;

      const updatedItems = await this.cartService.bulkUpdateCartItems(userId, validatedData.items);

      res.json({
        message: 'Cart items updated successfully',
        updatedItems,
        count: updatedItems.length,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        message: error.message || 'Failed to bulk update cart items',
        ...(error.details && { details: error.details }),
      });
    }
  }

  /**
   * Bulk remove cart items
   * DELETE /api/v1/cart/items/bulk
   */
  async bulkRemoveItems(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const validatedData = validateInput(
        bulkRemoveCartItemsSchema,
        req.body
      ) as BulkRemoveCartItemsInput;

      const result = await this.cartService.bulkRemoveCartItems(userId, validatedData.cartItemIds);

      res.json({
        message: 'Cart items removed successfully',
        ...result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        message: error.message || 'Failed to bulk remove cart items',
        ...(error.details && { details: error.details }),
      });
    }
  }

  /**
   * Move cart items to wishlist
   * POST /api/v1/cart/move-to-wishlist
   */
  async moveToWishlist(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const validatedData = validateInput(moveToWishlistSchema, req.body) as MoveToWishlistInput;

      const result = await this.cartService.moveToWishlist(userId, {
        cartItemIds: validatedData.cartItemIds,
        wishlistId: validatedData.wishlistId,
      });

      res.json({
        message: 'Items moved to wishlist successfully',
        ...result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        message: error.message || 'Failed to move items to wishlist',
        ...(error.details && { details: error.details }),
      });
    }
  }
}
