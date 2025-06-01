import {
  CategoryRepository,
  CreateCategoryData,
  UpdateCategoryData,
} from '@/repositories/categoryRepository';
import { Category } from '@/models';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  ErrorMessages,
} from '@/types/errors';
import { UserRole } from '@/types';
import { logger } from '@/config/logger';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  /**
   * Get all categories in hierarchical structure for public access
   */
  async getPublicCategories() {
    const categories = await this.categoryRepository.findRootCategories();
    return categories.map(category => this.formatCategoryResponse(category, true));
  }

  /**
   * Get public category details with products
   */
  async getPublicCategory(categoryId: number, pagination: PaginationParams = {}) {
    const category = await this.categoryRepository.findWithProducts(categoryId, pagination);

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const formatted = this.formatCategoryResponse(category, true);

    // Add products with pagination info
    const { page = 1, limit = 20 } = pagination;

    return {
      ...formatted,
      products:
        category.products?.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          slug: product.slug,
          rating: 0, // TODO: Calculate from reviews
          // Add first image URL when image system is implemented
          imageUrl: null,
        })) || [],
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((category.products?.length || 0) / limit),
        totalItems: category.products?.length || 0,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * List all categories for admin/management
   */
  async listCategories() {
    const categories = await this.categoryRepository.findWithProductCounts();
    return categories.map(category => this.formatCategoryResponse(category, true));
  }

  /**
   * Get category details by ID
   */
  async getCategory(categoryId: number) {
    const category = await this.categoryRepository.findWithChildren(categoryId);

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return this.formatCategoryResponse(category, true);
  }

  /**
   * Create a new category
   */
  async createCategory(categoryData: CreateCategoryData, userRole: UserRole) {
    // Only admins can create categories
    if (userRole !== 'admin') {
      throw new ForbiddenError('Only administrators can create categories');
    }

    // Check if category name already exists
    const existingCategory = await this.categoryRepository.nameExists(categoryData.name);
    if (existingCategory) {
      throw new ConflictError('Category name already exists');
    }

    // Validate parent category if provided
    if (categoryData.parentId) {
      const parentCategory = await this.categoryRepository.findByPk(categoryData.parentId);
      if (!parentCategory) {
        throw new ValidationError([
          {
            field: 'parentId',
            message: ErrorMessages.PARENT_CATEGORY_DOES_NOT_EXIST,
          },
        ]);
      }
    }

    const category = await this.categoryRepository.createCategory(categoryData);

    logger.info(`Category created: ${category.id} - ${category.name}`);

    return this.formatCategoryResponse(category, false);
  }

  /**
   * Update a category
   */
  async updateCategory(categoryId: number, updateData: UpdateCategoryData, userRole: UserRole) {
    // Only admins can update categories
    if (userRole !== 'admin') {
      throw new ForbiddenError('Only administrators can update categories');
    }

    const existingCategory = await this.categoryRepository.findByPk(categoryId);
    if (!existingCategory) {
      throw new NotFoundError('Category not found');
    }

    // Check name uniqueness if being updated
    if (updateData.name && updateData.name !== existingCategory.name) {
      const nameExists = await this.categoryRepository.nameExists(updateData.name, categoryId);
      if (nameExists) {
        throw new ConflictError('Category name already exists');
      }
    }

    // Validate parent category if being updated
    if (updateData.parentId !== undefined) {
      if (updateData.parentId !== null) {
        // Check that parent exists
        const parentCategory = await this.categoryRepository.findByPk(updateData.parentId);
        if (!parentCategory) {
          throw new ValidationError([
            {
              field: 'parentId',
              message: ErrorMessages.PARENT_CATEGORY_DOES_NOT_EXIST,
            },
          ]);
        }

        // Prevent circular references (category cannot be its own parent or ancestor)
        if (updateData.parentId === categoryId) {
          throw new ValidationError([
            {
              field: 'parentId',
              message: ErrorMessages.CATEGORY_CANNOT_BE_ITS_OWN_PARENT,
            },
          ]);
        }

        // TODO: Add more sophisticated circular reference checking for deeper hierarchies
      }
    }

    const updatedCategory = await this.categoryRepository.updateCategory(categoryId, updateData);

    if (!updatedCategory) {
      throw new NotFoundError('Category not found after update');
    }

    logger.info(`Category updated: ${categoryId}`);

    return this.formatCategoryResponse(updatedCategory, true);
  }

  /**
   * Delete a category
   */
  async deleteCategory(categoryId: number, userRole: UserRole) {
    // Only admins can delete categories
    if (userRole !== 'admin') {
      throw new ForbiddenError('Only administrators can delete categories');
    }

    const category = await this.categoryRepository.findByPk(categoryId);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Check if category has children
    const hasChildren = await this.categoryRepository.hasChildren(categoryId);
    if (hasChildren) {
      throw new ValidationError([
        {
          field: 'categoryId',
          message: ErrorMessages.CANNOT_DELETE_CATEGORY_WITH_CHILDREN,
        },
      ]);
    }

    // Check if category has products
    const hasProducts = await this.categoryRepository.hasProducts(categoryId);
    if (hasProducts) {
      throw new ValidationError([
        {
          field: 'categoryId',
          message: ErrorMessages.CANNOT_DELETE_CATEGORY_WITH_PRODUCTS,
        },
      ]);
    }

    await this.categoryRepository.delete(categoryId);

    logger.info(`Category deleted: ${categoryId}`);
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(categoryId: number) {
    const stats = await this.categoryRepository.getCategoryStats(categoryId);
    return stats;
  }

  /**
   * Format category response for API
   */
  private formatCategoryResponse(category: any, includeChildren: boolean = false) {
    const formatted: any = {
      id: category.id,
      name: category.name,
      description: category.description,
      parentId: category.parentId,
      productCount: category.productCount || 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    if (includeChildren && category.children) {
      formatted.children = category.children.map((child: Category) =>
        this.formatCategoryResponse(child, true)
      );
    }

    if (category.parent) {
      formatted.parent = {
        id: category.parent.id,
        name: category.parent.name,
      };
    }

    return formatted;
  }
}
