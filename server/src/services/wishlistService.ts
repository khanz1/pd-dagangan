import {
  WishlistRepository,
  WishlistItemRepository,
  CreateWishlistData,
  UpdateWishlistData,
  CreateWishlistItemData,
  WishlistFilters,
} from '../repositories/wishlistRepository';
import { ProductRepository } from '../repositories/productRepository';
import { CartRepository, CartItemRepository } from '../repositories/cartRepository';
import { Wishlist, WishlistItem, Product, Cart } from '../models';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError,
  ErrorMessages,
} from '../types/errors';
import { UserRole } from '../types';
import { sequelize } from '../config/database';
import { logger } from '../config/logger';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface MoveWishlistItemsData {
  itemIds: number[];
  targetWishlistId: number;
}

export interface CopyFromCartData {
  cartItemIds: number[];
  wishlistId?: number;
}

export class WishlistService {
  private wishlistRepository: WishlistRepository;
  private wishlistItemRepository: WishlistItemRepository;
  private productRepository: ProductRepository;
  private cartRepository: CartRepository;
  private cartItemRepository: CartItemRepository;

  constructor() {
    this.wishlistRepository = new WishlistRepository();
    this.wishlistItemRepository = new WishlistItemRepository();
    this.productRepository = new ProductRepository();
    this.cartRepository = new CartRepository();
    this.cartItemRepository = new CartItemRepository();
  }

  /**
   * Get all user's wishlists
   */
  async getUserWishlists(userId: number, pagination: PaginationParams = {}) {
    const { page = 1, limit = 20 } = pagination;

    const result = await this.wishlistRepository.findByUserId(userId, { page, limit });

    return {
      wishlists: result.rows.map(wishlist => this.formatWishlistResponse(wishlist)),
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.count,
        itemsPerPage: result.itemsPerPage,
      },
    };
  }

  /**
   * Get wishlist details by ID
   */
  async getWishlist(wishlistId: number, userId: number) {
    const wishlist = await this.wishlistRepository.findByPk(wishlistId, {
      include: [
        {
          model: WishlistItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: [
                'id',
                'name',
                'price',
                'sku',
                'stockQuantity',
                'slug',
                'status',
                'weight',
                'dimensions',
              ],
            },
          ],
        },
      ],
    });

    if (!wishlist) {
      throw new NotFoundError(ErrorMessages.WISHLIST_NOT_FOUND);
    }

    // Check if user owns wishlist or if it's public
    if (wishlist.userId !== userId && !wishlist.isPublic) {
      throw new ForbiddenError(ErrorMessages.ACCESS_DENIED);
    }

    return this.formatWishlistResponse(wishlist, true);
  }

  /**
   * Get default wishlist for user
   */
  async getDefaultWishlist(userId: number) {
    const wishlist = await this.wishlistRepository.findOrCreateDefaultByUserId(userId);
    return this.formatWishlistResponse(wishlist, true);
  }

  /**
   * Create new wishlist
   */
  async createWishlist(userId: number, wishlistData: CreateWishlistData) {
    // Check if user already has a wishlist with this name
    const existingWishlists = await this.wishlistRepository.findByUserId(userId);
    const nameExists = existingWishlists.rows.some(
      w => w.name.toLowerCase() === wishlistData.name.toLowerCase()
    );

    if (nameExists) {
      throw new ConflictError('Wishlist name already exists');
    }

    // Limit: max 10 wishlists per user
    if (existingWishlists.count >= 10) {
      throw new ValidationError([
        {
          field: 'userId',
          message: 'Maximum 10 wishlists allowed per user',
        },
      ]);
    }

    const wishlistWithUserId = {
      ...wishlistData,
      userId,
      isDefault: existingWishlists.count === 0, // First wishlist is default
    };

    const wishlist = await this.wishlistRepository.createWishlist(wishlistWithUserId);

    logger.info(`Wishlist created: ${wishlist.id} - ${wishlist.name} by user ${userId}`);

    return this.formatWishlistResponse(wishlist);
  }

  /**
   * Update wishlist
   */
  async updateWishlist(wishlistId: number, userId: number, updateData: UpdateWishlistData) {
    const existingWishlist = await this.wishlistRepository.findByPk(wishlistId);

    if (!existingWishlist) {
      throw new NotFoundError(ErrorMessages.WISHLIST_NOT_FOUND);
    }

    // Check ownership
    if (existingWishlist.userId !== userId) {
      throw new ForbiddenError(ErrorMessages.ACCESS_DENIED);
    }

    // Check name uniqueness if being updated
    if (updateData.name && updateData.name !== existingWishlist.name) {
      const userWishlists = await this.wishlistRepository.findByUserId(userId);
      const nameExists = userWishlists.rows.some(
        w => w.id !== wishlistId && w.name.toLowerCase() === updateData.name!.toLowerCase()
      );

      if (nameExists) {
        throw new ConflictError('Wishlist name already exists');
      }
    }

    const updatedWishlist = await this.wishlistRepository.updateWishlist(wishlistId, updateData);

    if (!updatedWishlist) {
      throw new NotFoundError(ErrorMessages.WISHLIST_NOT_FOUND);
    }

    logger.info(`Wishlist updated: ${wishlistId} by user ${userId}`);

    return this.formatWishlistResponse(updatedWishlist, true);
  }

  /**
   * Delete wishlist
   */
  async deleteWishlist(wishlistId: number, userId: number) {
    const wishlist = await this.wishlistRepository.findByPk(wishlistId);

    if (!wishlist) {
      throw new NotFoundError(ErrorMessages.WISHLIST_NOT_FOUND);
    }

    // Check ownership
    if (wishlist.userId !== userId) {
      throw new ForbiddenError(ErrorMessages.ACCESS_DENIED);
    }

    // Cannot delete default wishlist if it's the only one
    if (wishlist.isDefault) {
      const userWishlists = await this.wishlistRepository.findByUserId(userId);
      if (userWishlists.count === 1) {
        throw new ValidationError([
          {
            field: 'wishlistId',
            message: 'Cannot delete the only wishlist',
          },
        ]);
      }

      // If deleting default wishlist, make another one default
      const otherWishlist = userWishlists.rows.find(w => w.id !== wishlistId);
      if (otherWishlist) {
        await this.wishlistRepository.updateWishlist(otherWishlist.id, { isDefault: true });
      }
    }

    await this.wishlistRepository.deleteWishlist(wishlistId);

    logger.info(`Wishlist deleted: ${wishlistId} by user ${userId}`);
  }

  /**
   * Add item to wishlist
   */
  async addItemToWishlist(userId: number, itemData: CreateWishlistItemData): Promise<any> {
    // Get target wishlist or default
    let wishlist;
    if (itemData.wishlistId) {
      wishlist = await this.wishlistRepository.findByPk(itemData.wishlistId);
      if (!wishlist || wishlist.userId !== userId) {
        throw new NotFoundError(ErrorMessages.WISHLIST_NOT_FOUND);
      }
    } else {
      wishlist = await this.wishlistRepository.findOrCreateDefaultByUserId(userId);
    }

    // Validate product exists
    const product = await this.productRepository.findByPk(itemData.productId);
    if (!product) {
      throw new NotFoundError(ErrorMessages.PRODUCT_NOT_FOUND);
    }

    // Check if item already exists in wishlist
    const existingItem = await this.wishlistItemRepository.findByWishlistAndProduct(
      wishlist.id,
      itemData.productId
    );

    if (existingItem) {
      throw new ConflictError(ErrorMessages.ITEM_ALREADY_IN_WISHLIST);
    }

    // Check wishlist item limit (max 200 items per wishlist)
    const currentItemCount = await this.wishlistRepository.getWishlistItemCount(wishlist.id);
    if (currentItemCount >= 200) {
      throw new ValidationError([
        {
          field: 'wishlistId',
          message: 'Maximum 200 items allowed per wishlist',
        },
      ]);
    }

    const wishlistItem = await this.wishlistItemRepository.createWishlistItem({
      wishlistId: wishlist.id,
      productId: itemData.productId,
    });

    logger.info(
      `Item added to wishlist: User ${userId}, Product ${itemData.productId}, Wishlist ${wishlist.id}`
    );

    return this.formatWishlistItemResponse(wishlistItem);
  }

  /**
   * Get wishlist items with pagination
   */
  async getWishlistItems(
    wishlistId: number,
    userId: number,
    pagination: PaginationParams = {}
  ): Promise<any> {
    const { page = 1, limit = 20 } = pagination;

    // Verify access to wishlist
    const wishlist = await this.wishlistRepository.findByPk(wishlistId);
    if (!wishlist) {
      throw new NotFoundError(ErrorMessages.WISHLIST_NOT_FOUND);
    }

    // Check if user owns wishlist or if it's public
    if (wishlist.userId !== userId && !wishlist.isPublic) {
      throw new ForbiddenError(ErrorMessages.ACCESS_DENIED);
    }

    const result = await this.wishlistItemRepository.findByWishlistId(wishlistId, { page, limit });

    return {
      items: result.rows.map(item => this.formatWishlistItemResponse(item)),
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.count,
        itemsPerPage: result.itemsPerPage,
      },
    };
  }

  /**
   * Remove item from wishlist
   */
  async removeWishlistItem(userId: number, wishlistItemId: number) {
    const wishlistItem = await this.wishlistItemRepository.findByPk(wishlistItemId, {
      include: [
        {
          model: Wishlist,
          as: 'wishlist',
          where: { userId },
        },
      ],
    });

    if (!wishlistItem) {
      throw new NotFoundError(ErrorMessages.WISHLIST_ITEM_NOT_FOUND);
    }

    await this.wishlistItemRepository.removeWishlistItem(wishlistItemId);

    logger.info(`Wishlist item removed: ${wishlistItemId} by user ${userId}`);
  }

  /**
   * Remove product from wishlist (by product ID)
   */
  async removeProductFromWishlist(userId: number, productId: number, wishlistId?: number) {
    if (wishlistId) {
      // Remove from specific wishlist
      const wishlist = await this.wishlistRepository.findByPk(wishlistId);
      if (!wishlist || wishlist.userId !== userId) {
        throw new NotFoundError(ErrorMessages.WISHLIST_NOT_FOUND);
      }

      const success = await this.wishlistItemRepository.removeByWishlistAndProduct(
        wishlistId,
        productId
      );

      if (!success) {
        throw new NotFoundError(ErrorMessages.WISHLIST_ITEM_NOT_FOUND);
      }
    } else {
      // Remove from all user's wishlists
      const userWishlists = await this.wishlistRepository.findByUserId(userId);
      let removed = false;

      for (const wishlist of userWishlists.rows) {
        const success = await this.wishlistItemRepository.removeByWishlistAndProduct(
          wishlist.id,
          productId
        );
        if (success) {
          removed = true;
        }
      }

      if (!removed) {
        throw new NotFoundError(ErrorMessages.WISHLIST_ITEM_NOT_FOUND);
      }
    }

    logger.info(
      `Product ${productId} removed from wishlist${wishlistId ? ` ${wishlistId}` : 's'} by user ${userId}`
    );
  }

  /**
   * Bulk remove wishlist items
   */
  async bulkRemoveWishlistItems(userId: number, wishlistItemIds: number[]) {
    const transaction = await sequelize.transaction();

    try {
      let removedCount = 0;

      for (const itemId of wishlistItemIds) {
        // Verify ownership before removal
        const wishlistItem = await this.wishlistItemRepository.findByPk(itemId, {
          include: [
            {
              model: Wishlist,
              as: 'wishlist',
              where: { userId },
            },
          ],
          transaction,
        });

        if (wishlistItem) {
          const success = await this.wishlistItemRepository.removeWishlistItem(itemId, {
            transaction,
          });
          if (success) {
            removedCount++;
          }
        }
      }

      await transaction.commit();

      logger.info(`Bulk removed ${removedCount} wishlist items for user ${userId}`);

      return { removedCount, totalRequested: wishlistItemIds.length };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Move items between wishlists
   */
  async moveWishlistItems(userId: number, moveData: MoveWishlistItemsData) {
    // Verify target wishlist exists and is owned by user
    const targetWishlist = await this.wishlistRepository.findByPk(moveData.targetWishlistId);
    if (!targetWishlist || targetWishlist.userId !== userId) {
      throw new NotFoundError(ErrorMessages.WISHLIST_NOT_FOUND);
    }

    const transaction = await sequelize.transaction();

    try {
      let movedCount = 0;
      const movedItems: any[] = [];

      for (const itemId of moveData.itemIds) {
        // Get item with ownership verification
        const wishlistItem = await this.wishlistItemRepository.findByPk(itemId, {
          include: [
            {
              model: Wishlist,
              as: 'wishlist',
              where: { userId },
            },
            {
              model: Product,
              as: 'product',
            },
          ],
          transaction,
        });

        if (!wishlistItem) {
          continue; // Skip if not found or not owned
        }

        // Check if product already exists in target wishlist
        const existsInTarget = await this.wishlistItemRepository.findByWishlistAndProduct(
          moveData.targetWishlistId,
          wishlistItem.productId,
          { transaction }
        );

        if (existsInTarget) {
          // Remove from source only (since it already exists in target)
          await this.wishlistItemRepository.removeWishlistItem(itemId, { transaction });
        } else {
          // Create in target and remove from source
          const newItem = await this.wishlistItemRepository.createWishlistItem(
            {
              wishlistId: moveData.targetWishlistId,
              productId: wishlistItem.productId,
            },
            { transaction }
          );

          await this.wishlistItemRepository.removeWishlistItem(itemId, { transaction });

          movedItems.push({
            productId: wishlistItem.productId,
            productName: wishlistItem.product?.name || 'Unknown Product',
            newWishlistItemId: newItem.id,
          });
        }

        movedCount++;
      }

      await transaction.commit();

      logger.info(`Moved ${movedCount} items between wishlists for user ${userId}`);

      return {
        movedCount,
        totalRequested: moveData.itemIds.length,
        movedItems,
        targetWishlistId: moveData.targetWishlistId,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Copy items from cart to wishlist
   */
  async copyFromCart(userId: number, copyData: CopyFromCartData): Promise<any> {
    // Get or create target wishlist
    let wishlist;
    if (copyData.wishlistId) {
      wishlist = await this.wishlistRepository.findByPk(copyData.wishlistId);
      if (!wishlist || wishlist.userId !== userId) {
        throw new NotFoundError(ErrorMessages.WISHLIST_NOT_FOUND);
      }
    } else {
      wishlist = await this.wishlistRepository.findOrCreateDefaultByUserId(userId);
    }

    const transaction = await sequelize.transaction();

    try {
      let copiedCount = 0;
      const copiedItems: any[] = [];

      for (const cartItemId of copyData.cartItemIds) {
        // Get cart item with ownership verification
        const cartItem = await this.cartItemRepository.findByPk(cartItemId, {
          include: [
            {
              model: Cart,
              as: 'cart',
              where: { userId },
            },
            {
              model: Product,
              as: 'product',
            },
          ],
          transaction,
        });

        if (!cartItem) {
          continue; // Skip if not found or not owned
        }

        // Check if product already exists in wishlist
        const existsInWishlist = await this.wishlistItemRepository.findByWishlistAndProduct(
          wishlist.id,
          cartItem.productId,
          { transaction }
        );

        if (!existsInWishlist) {
          // Add to wishlist
          const wishlistItem = await this.wishlistItemRepository.createWishlistItem(
            {
              wishlistId: wishlist.id,
              productId: cartItem.productId,
            },
            { transaction }
          );

          copiedItems.push({
            productId: cartItem.productId,
            productName: cartItem.product?.name || 'Unknown Product',
            wishlistItemId: wishlistItem.id,
          });

          copiedCount++;
        }
      }

      await transaction.commit();

      logger.info(`Copied ${copiedCount} items from cart to wishlist for user ${userId}`);

      return {
        copiedCount,
        totalRequested: copyData.cartItemIds.length,
        copiedItems,
        wishlistId: wishlist.id,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Check if product exists in user's wishlists
   */
  async isProductInWishlist(userId: number, productId: number): Promise<any> {
    const userWishlists = await this.wishlistRepository.findByUserId(userId);
    const wishlistIds = userWishlists.rows.map(w => w.id);

    if (wishlistIds.length === 0) {
      return {
        inWishlist: false,
        wishlists: [],
      };
    }

    const wishlistItems = await this.wishlistItemRepository.findByProductAndWishlists(
      productId,
      wishlistIds
    );

    return {
      inWishlist: wishlistItems.length > 0,
      wishlists: wishlistItems.map(item => ({
        wishlistId: item.wishlistId,
        wishlistItemId: item.id,
      })),
    };
  }

  /**
   * Format wishlist response for API
   */
  private formatWishlistResponse(wishlist: Wishlist, includeItems: boolean = false) {
    const formatted: any = {
      id: wishlist.id,
      name: wishlist.name,
      isDefault: wishlist.isDefault,
      isPublic: wishlist.isPublic,
      itemCount: wishlist.items?.length || 0,
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt,
    };

    if (includeItems && wishlist.items) {
      formatted.items = wishlist.items.map(item => this.formatWishlistItemResponse(item));
    }

    return formatted;
  }

  /**
   * Format wishlist item response for API
   */
  private formatWishlistItemResponse(wishlistItem: WishlistItem) {
    if (!wishlistItem.product) {
      return {
        id: wishlistItem.id,
        wishlistId: wishlistItem.wishlistId,
        product: null,
        createdAt: wishlistItem.createdAt,
        updatedAt: wishlistItem.updatedAt,
      };
    }

    return {
      id: wishlistItem.id,
      wishlistId: wishlistItem.wishlistId,
      product: {
        id: wishlistItem.product.id,
        name: wishlistItem.product.name,
        price: wishlistItem.product.price,
        sku: wishlistItem.product.sku,
        stockQuantity: wishlistItem.product.stockQuantity,
        slug: wishlistItem.product.slug,
        status: wishlistItem.product.status,
        weight: wishlistItem.product.weight,
        dimensions: wishlistItem.product.dimensions,
        seller: wishlistItem.product.seller
          ? {
              id: wishlistItem.product.seller.id,
              firstName: wishlistItem.product.seller.firstName,
              lastName: wishlistItem.product.seller.lastName,
            }
          : null,
      },
      createdAt: wishlistItem.createdAt,
      updatedAt: wishlistItem.updatedAt,
    };
  }
}
