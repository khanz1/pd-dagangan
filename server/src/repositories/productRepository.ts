import {
  BaseRepository,
  RepositoryOptions,
  PaginationOptions,
  PaginationResult,
} from './baseRepository';
import { Product, Category, User, SellerProfile } from '@/models';
import { ProductStatus } from '@/types';
import { Op } from 'sequelize';

export interface ProductFilters {
  sellerId?: number;
  categoryId?: number;
  status?: ProductStatus;
  search?: string; // Search in name, description, sku
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface CreateProductData {
  sellerId: number;
  name: string;
  description?: string;
  price: number;
  sku: string;
  stockQuantity: number;
  weight?: number;
  dimensions?: string;
  categoryIds?: number[];
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  sku?: string;
  stockQuantity?: number;
  weight?: number;
  dimensions?: string;
  status?: ProductStatus;
  categoryIds?: number[];
  slug?: string;
}

export class ProductRepository extends BaseRepository<Product> {
  constructor() {
    super(Product);
  }

  /**
   * Find product by SKU
   */
  async findBySku(sku: string, options?: RepositoryOptions): Promise<Product | null> {
    return this.findOne({
      where: { sku },
      include: [
        {
          model: Category,
          as: 'categories',
          through: { attributes: [] },
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          include: [
            {
              model: SellerProfile,
              as: 'sellerProfile',
              attributes: ['balance'],
            },
          ],
        },
      ],
      ...options,
    });
  }

  /**
   * Find product by slug
   */
  async findBySlug(slug: string, options?: RepositoryOptions): Promise<Product | null> {
    return this.findOne({
      where: { slug },
      include: [
        {
          model: Category,
          as: 'categories',
          through: { attributes: [] },
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      ...options,
    });
  }

  /**
   * Find product with full details including categories and seller
   */
  async findByIdWithDetails(id: number, options?: RepositoryOptions): Promise<Product | null> {
    return this.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'categories',
          through: { attributes: [] },
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      ...options,
    });
  }

  /**
   * Find products with pagination and filters
   */
  async findProductsWithFilters(
    filters: ProductFilters = {},
    pagination: PaginationOptions = {},
    orderBy: any = [['createdAt', 'DESC']],
    options?: RepositoryOptions
  ): Promise<PaginationResult<Product>> {
    const { sellerId, categoryId, status, search, minPrice, maxPrice, inStock } = filters;
    const whereConditions: any = {};

    // Apply filters
    if (sellerId) {
      whereConditions.sellerId = sellerId;
    }

    if (status) {
      whereConditions.status = status;
    } else {
      // Default to active products only for public searches
      whereConditions.status = 'active';
    }

    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereConditions.price = {};
      if (minPrice !== undefined) {
        whereConditions.price[Op.gte] = minPrice;
      }
      if (maxPrice !== undefined) {
        whereConditions.price[Op.lte] = maxPrice;
      }
    }

    if (inStock) {
      whereConditions.stockQuantity = { [Op.gt]: 0 };
    }

    const includeConditions: any[] = [
      {
        model: Category,
        as: 'categories',
        through: { attributes: [] },
        ...(categoryId && {
          where: { id: categoryId },
          required: true,
        }),
      },
      {
        model: User,
        as: 'seller',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ];

    return this.findAndCountAll({
      where: whereConditions,
      include: includeConditions,
      order: orderBy,
      ...pagination,
      ...options,
    });
  }

  /**
   * Find products by category
   */
  async findByCategory(
    categoryId: number,
    pagination: PaginationOptions = {},
    options?: RepositoryOptions
  ): Promise<PaginationResult<Product>> {
    return this.findProductsWithFilters(
      { categoryId, status: 'active' },
      pagination,
      [['createdAt', 'DESC']],
      options
    );
  }

  /**
   * Find products by seller
   */
  async findBySeller(
    sellerId: number,
    pagination: PaginationOptions = {},
    options?: RepositoryOptions
  ): Promise<PaginationResult<Product>> {
    return this.findProductsWithFilters({ sellerId }, pagination, [['createdAt', 'DESC']], options);
  }

  /**
   * Create a new product
   */
  async createProduct(
    productData: CreateProductData,
    options?: RepositoryOptions
  ): Promise<Product> {
    const { categoryIds, ...productFields } = productData;

    // Generate slug from name
    const slug = this.generateSlug(productFields.name);

    const product = await this.create(
      {
        ...productFields,
        slug,
      },
      options
    );

    // Associate with categories if provided
    if (categoryIds && categoryIds.length > 0) {
      await product.setCategories(categoryIds, { transaction: options?.transaction });
    }

    // Reload with associations
    return this.findByIdWithDetails(product.id, options) as Promise<Product>;
  }

  /**
   * Update product
   */
  async updateProduct(
    id: number,
    updateData: UpdateProductData,
    options?: RepositoryOptions
  ): Promise<Product | null> {
    const { categoryIds, ...updateFields } = updateData;

    // Generate new slug if name is updated
    if (updateFields.name) {
      updateFields.slug = this.generateSlug(updateFields.name);
    }

    const [affectedCount] = await this.update(updateFields, {
      where: { id },
      ...options,
    });

    if (affectedCount === 0) {
      return null;
    }

    const product = await this.findByPk(id, options);
    if (!product) {
      return null;
    }

    // Update categories if provided
    if (categoryIds !== undefined) {
      await product.setCategories(categoryIds, { transaction: options?.transaction });
    }

    // Reload with associations
    return this.findByIdWithDetails(id, options) as Promise<Product>;
  }

  /**
   * Update product stock
   */
  async updateStock(id: number, newStock: number, options?: RepositoryOptions): Promise<boolean> {
    const [affectedCount] = await this.update(
      { stockQuantity: newStock },
      {
        where: { id },
        ...options,
      }
    );

    return affectedCount > 0;
  }

  /**
   * Check if SKU exists (excluding specific product ID)
   */
  async skuExists(sku: string, excludeId?: number): Promise<boolean> {
    const whereCondition: any = { sku };

    if (excludeId) {
      whereCondition.id = { [Op.ne]: excludeId };
    }

    const count = await this.count({
      where: whereCondition,
    });

    return count > 0;
  }

  /**
   * Get featured products (could be based on sales, ratings, etc.)
   */
  async getFeaturedProducts(limit: number = 10, options?: RepositoryOptions): Promise<Product[]> {
    return this.findAll({
      where: {
        status: 'active',
        stockQuantity: { [Op.gt]: 0 },
      },
      include: [
        {
          model: Category,
          as: 'categories',
          through: { attributes: [] },
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [['createdAt', 'DESC']], // Could be enhanced with sales data
      limit,
      ...options,
    });
  }

  /**
   * Generate URL-friendly slug from product name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .substring(0, 100); // Limit length
  }
}
