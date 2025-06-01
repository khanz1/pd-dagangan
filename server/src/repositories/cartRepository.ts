import {
  BaseRepository,
  RepositoryOptions,
  PaginationOptions,
  PaginationResult,
} from './baseRepository';
import { Cart, CartItem, Product, User } from '@/models';
import { Op } from 'sequelize';

export interface CreateCartData {
  userId: number;
}

export interface CreateCartItemData {
  cartId: number;
  productId: number;
  quantity: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

export interface CartFilters {
  userId?: number;
  productId?: number;
}

export class CartRepository extends BaseRepository<Cart> {
  constructor() {
    super(Cart);
  }

  /**
   * Find cart by user ID with items
   */
  async findByUserId(userId: number, options?: RepositoryOptions): Promise<Cart | null> {
    return this.findOne({
      where: { userId },
      include: [
        {
          model: CartItem,
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
              include: [
                {
                  model: User,
                  as: 'seller',
                  attributes: ['id', 'firstName', 'lastName'],
                },
              ],
            },
          ],
        },
      ],
      ...options,
    });
  }

  /**
   * Find or create cart for user
   */
  async findOrCreateByUserId(userId: number, options?: RepositoryOptions): Promise<Cart> {
    let cart = await this.findByUserId(userId, options);

    if (!cart) {
      cart = await this.create({ userId }, options);
      // Reload with associations
      cart = (await this.findByUserId(userId, options)) as Cart;
    }

    return cart;
  }

  /**
   * Get cart total value
   */
  async getCartTotal(cartId: number, options?: RepositoryOptions): Promise<number> {
    const cart = await this.findByPk(cartId, {
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['price'],
            },
          ],
        },
      ],
      ...options,
    });

    if (!cart || !cart.items) {
      return 0;
    }

    return cart.items.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  }

  /**
   * Get cart item count
   */
  async getCartItemCount(cartId: number, options?: RepositoryOptions): Promise<number> {
    const cart = await this.findByPk(cartId, {
      include: [
        {
          model: CartItem,
          as: 'items',
          attributes: ['quantity'],
        },
      ],
      ...options,
    });

    if (!cart || !cart.items) {
      return 0;
    }

    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Clear all items from cart
   */
  async clearCart(cartId: number, options?: RepositoryOptions): Promise<boolean> {
    const result = await CartItem.destroy({
      where: { cartId },
      ...options,
    });

    return result > 0;
  }

  /**
   * Delete cart
   */
  async deleteCart(cartId: number, options?: RepositoryOptions): Promise<boolean> {
    // First clear all items
    await this.clearCart(cartId, options);

    // Then delete the cart
    const result = await this.model.destroy({
      where: { id: cartId },
      ...options,
    });

    return result > 0;
  }
}

export class CartItemRepository extends BaseRepository<CartItem> {
  constructor() {
    super(CartItem);
  }

  /**
   * Find cart item by cart and product ID
   */
  async findByCartAndProduct(
    cartId: number,
    productId: number,
    options?: RepositoryOptions
  ): Promise<CartItem | null> {
    return this.findOne({
      where: { cartId, productId },
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
      ...options,
    });
  }

  /**
   * Find all items in a cart
   */
  async findByCartId(cartId: number, options?: RepositoryOptions): Promise<CartItem[]> {
    return this.findAll({
      where: { cartId },
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
          include: [
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'firstName', 'lastName'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      ...options,
    });
  }

  /**
   * Create cart item
   */
  async createCartItem(
    itemData: CreateCartItemData,
    options?: RepositoryOptions
  ): Promise<CartItem> {
    const cartItem = await this.create(itemData, options);

    // Reload with associations
    return this.findByCartAndProduct(
      itemData.cartId,
      itemData.productId,
      options
    ) as Promise<CartItem>;
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    cartItemId: number,
    updateData: UpdateCartItemData,
    options?: RepositoryOptions
  ): Promise<CartItem | null> {
    const [affectedCount] = await this.update(updateData, {
      where: { id: cartItemId },
      ...options,
    });

    if (affectedCount === 0) {
      return null;
    }

    return this.findByPk(cartItemId, {
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
      ...options,
    });
  }

  /**
   * Remove cart item
   */
  async removeCartItem(cartItemId: number, options?: RepositoryOptions): Promise<boolean> {
    const result = await this.model.destroy({
      where: { id: cartItemId },
      ...options,
    });

    return result > 0;
  }

  /**
   * Remove cart item by cart and product
   */
  async removeByCartAndProduct(
    cartId: number,
    productId: number,
    options?: RepositoryOptions
  ): Promise<boolean> {
    const result = await this.model.destroy({
      where: { cartId, productId },
      ...options,
    });

    return result > 0;
  }

  /**
   * Check if item exists in cart
   */
  async existsInCart(
    cartId: number,
    productId: number,
    options?: RepositoryOptions
  ): Promise<boolean> {
    const count = await this.count({
      where: { cartId, productId },
      ...options,
    });

    return count > 0;
  }

  /**
   * Get cart items count for user
   */
  async getCartItemsCount(cartId: number, options?: RepositoryOptions): Promise<number> {
    return this.count({
      where: { cartId },
      ...options,
    });
  }
}
