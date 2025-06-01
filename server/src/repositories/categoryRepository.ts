import {
  BaseRepository,
  RepositoryOptions,
  PaginationOptions,
  PaginationResult,
} from './baseRepository';
import { Category, Product } from '@/models';
import { Op } from 'sequelize';

export interface CreateCategoryData {
  name: string;
  description?: string;
  parentId?: number;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  parentId?: number;
}

export class CategoryRepository extends BaseRepository<Category> {
  constructor() {
    super(Category);
  }

  /**
   * Find category by name
   */
  async findByName(name: string, options?: RepositoryOptions): Promise<Category | null> {
    return this.findOne({
      where: { name },
      ...options,
    });
  }

  /**
   * Find all root categories (no parent)
   */
  async findRootCategories(options?: RepositoryOptions): Promise<Category[]> {
    return this.findAll({
      where: { parentId: null },
      include: [
        {
          model: Category,
          as: 'children',
          include: [
            {
              model: Category,
              as: 'children',
            },
          ],
        },
      ],
      order: [['name', 'ASC']],
      ...options,
    });
  }

  /**
   * Find category with its children
   */
  async findWithChildren(id: number, options?: RepositoryOptions): Promise<Category | null> {
    return this.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'children',
          include: [
            {
              model: Category,
              as: 'children',
            },
          ],
        },
        {
          model: Category,
          as: 'parent',
        },
      ],
      ...options,
    });
  }

  /**
   * Find category with products
   */
  async findWithProducts(
    id: number,
    pagination: PaginationOptions = {},
    options?: RepositoryOptions
  ): Promise<Category | null> {
    return this.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'products',
          through: { attributes: [] },
          where: { status: 'active' },
          required: false,
          separate: true,
          ...pagination,
        },
        {
          model: Category,
          as: 'children',
        },
        {
          model: Category,
          as: 'parent',
        },
      ],
      ...options,
    });
  }

  /**
   * Find multiple categories by IDs
   */
  async findByIds(ids: number[], options?: RepositoryOptions): Promise<Category[]> {
    return this.findAll({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
      ...options,
    });
  }

  /**
   * Get all categories in hierarchical structure
   */
  async findAllHierarchical(options?: RepositoryOptions): Promise<Category[]> {
    return this.findAll({
      include: [
        {
          model: Category,
          as: 'children',
          include: [
            {
              model: Category,
              as: 'children',
            },
          ],
        },
        {
          model: Category,
          as: 'parent',
        },
      ],
      order: [
        ['parentId', 'ASC'],
        ['name', 'ASC'],
      ],
      ...options,
    });
  }

  /**
   * Create a new category
   */
  async createCategory(
    categoryData: CreateCategoryData,
    options?: RepositoryOptions
  ): Promise<Category> {
    return this.create(categoryData, options);
  }

  /**
   * Update category
   */
  async updateCategory(
    id: number,
    updateData: UpdateCategoryData,
    options?: RepositoryOptions
  ): Promise<Category | null> {
    const [affectedCount] = await this.update(updateData, {
      where: { id },
      ...options,
    });

    if (affectedCount === 0) {
      return null;
    }

    return this.findWithChildren(id, options);
  }

  /**
   * Check if category name exists (excluding specific category ID)
   */
  async nameExists(name: string, excludeId?: number): Promise<boolean> {
    const whereCondition: any = { name };

    if (excludeId) {
      whereCondition.id = { [Op.ne]: excludeId };
    }

    const count = await this.count({
      where: whereCondition,
    });

    return count > 0;
  }

  /**
   * Check if category has children
   */
  async hasChildren(id: number): Promise<boolean> {
    const count = await this.count({
      where: { parentId: id },
    });

    return count > 0;
  }

  /**
   * Check if category has products
   */
  async hasProducts(id: number): Promise<boolean> {
    const category = await this.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'products',
          through: { attributes: [] },
          required: false,
        },
      ],
    });

    return category?.products ? category.products.length > 0 : false;
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(id: number): Promise<{
    productCount: number;
    childrenCount: number;
  }> {
    const category = await this.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'products',
          through: { attributes: [] },
          where: { status: 'active' },
          required: false,
        },
        {
          model: Category,
          as: 'children',
          required: false,
        },
      ],
    });

    return {
      productCount: category?.products?.length || 0,
      childrenCount: category?.children?.length || 0,
    };
  }

  /**
   * Find categories with product counts
   */
  async findWithProductCounts(options?: RepositoryOptions): Promise<any[]> {
    // This would require a raw query in a real implementation
    // For now, we'll use a simpler approach
    const categories = await this.findAllHierarchical(options);

    const categoriesWithCounts = await Promise.all(
      categories.map(async category => {
        const stats = await this.getCategoryStats(category.id);
        return {
          ...category.toJSON(),
          productCount: stats.productCount,
          childrenCount: stats.childrenCount,
        };
      })
    );

    return categoriesWithCounts;
  }

  /**
   * Delete a category by ID
   */
  async delete(id: number, options?: RepositoryOptions): Promise<boolean> {
    const affectedRows = await this.model.destroy({
      where: { id },
      ...options,
    });

    return affectedRows > 0;
  }
}
