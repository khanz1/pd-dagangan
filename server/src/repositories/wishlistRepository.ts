import {
  BaseRepository,
  RepositoryOptions,
  PaginationOptions,
  PaginationResult,
} from './baseRepository';
import { Wishlist, WishlistItem, Product, User } from '@/models';
import { Op } from 'sequelize';

export interface CreateWishlistData {
  userId: number;
  name: string;
  isDefault?: boolean;
  isPublic?: boolean;
}

export interface UpdateWishlistData {
  name?: string;
  isDefault?: boolean;
  isPublic?: boolean;
}

export interface CreateWishlistItemData {
  wishlistId: number;
  productId: number;
}

export interface WishlistFilters {
  userId?: number;
  isPublic?: boolean;
  name?: string;
}

export class WishlistRepository extends BaseRepository<Wishlist> {
  constructor() {
    super(Wishlist);
  }

  /**
   * Find all wishlists for a user
   */
  async findByUserId(
    userId: number,
    pagination?: PaginationOptions,
    options?: RepositoryOptions
  ): Promise<PaginationResult<Wishlist>> {
    return this.findAndCountAll({
      where: { userId },
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
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      ...pagination,
      ...options,
    });
  }

  /**
   * Find default wishlist for user
   */
  async findDefaultByUserId(userId: number, options?: RepositoryOptions): Promise<Wishlist | null> {
    return this.findOne({
      where: { userId, isDefault: true },
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
   * Find or create default wishlist for user
   */
  async findOrCreateDefaultByUserId(
    userId: number,
    options?: RepositoryOptions
  ): Promise<Wishlist> {
    let wishlist = await this.findDefaultByUserId(userId, options);

    if (!wishlist) {
      wishlist = await this.create(
        {
          userId,
          name: 'My Wishlist',
          isDefault: true,
          isPublic: false,
        },
        options
      );

      // Reload with associations
      wishlist = (await this.findDefaultByUserId(userId, options)) as Wishlist;
    }

    return wishlist;
  }

  /**
   * Find public wishlists
   */
  async findPublicWishlists(
    pagination?: PaginationOptions,
    filters?: WishlistFilters,
    options?: RepositoryOptions
  ): Promise<PaginationResult<Wishlist>> {
    const where: any = { isPublic: true };

    if (filters?.name) {
      where.name = { [Op.iLike]: `%${filters.name}%` };
    }

    return this.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: WishlistItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price', 'slug', 'status'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      ...pagination,
      ...options,
    });
  }

  /**
   * Create wishlist
   */
  async createWishlist(
    wishlistData: CreateWishlistData,
    options?: RepositoryOptions
  ): Promise<Wishlist> {
    // If this is set as default, ensure no other wishlist is default for this user
    if (wishlistData.isDefault) {
      await this.update(
        { isDefault: false },
        {
          where: { userId: wishlistData.userId, isDefault: true },
          ...options,
        }
      );
    }

    const wishlist = await this.create(wishlistData, options);

    // Reload with associations
    return this.findByPk(wishlist.id, {
      include: [
        {
          model: WishlistItem,
          as: 'items',
        },
      ],
      ...options,
    }) as Promise<Wishlist>;
  }

  /**
   * Update wishlist
   */
  async updateWishlist(
    wishlistId: number,
    updateData: UpdateWishlistData,
    options?: RepositoryOptions
  ): Promise<Wishlist | null> {
    const [affectedCount] = await this.update(updateData, {
      where: { id: wishlistId },
      ...options,
    });

    if (affectedCount === 0) {
      return null;
    }

    return this.findByPk(wishlistId, {
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
      ...options,
    });
  }

  /**
   * Delete wishlist
   */
  async deleteWishlist(wishlistId: number, options?: RepositoryOptions): Promise<boolean> {
    // First clear all items
    await WishlistItem.destroy({
      where: { wishlistId },
      ...options,
    });

    // Then delete the wishlist
    const result = await this.model.destroy({
      where: { id: wishlistId },
      ...options,
    });

    return result > 0;
  }

  /**
   * Get wishlist item count
   */
  async getWishlistItemCount(wishlistId: number, options?: RepositoryOptions): Promise<number> {
    return WishlistItem.count({
      where: { wishlistId },
      ...options,
    });
  }

  /**
   * Check if user owns wishlist
   */
  async isOwner(wishlistId: number, userId: number, options?: RepositoryOptions): Promise<boolean> {
    const count = await this.count({
      where: { id: wishlistId, userId },
      ...options,
    });

    return count > 0;
  }
}

export class WishlistItemRepository extends BaseRepository<WishlistItem> {
  constructor() {
    super(WishlistItem);
  }

  /**
   * Find wishlist item by wishlist and product ID
   */
  async findByWishlistAndProduct(
    wishlistId: number,
    productId: number,
    options?: RepositoryOptions
  ): Promise<WishlistItem | null> {
    return this.findOne({
      where: { wishlistId, productId },
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
      ...options,
    });
  }

  /**
   * Find all items in a wishlist
   */
  async findByWishlistId(
    wishlistId: number,
    pagination?: PaginationOptions,
    options?: RepositoryOptions
  ): Promise<PaginationResult<WishlistItem>> {
    return this.findAndCountAll({
      where: { wishlistId },
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
      ...pagination,
      ...options,
    });
  }

  /**
   * Create wishlist item
   */
  async createWishlistItem(
    itemData: CreateWishlistItemData,
    options?: RepositoryOptions
  ): Promise<WishlistItem> {
    const wishlistItem = await this.create(itemData, options);

    // Reload with associations
    return this.findByWishlistAndProduct(
      itemData.wishlistId,
      itemData.productId,
      options
    ) as Promise<WishlistItem>;
  }

  /**
   * Remove wishlist item
   */
  async removeWishlistItem(wishlistItemId: number, options?: RepositoryOptions): Promise<boolean> {
    const result = await this.model.destroy({
      where: { id: wishlistItemId },
      ...options,
    });

    return result > 0;
  }

  /**
   * Remove wishlist item by wishlist and product
   */
  async removeByWishlistAndProduct(
    wishlistId: number,
    productId: number,
    options?: RepositoryOptions
  ): Promise<boolean> {
    const result = await this.model.destroy({
      where: { wishlistId, productId },
      ...options,
    });

    return result > 0;
  }

  /**
   * Check if item exists in wishlist
   */
  async existsInWishlist(
    wishlistId: number,
    productId: number,
    options?: RepositoryOptions
  ): Promise<boolean> {
    const count = await this.count({
      where: { wishlistId, productId },
      ...options,
    });

    return count > 0;
  }

  /**
   * Check if item exists in any of user's wishlists
   */
  async existsInUserWishlists(
    userId: number,
    productId: number,
    options?: RepositoryOptions
  ): Promise<boolean> {
    const count = await this.model.count({
      include: [
        {
          model: Wishlist,
          as: 'wishlist',
          where: { userId },
          attributes: [],
        },
      ],
      where: { productId },
      ...options,
    });

    return count > 0;
  }

  /**
   * Move item between wishlists
   */
  async moveToWishlist(
    itemId: number,
    newWishlistId: number,
    options?: RepositoryOptions
  ): Promise<WishlistItem | null> {
    const [affectedCount] = await this.update(
      { wishlistId: newWishlistId },
      {
        where: { id: itemId },
        ...options,
      }
    );

    if (affectedCount === 0) {
      return null;
    }

    return this.findByPk(itemId, {
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
   * Find wishlist items by product and wishlist IDs
   */
  async findByProductAndWishlists(
    productId: number,
    wishlistIds: number[],
    options?: RepositoryOptions
  ): Promise<WishlistItem[]> {
    return this.findAll({
      where: {
        productId,
        wishlistId: wishlistIds,
      },
      ...options,
    });
  }
}
