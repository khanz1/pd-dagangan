import {
  ProductRepository,
  ProductFilters,
  CreateProductData,
  UpdateProductData,
} from '@/repositories/productRepository';
import { CategoryRepository } from '@/repositories/categoryRepository';
import { UserRepository } from '@/repositories/userRepository';
import { InventoryLogRepository } from '@/repositories/inventoryLogRepository';
import { Product } from '@/models';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  ErrorMessages,
} from '@/types/errors';
import { UserRole } from '@/types';
import { sequelize } from '@/config/database';
import { logger } from '@/config/logger';

export interface PublicProductFilters {
  categoryId?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'priceAsc' | 'priceDesc' | 'rating' | 'newest';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export class ProductService {
  private productRepository: ProductRepository;
  private categoryRepository: CategoryRepository;
  private userRepository: UserRepository;
  private inventoryLogRepository: InventoryLogRepository;

  constructor() {
    this.productRepository = new ProductRepository();
    this.categoryRepository = new CategoryRepository();
    this.userRepository = new UserRepository();
    this.inventoryLogRepository = new InventoryLogRepository();
  }

  /**
   * Get featured products for homepage
   */
  async getFeaturedProducts(limit: number = 10) {
    const products = await this.productRepository.getFeaturedProducts(limit);

    return products.map(product => this.formatProductResponse(product, false));
  }

  /**
   * List products with filters and pagination (public endpoint)
   */
  async getPublicProducts(filters: PublicProductFilters = {}, pagination: PaginationParams = {}) {
    const { categoryId, search, minPrice, maxPrice, sort } = filters;
    const { page = 1, limit = 20 } = pagination;

    // Convert public filters to repository filters
    const repositoryFilters: ProductFilters = {
      status: 'active',
      inStock: true,
      categoryId,
      search,
      minPrice,
      maxPrice,
    };

    // Handle sorting
    let orderBy: any = [['createdAt', 'DESC']];
    switch (sort) {
      case 'priceAsc':
        orderBy = [['price', 'ASC']];
        break;
      case 'priceDesc':
        orderBy = [['price', 'DESC']];
        break;
      case 'newest':
        orderBy = [['createdAt', 'DESC']];
        break;
      case 'rating':
        // TODO: Implement when review system is ready
        orderBy = [['createdAt', 'DESC']];
        break;
    }

    const result = await this.productRepository.findProductsWithFilters(
      repositoryFilters,
      { page, limit },
      orderBy
    );

    return {
      products: result.rows.map(product => this.formatProductResponse(product, false)),
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.count,
        itemsPerPage: result.itemsPerPage,
      },
    };
  }

  /**
   * Get public product details by ID
   */
  async getPublicProduct(productId: number) {
    const product = await this.productRepository.findByIdWithDetails(productId);

    if (!product || product.status !== 'active') {
      throw new NotFoundError('Product not found');
    }

    return this.formatProductResponse(product, true);
  }

  /**
   * Get product details by ID (authenticated)
   */
  async getProduct(productId: number, userId: number, userRole: UserRole) {
    const product = await this.productRepository.findByIdWithDetails(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Check permissions
    if (userRole !== 'admin' && product.sellerId !== userId) {
      throw new ForbiddenError('You are not authorized to view this product');
    }

    return this.formatProductResponse(product, true);
  }

  /**
   * List products for seller/admin
   */
  async listProducts(
    userId: number,
    userRole: UserRole,
    filters: ProductFilters = {},
    pagination: PaginationParams = {}
  ) {
    const { page = 1, limit = 20 } = pagination;

    // Sellers can only see their own products
    if (userRole === 'seller') {
      filters.sellerId = userId;
    }

    const result = await this.productRepository.findProductsWithFilters(filters, { page, limit }, [
      ['createdAt', 'DESC'],
    ]);

    return {
      products: result.rows.map(product => this.formatProductResponse(product, true)),
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.count,
        itemsPerPage: result.itemsPerPage,
      },
    };
  }

  /**
   * Create a new product
   */
  async createProduct(productData: CreateProductData, userId: number, userRole: UserRole) {
    // Validate user permissions
    if (userRole !== 'seller' && userRole !== 'admin') {
      throw new ForbiddenError('Only sellers and admins can create products');
    }

    // For sellers, ensure they can only create products for themselves
    if (userRole === 'seller' && productData.sellerId !== userId) {
      throw new ForbiddenError('You can only create products for your own store');
    }

    // Validate seller exists and is active
    const seller = await this.userRepository.findByIdWithProfile(productData.sellerId);
    if (!seller || seller.status !== 'active' || seller.role !== 'seller') {
      throw new ValidationError([
        {
          field: 'sellerId',
          message: ErrorMessages.INVALID_SELLER_ID,
        },
      ]);
    }

    // Check if SKU already exists
    const existingSku = await this.productRepository.skuExists(productData.sku);
    if (existingSku) {
      throw new ConflictError('SKU already exists');
    }

    // Validate categories if provided
    if (productData.categoryIds && productData.categoryIds.length > 0) {
      const categories = await this.categoryRepository.findByIds(productData.categoryIds);
      if (categories.length !== productData.categoryIds.length) {
        throw new ValidationError([
          {
            field: 'categoryIds',
            message: ErrorMessages.ONE_OR_MORE_CATEGORY_IDS_ARE_INVALID,
          },
        ]);
      }
    }

    const transaction = await sequelize.transaction();

    try {
      // Create product
      const product = await this.productRepository.createProduct(productData, { transaction });

      // Log inventory creation
      await this.inventoryLogRepository.create(
        {
          productId: product.id,
          changeAmount: productData.stockQuantity,
          reason: 'initial_stock',
        },
        { transaction }
      );

      await transaction.commit();

      logger.info(`Product created: ${product.id} by user ${userId}`);

      return this.formatProductResponse(product, true);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update a product
   */
  async updateProduct(
    productId: number,
    updateData: UpdateProductData,
    userId: number,
    userRole: UserRole
  ) {
    const existingProduct = await this.productRepository.findByPk(productId);

    if (!existingProduct) {
      throw new NotFoundError('Product not found');
    }

    // Check permissions
    if (userRole !== 'admin' && existingProduct.sellerId !== userId) {
      throw new ForbiddenError('You are not authorized to update this product');
    }

    // Check SKU uniqueness if being updated
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const existingSku = await this.productRepository.skuExists(updateData.sku, productId);
      if (existingSku) {
        throw new ConflictError('SKU already exists');
      }
    }

    // Validate categories if provided
    if (updateData.categoryIds && updateData.categoryIds.length > 0) {
      const categories = await this.categoryRepository.findByIds(updateData.categoryIds);
      if (categories.length !== updateData.categoryIds.length) {
        throw new ValidationError([
          {
            field: 'categoryIds',
            message: ErrorMessages.ONE_OR_MORE_CATEGORY_IDS_ARE_INVALID,
          },
        ]);
      }
    }

    const transaction = await sequelize.transaction();

    try {
      // Log inventory change if stock is updated
      if (
        updateData.stockQuantity !== undefined &&
        updateData.stockQuantity !== existingProduct.stockQuantity
      ) {
        const changeAmount = updateData.stockQuantity - existingProduct.stockQuantity;
        await this.inventoryLogRepository.create(
          {
            productId,
            changeAmount,
            reason: changeAmount > 0 ? 'stock_increase' : 'stock_decrease',
          },
          { transaction }
        );
      }

      // Update product
      const updatedProduct = await this.productRepository.updateProduct(productId, updateData, {
        transaction,
      });

      await transaction.commit();

      if (!updatedProduct) {
        throw new NotFoundError('Product not found after update');
      }

      logger.info(`Product updated: ${productId} by user ${userId}`);

      return this.formatProductResponse(updatedProduct, true);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete (archive) a product
   */
  async deleteProduct(productId: number, userId: number, userRole: UserRole) {
    const product = await this.productRepository.findByPk(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Check permissions
    if (userRole !== 'admin' && product.sellerId !== userId) {
      throw new ForbiddenError('You are not authorized to delete this product');
    }

    // Archive the product instead of hard delete
    await this.productRepository.updateProduct(productId, { status: 'archived' });

    logger.info(`Product archived: ${productId} by user ${userId}`);
  }

  /**
   * Update product stock (for inventory management)
   */
  async updateProductStock(productId: number, newStock: number, reason: string, userId: number) {
    const product = await this.productRepository.findByPk(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const transaction = await sequelize.transaction();

    try {
      const changeAmount = newStock - product.stockQuantity;

      // Update stock
      await this.productRepository.updateStock(productId, newStock, { transaction });

      // Log inventory change
      await this.inventoryLogRepository.create(
        {
          productId,
          changeAmount,
          reason,
        },
        { transaction }
      );

      await transaction.commit();

      logger.info(
        `Product stock updated: ${productId} from ${product.stockQuantity} to ${newStock}, reason: ${reason}`
      );

      return { success: true, newStock, changeAmount };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Format product response for API
   */
  private formatProductResponse(product: Product, includeSellerInfo: boolean = false) {
    const formatted: any = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      sku: product.sku,
      stockQuantity: product.stockQuantity,
      weight: product.weight,
      dimensions: product.dimensions,
      slug: product.slug,
      status: product.status,
      categories:
        product.categories?.map(cat => ({
          id: cat.id,
          name: cat.name,
        })) || [],
      rating: 0, // TODO: Calculate from reviews
      reviewCount: 0, // TODO: Calculate from reviews
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    if (includeSellerInfo && product.seller) {
      formatted.seller = {
        id: product.seller.id,
        firstName: product.seller.firstName,
        lastName: product.seller.lastName,
      };
    }

    return formatted;
  }
}
