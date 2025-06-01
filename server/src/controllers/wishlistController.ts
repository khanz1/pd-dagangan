import { Request, Response } from 'express';
import { WishlistService } from '../services/wishlistService';
import { validateInput } from '../middleware/validation';
import {
  createWishlistSchema,
  updateWishlistSchema,
  wishlistQuerySchema,
  createWishlistItemSchema,
  wishlistItemQuerySchema,
  wishlistItemParamsSchema,
  wishlistParamsSchema,
  productParamsSchema,
  moveWishlistItemsSchema,
  bulkRemoveWishlistItemsSchema,
  copyFromCartSchema,
  CreateWishlistInput,
  UpdateWishlistInput,
  WishlistQueryInput,
  CreateWishlistItemInput,
  WishlistItemQueryInput,
  MoveWishlistItemsInput,
  BulkRemoveWishlistItemsInput,
  CopyFromCartInput,
} from '../validators/wishlistValidators';
import { AuthenticatedRequest } from '../types/auth';
import { logger } from '../config/logger';

export class WishlistController {
  private wishlistService: WishlistService;

  constructor() {
    this.wishlistService = new WishlistService();
  }

  /**
   * Get user's wishlists
   */
  async getUserWishlists(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit, search, isPublic } = validateInput(
        wishlistQuerySchema,
        req.query
      ) as WishlistQueryInput;
      const userId = req.user!.id;

      const wishlists = await this.wishlistService.getUserWishlists(userId, {
        page,
        limit,
      });

      res.json({
        success: true,
        data: wishlists,
      });
    } catch (error: any) {
      logger.error('Failed to get user wishlists:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to get wishlists',
      });
    }
  }

  /**
   * Create a new wishlist
   */
  async createWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validatedData = validateInput(createWishlistSchema, req.body) as CreateWishlistInput;
      const userId = req.user!.id;

      const wishlist = await this.wishlistService.createWishlist(userId, {
        userId,
        name: validatedData.name,
        isPublic: validatedData.isPublic,
      });

      res.status(201).json({
        success: true,
        data: wishlist,
      });
    } catch (error: any) {
      logger.error('Failed to create wishlist:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to create wishlist',
      });
    }
  }

  /**
   * Update wishlist
   */
  async updateWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { wishlistId } = validateInput(wishlistParamsSchema, req.params) as {
        wishlistId: number;
      };
      const validatedData = validateInput(updateWishlistSchema, req.body) as UpdateWishlistInput;
      const userId = req.user!.id;

      const wishlist = await this.wishlistService.updateWishlist(wishlistId, userId, validatedData);

      res.json({
        success: true,
        data: wishlist,
      });
    } catch (error: any) {
      logger.error('Failed to update wishlist:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update wishlist',
      });
    }
  }

  /**
   * Delete wishlist
   */
  async deleteWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { wishlistId } = validateInput(wishlistParamsSchema, req.params) as {
        wishlistId: number;
      };
      const userId = req.user!.id;

      await this.wishlistService.deleteWishlist(wishlistId, userId);

      res.json({
        success: true,
        message: 'Wishlist deleted successfully',
      });
    } catch (error: any) {
      logger.error('Failed to delete wishlist:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete wishlist',
      });
    }
  }

  /**
   * Get wishlist items
   */
  async getWishlistItems(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { wishlistId } = validateInput(wishlistParamsSchema, req.params) as {
        wishlistId: number;
      };
      const { page, limit } = validateInput(
        wishlistItemQuerySchema,
        req.query
      ) as WishlistItemQueryInput;
      const userId = req.user!.id;

      const items = await this.wishlistService.getWishlistItems(wishlistId, userId, {
        page,
        limit,
      });

      res.json({
        success: true,
        data: items,
      });
    } catch (error: any) {
      logger.error('Failed to get wishlist items:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to get wishlist items',
      });
    }
  }

  /**
   * Add item to wishlist
   */
  async addItemToWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { wishlistId } = validateInput(wishlistParamsSchema, req.params) as {
        wishlistId: number;
      };
      const validatedData = validateInput(
        createWishlistItemSchema,
        req.body
      ) as CreateWishlistItemInput;
      const userId = req.user!.id;

      const wishlistItem = await this.wishlistService.addItemToWishlist(userId, {
        wishlistId,
        productId: validatedData.productId,
      });

      res.status(201).json({
        success: true,
        data: wishlistItem,
      });
    } catch (error: any) {
      logger.error('Failed to add item to wishlist:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to add item to wishlist',
      });
    }
  }

  /**
   * Remove item from wishlist
   */
  async removeWishlistItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { wishlistItemId } = validateInput(wishlistItemParamsSchema, req.params) as {
        wishlistItemId: number;
      };
      const userId = req.user!.id;

      await this.wishlistService.removeWishlistItem(userId, wishlistItemId);

      res.json({
        success: true,
        message: 'Item removed from wishlist successfully',
      });
    } catch (error: any) {
      logger.error('Failed to remove wishlist item:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to remove wishlist item',
      });
    }
  }

  /**
   * Remove product from all wishlists
   */
  async removeProductFromWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { productId } = validateInput(productParamsSchema, req.params) as { productId: number };
      const userId = req.user!.id;

      await this.wishlistService.removeProductFromWishlist(userId, productId);

      res.json({
        success: true,
        message: 'Product removed from all wishlists successfully',
      });
    } catch (error: any) {
      logger.error('Failed to remove product from wishlist:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to remove product from wishlist',
        ...(error.details && { details: error.details }),
      });
    }
  }

  /**
   * Bulk remove wishlist items
   */
  async bulkRemoveWishlistItems(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validatedData = validateInput(
        bulkRemoveWishlistItemsSchema,
        req.body
      ) as BulkRemoveWishlistItemsInput;
      const userId = req.user!.id;

      const result = await this.wishlistService.bulkRemoveWishlistItems(
        userId,
        validatedData.wishlistItemIds
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Failed to bulk remove wishlist items:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to bulk remove wishlist items',
        ...(error.details && { details: error.details }),
      });
    }
  }

  /**
   * Move items between wishlists
   */
  async moveItemsBetweenWishlists(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validatedData = validateInput(
        moveWishlistItemsSchema,
        req.body
      ) as MoveWishlistItemsInput;
      const userId = req.user!.id;

      const result = await this.wishlistService.moveWishlistItems(userId, {
        itemIds: validatedData.itemIds,
        targetWishlistId: validatedData.targetWishlistId,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Failed to move items between wishlists:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to move items between wishlists',
        ...(error.details && { details: error.details }),
      });
    }
  }

  /**
   * Copy items from cart to wishlist
   */
  async copyFromCart(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validatedData = validateInput(copyFromCartSchema, req.body) as CopyFromCartInput;
      const userId = req.user!.id;

      const result = await this.wishlistService.copyFromCart(userId, validatedData);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Failed to copy items from cart:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to copy items from cart',
        ...(error.details && { details: error.details }),
      });
    }
  }

  /**
   * Check if product is in any wishlist
   */
  async isProductInWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { productId } = validateInput(productParamsSchema, req.params) as { productId: number };
      const userId = req.user!.id;

      const result = await this.wishlistService.isProductInWishlist(userId, productId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Failed to check product in wishlist:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to check product in wishlist',
      });
    }
  }
}
