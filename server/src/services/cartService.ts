import {
  CartRepository,
  CartItemRepository,
  CreateCartItemData,
  UpdateCartItemData,
} from '../repositories/cartRepository';
import { ProductRepository } from '../repositories/productRepository';
import { WishlistRepository, WishlistItemRepository } from '../repositories/wishlistRepository';
import { Cart, CartItem, Product } from '../models';
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
import { WishlistService } from './wishlistService';
import { AppError } from '../types/errors';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface BulkUpdateItem {
  cartItemId: number;
  quantity: number;
}

export interface MoveToWishlistData {
  cartItemIds: number[];
  wishlistId?: number;
}

export class CartService {
  private cartRepository: CartRepository;
  private cartItemRepository: CartItemRepository;
  private productRepository: ProductRepository;
  private wishlistRepository: WishlistRepository;
  private wishlistItemRepository: WishlistItemRepository;
  private wishlistService: WishlistService;

  constructor() {
    this.cartRepository = new CartRepository();
    this.cartItemRepository = new CartItemRepository();
    this.productRepository = new ProductRepository();
    this.wishlistRepository = new WishlistRepository();
    this.wishlistItemRepository = new WishlistItemRepository();
    this.wishlistService = new WishlistService();
  }

  /**
   * Get or create user's cart
   */
  async getUserCart(userId: number): Promise<any> {
    try {
      logger.debug(`Getting cart for user ${userId}`);

      let cart = await this.cartRepository.findByUserId(userId);

      if (!cart) {
        cart = await this.cartRepository.create({ userId });
        logger.info(`Created new cart for user ${userId}`);
      }

      return cart;
    } catch (error) {
      logger.error('Failed to get user cart:', error);
      throw error;
    }
  }

  /**
   * Add item to cart
   */
  async addItemToCart(userId: number, itemData: CreateCartItemData): Promise<any> {
    try {
      logger.debug(`Adding item to cart for user ${userId}:`, itemData);

      // Get or create user's cart
      const cart = await this.cartRepository.findOrCreateByUserId(userId);

      // Validate product exists and is available
      const product = await this.productRepository.findByIdWithDetails(itemData.productId);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      if (product.status !== 'active') {
        throw new AppError('Product is not available', 400);
      }

      if (product.stockQuantity < itemData.quantity) {
        throw new AppError('Insufficient stock', 400);
      }

      // Check if item already exists in cart
      const existingItem = await this.cartItemRepository.findByCartAndProduct(
        cart.id,
        itemData.productId
      );

      if (existingItem) {
        // Update quantity instead of creating new item
        const newQuantity = existingItem.quantity + itemData.quantity;

        if (product.stockQuantity < newQuantity) {
          throw new AppError('Insufficient stock for requested quantity', 400);
        }

        const updatedItem = await this.cartItemRepository.updateCartItem(existingItem.id, {
          quantity: newQuantity,
        });

        logger.info(`Updated cart item ${existingItem.id} quantity to ${newQuantity}`);
        return updatedItem;
      }

      // Create new cart item
      const cartItem = await this.cartItemRepository.createCartItem({
        cartId: cart.id,
        productId: itemData.productId,
        quantity: itemData.quantity,
      });

      logger.info(`Added new item to cart: ${cartItem.id}`);
      return cartItem;
    } catch (error) {
      logger.error('Failed to add item to cart:', error);
      throw error;
    }
  }

  /**
   * Get cart items with pagination
   */
  async getCartItems(userId: number, pagination: PaginationParams = {}) {
    try {
      logger.debug(`Getting cart items for user ${userId}`, pagination);

      const cart = await this.getUserCart(userId);
      const items = await this.cartItemRepository.findByCartId(cart.id);

      // Apply pagination manually if needed
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;
      const paginatedItems = items.slice(offset, offset + limit);

      const result = {
        items: paginatedItems.map(item => this.formatCartItem(item)),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(items.length / limit),
          totalItems: items.length,
          itemsPerPage: limit,
        },
      };

      logger.debug(`Retrieved ${result.items.length} cart items`);
      return result;
    } catch (error) {
      logger.error('Failed to get cart items:', error);
      throw error;
    }
  }

  /**
   * Update cart item
   */
  async updateCartItem(
    userId: number,
    cartItemId: number,
    updateData: UpdateCartItemData
  ): Promise<any> {
    try {
      logger.debug(`Updating cart item ${cartItemId} for user ${userId}:`, updateData);

      // Get cart item and verify ownership
      const cartItem = await this.cartItemRepository.findByPk(cartItemId);
      if (!cartItem) {
        throw new AppError('Cart item not found', 404);
      }

      // Verify user owns this cart item
      const cart = await this.cartRepository.findByPk(cartItem.cartId);
      if (!cart || cart.userId !== userId) {
        throw new AppError('Cart item not found', 404);
      }

      // Validate stock if quantity is being updated
      if (updateData.quantity && cartItem.product) {
        if (cartItem.product.stockQuantity < updateData.quantity) {
          throw new AppError('Insufficient stock', 400);
        }

        // Check if product is still available
        if (cartItem.product.status !== 'active') {
          throw new AppError('Product is no longer available', 400);
        }
      }

      const updatedItem = await this.cartItemRepository.updateCartItem(cartItemId, updateData);

      logger.info(`Updated cart item ${cartItemId}`);
      return updatedItem;
    } catch (error) {
      logger.error('Failed to update cart item:', error);
      throw error;
    }
  }

  /**
   * Remove cart item
   */
  async removeCartItem(userId: number, cartItemId: number): Promise<void> {
    try {
      logger.debug(`Removing cart item ${cartItemId} for user ${userId}`);

      // Get cart item and verify ownership
      const cartItem = await this.cartItemRepository.findByPk(cartItemId);
      if (!cartItem) {
        throw new AppError('Cart item not found', 404);
      }

      // Verify user owns this cart item
      const cart = await this.cartRepository.findByPk(cartItem.cartId);
      if (!cart || cart.userId !== userId) {
        throw new AppError('Cart item not found', 404);
      }

      await this.cartItemRepository.removeCartItem(cartItemId);

      logger.info(`Removed cart item ${cartItemId}`);
    } catch (error) {
      logger.error('Failed to remove cart item:', error);
      throw error;
    }
  }

  /**
   * Clear all items from cart
   */
  async clearCart(userId: number): Promise<void> {
    try {
      logger.debug(`Clearing cart for user ${userId}`);

      const cart = await this.getUserCart(userId);
      await this.cartRepository.clearCart(cart.id);

      logger.info(`Cleared cart for user ${userId}`);
    } catch (error) {
      logger.error('Failed to clear cart:', error);
      throw error;
    }
  }

  /**
   * Get cart summary (totals, counts)
   */
  async getCartSummary(userId: number) {
    try {
      logger.debug(`Getting cart summary for user ${userId}`);

      const cart = await this.getUserCart(userId);
      const total = await this.cartRepository.getCartTotal(cart.id);
      const itemCount = await this.cartItemRepository.getCartItemsCount(cart.id);

      const summary = {
        itemCount,
        subtotal: total,
        total: total,
        cartId: cart.id,
      };

      logger.debug(`Cart summary for user ${userId}:`, summary);
      return summary;
    } catch (error) {
      logger.error('Failed to get cart summary:', error);
      throw error;
    }
  }

  /**
   * Bulk update cart items
   */
  async bulkUpdateCartItems(userId: number, items: BulkUpdateItem[]): Promise<any> {
    try {
      logger.debug(`Bulk updating cart items for user ${userId}:`, items);

      const cart = await this.getUserCart(userId);

      // Validate all items belong to user and check stock
      const cartItemIds = items.map(item => item.cartItemId);
      const cartItems = [];

      // Get cart items individually since getByIds doesn't exist
      for (const itemId of cartItemIds) {
        const cartItem = await this.cartItemRepository.findByPk(itemId);
        if (cartItem) {
          cartItems.push(cartItem);
        }
      }

      if (cartItems.length !== items.length) {
        throw new AppError('One or more cart items not found', 404);
      }

      // Verify ownership and validate stock
      for (const cartItem of cartItems) {
        if (cartItem.cartId !== cart.id) {
          throw new AppError('Cart item not found', 404);
        }

        const updateItem = items.find(item => item.cartItemId === cartItem.id);
        if (updateItem && cartItem.product) {
          if (cartItem.product.stockQuantity < updateItem.quantity) {
            throw new AppError(`Insufficient stock for product: ${cartItem.product.name}`, 400);
          }

          // Check if product is still available
          if (cartItem.product.status !== 'active') {
            throw new AppError(`Product is no longer available: ${cartItem.product.name}`, 400);
          }
        }
      }

      // Perform bulk update manually
      const updatedItems = [];
      for (const item of items) {
        const updatedItem = await this.cartItemRepository.updateCartItem(item.cartItemId, {
          quantity: item.quantity,
        });
        if (updatedItem) {
          updatedItems.push(updatedItem);
        }
      }

      const result = { updated: updatedItems.length, items: updatedItems };

      logger.info(`Bulk updated ${result.updated} cart items for user ${userId}`);
      return result;
    } catch (error) {
      logger.error('Failed to bulk update cart items:', error);
      throw error;
    }
  }

  /**
   * Remove multiple cart items
   */
  async bulkRemoveCartItems(userId: number, cartItemIds: number[]) {
    try {
      logger.debug(`Bulk removing cart items for user ${userId}:`, cartItemIds);

      const cart = await this.getUserCart(userId);

      // Verify all items belong to user
      const cartItems = [];
      for (const itemId of cartItemIds) {
        const cartItem = await this.cartItemRepository.findByPk(itemId);
        if (cartItem) {
          cartItems.push(cartItem);
        }
      }

      for (const cartItem of cartItems) {
        if (cartItem.cartId !== cart.id) {
          throw new AppError('Cart item not found', 404);
        }
      }

      // Perform bulk delete manually
      let deletedCount = 0;
      for (const itemId of cartItemIds) {
        const success = await this.cartItemRepository.removeCartItem(itemId);
        if (success) {
          deletedCount++;
        }
      }

      const result = { deleted: deletedCount };

      logger.info(`Bulk removed ${result.deleted} cart items for user ${userId}`);
      return result;
    } catch (error) {
      logger.error('Failed to bulk remove cart items:', error);
      throw error;
    }
  }

  /**
   * Move cart items to wishlist
   */
  async moveToWishlist(userId: number, moveData: MoveToWishlistData): Promise<any> {
    try {
      logger.debug(`Moving cart items to wishlist for user ${userId}:`, moveData);

      const cart = await this.getUserCart(userId);

      // Verify cart items belong to user
      const cartItems = [];
      for (const itemId of moveData.cartItemIds) {
        const cartItem = await this.cartItemRepository.findByPk(itemId);
        if (cartItem) {
          cartItems.push(cartItem);
        }
      }

      for (const cartItem of cartItems) {
        if (cartItem.cartId !== cart.id) {
          throw new AppError('Cart item not found', 404);
        }
      }

      // Get target wishlist or default wishlist
      let targetWishlistId = moveData.wishlistId;
      if (!targetWishlistId) {
        const defaultWishlist = await this.wishlistService.getDefaultWishlist(userId);
        targetWishlistId = defaultWishlist.id;
      }

      // Add items to wishlist
      const addedItems = [];
      const errors = [];

      for (const cartItem of cartItems) {
        try {
          const wishlistItem = await this.wishlistService.addItemToWishlist(userId, {
            wishlistId: targetWishlistId!,
            productId: cartItem.productId,
          });

          addedItems.push({
            wishlistItemId: wishlistItem.id,
            productId: cartItem.productId,
            productName: cartItem.product?.name || 'Unknown Product',
            addedAt: wishlistItem.createdAt, // Use createdAt instead of addedAt
          });
        } catch (error: any) {
          // If item already exists in wishlist, skip but don't error
          if (error.message?.includes('already exists')) {
            continue;
          }
          errors.push({
            cartItemId: cartItem.id,
            productId: cartItem.productId,
            error: error.message,
          });
        }
      }

      // Remove items from cart
      for (const itemId of moveData.cartItemIds) {
        await this.cartItemRepository.removeCartItem(itemId);
      }

      const result = {
        moved: addedItems.length,
        errors: errors.length,
        addedItems,
        ...(errors.length > 0 && { errorDetails: errors }),
      };

      logger.info(`Moved ${addedItems.length} items to wishlist for user ${userId}`);
      return result;
    } catch (error) {
      logger.error('Failed to move items to wishlist:', error);
      throw error;
    }
  }

  /**
   * Validate cart items (check stock, availability)
   */
  async validateCartItems(userId: number): Promise<any> {
    try {
      logger.debug(`Validating cart items for user ${userId}`);

      const cart = await this.getUserCart(userId);
      const cartItems = await this.cartItemRepository.findByCartId(cart.id);

      const validItems = [];
      const invalidItems = [];

      for (const item of cartItems) {
        if (!item.product) {
          invalidItems.push({
            cartItemId: item.id,
            productId: item.productId,
            issue: 'Product not found',
            quantity: item.quantity,
          });
          continue;
        }

        const issues = [];

        if (item.product.status !== 'active') {
          issues.push('Product is no longer available');
        }

        if (item.product.stockQuantity < item.quantity) {
          issues.push(`Insufficient stock (available: ${item.product.stockQuantity})`);
        }

        if (issues.length > 0) {
          invalidItems.push({
            cartItemId: item.id,
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            availableStock: item.product.stockQuantity,
            issues,
          });
        } else {
          validItems.push({
            cartItemId: item.id,
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            subtotal: item.product.price * item.quantity,
          });
        }
      }

      const validation = {
        valid: invalidItems.length === 0,
        validItems,
        invalidItems,
        summary: {
          totalItems: cartItems.length,
          validItems: validItems.length,
          invalidItems: invalidItems.length,
        },
      };

      logger.debug(`Cart validation for user ${userId}:`, validation.summary);
      return validation;
    } catch (error) {
      logger.error('Failed to validate cart items:', error);
      throw error;
    }
  }

  /**
   * Helper method to format cart item data
   */
  private formatCartItem(cartItem: any) {
    if (!cartItem.product) {
      return {
        id: cartItem.id,
        cartId: cartItem.cartId,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        addedAt: cartItem.addedAt,
        updatedAt: cartItem.updatedAt,
        product: null,
        subtotal: 0,
      };
    }

    return {
      id: cartItem.id,
      cartId: cartItem.cartId,
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      addedAt: cartItem.addedAt,
      updatedAt: cartItem.updatedAt,
      product: {
        id: cartItem.product.id,
        name: cartItem.product.name,
        price: cartItem.product.price,
        sku: cartItem.product.sku,
        stockQuantity: cartItem.product.stockQuantity,
        slug: cartItem.product.slug,
        status: cartItem.product.status,
        weight: cartItem.product.weight,
        dimensions: cartItem.product.dimensions,
        seller: cartItem.product.seller
          ? {
              id: cartItem.product.seller.id,
              firstName: cartItem.product.seller.firstName,
              lastName: cartItem.product.seller.lastName,
            }
          : null,
      },
      subtotal: cartItem.product.price * cartItem.quantity,
    };
  }
}
