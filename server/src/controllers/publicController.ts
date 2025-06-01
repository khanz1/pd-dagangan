import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { ProductService } from '@/services/productService';
import { CategoryService } from '@/services/categoryService';
import { ProductValidators } from '@/validators/productValidators';
import { CategoryValidators } from '@/validators/categoryValidators';

export class PublicController {
  private static productService = new ProductService();
  private static categoryService = new CategoryService();

  /**
   * GET /api/v1/pub/home
   * Get homepage data
   */
  static async getHome(_req: Request, res: Response): Promise<void> {
    try {
      // Get featured products
      const featuredProducts = await PublicController.productService.getFeaturedProducts(8);

      // Get root categories
      const categories = await PublicController.categoryService.getPublicCategories();

      // Placeholder for banners (could be implemented later)
      const banners: any[] = [];

      res.status(200).json({
        featuredProducts,
        banners,
        categories: categories.slice(0, 6), // Limit to 6 categories for homepage
      });
    } catch (error) {
      logger.error('Get home data error:', error);
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/v1/pub/products
   * List public products with pagination
   */
  static async getProducts(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const validatedQuery = ProductValidators.publicProductsQuery.parse(req.query);

      const filters = {
        categoryId: validatedQuery.category,
        search: validatedQuery.search,
        minPrice: validatedQuery.minPrice,
        maxPrice: validatedQuery.maxPrice,
        sort: validatedQuery.sort,
      };

      const pagination = {
        page: validatedQuery.page || 1,
        limit: validatedQuery.limit || 20,
      };

      const result = await PublicController.productService.getPublicProducts(filters, pagination);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Get products error:', error);
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/v1/pub/products/:id
   * Get public product details
   */
  static async getProduct(req: Request, res: Response): Promise<void> {
    try {
      // Validate parameters
      const { id: productId } = ProductValidators.productIdParam.parse(req.params);

      const result = await PublicController.productService.getPublicProduct(productId);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Get product error:', error);

      if (error instanceof Error && error.message === 'Product not found') {
        res.status(404).json({
          message: 'Product not found',
        });
      } else {
        res.status(500).json({
          message: 'Internal server error',
        });
      }
    }
  }

  /**
   * GET /api/v1/pub/categories
   * List all product categories
   */
  static async getCategories(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await PublicController.categoryService.getPublicCategories();

      res.status(200).json({
        categories,
      });
    } catch (error) {
      logger.error('Get categories error:', error);
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/v1/pub/categories/:id
   * Get category details with products
   */
  static async getCategory(req: Request, res: Response): Promise<void> {
    try {
      // Validate parameters
      const { id: categoryId } = CategoryValidators.categoryIdParam.parse(req.params);

      // Validate query parameters for pagination
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = Math.min(parseInt(req.query['limit'] as string) || 20, 100);

      const result = await PublicController.categoryService.getPublicCategory(categoryId, {
        page,
        limit,
      });

      res.status(200).json(result);
    } catch (error) {
      logger.error('Get category error:', error);

      if (error instanceof Error && error.message === 'Category not found') {
        res.status(404).json({
          message: 'Category not found',
        });
      } else {
        res.status(500).json({
          message: 'Internal server error',
        });
      }
    }
  }
}
