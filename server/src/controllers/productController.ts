import { Request, Response, NextFunction } from 'express';
import { ProductService } from '@/services/productService';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/types';
import { ErrorHandler } from '@/middleware/errorHandler';
import { ProductValidators } from '@/validators/productValidators';

export class ProductController {
  private static productService = new ProductService();

  /**
   * GET /api/v1/products
   * List products for authenticated users (seller/admin)
   */
  static listProducts = ErrorHandler.requireAuth(
    async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Validate query parameters
      const validatedQuery = ProductValidators.listProductsQuery.parse(req.query);

      const filters = {
        status: validatedQuery.status,
        search: validatedQuery.search,
        categoryId: validatedQuery.category,
        minPrice: validatedQuery.minPrice,
        maxPrice: validatedQuery.maxPrice,
        sellerId: validatedQuery.sellerId,
      };

      const pagination = {
        page: validatedQuery.page || 1,
        limit: validatedQuery.limit || 20,
      };

      const result = await ProductController.productService.listProducts(
        userId,
        userRole,
        filters,
        pagination
      );

      res.status(200).json(result);
    }
  );

  /**
   * POST /api/v1/products
   * Create a new product (seller/admin)
   */
  static createProduct = ErrorHandler.requireAuth(
    async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Validate input
      const validatedData = ProductValidators.createProduct.parse(req.body);

      // For sellers, ensure they can only create products for themselves
      if (userRole === 'seller') {
        validatedData.sellerId = userId;
      }

      const result = await ProductController.productService.createProduct(
        validatedData,
        userId,
        userRole
      );

      logger.info(`Product created: ${result.id} by user ${userId}`);
      res.status(201).json(result);
    }
  );

  /**
   * GET /api/v1/products/:id
   * Get product details (authenticated)
   */
  static getProduct = ErrorHandler.requireAuth(
    async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Validate parameters
      const { id: productId } = ProductValidators.productIdParam.parse(req.params);

      const result = await ProductController.productService.getProduct(productId, userId, userRole);

      res.status(200).json(result);
    }
  );

  /**
   * PUT /api/v1/products/:id
   * Update a product (seller/admin)
   */
  static updateProduct = ErrorHandler.requireAuth(
    async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Validate parameters and body
      const { id: productId } = ProductValidators.productIdParam.parse(req.params);
      const validatedData = ProductValidators.updateProduct.parse(req.body);

      const result = await ProductController.productService.updateProduct(
        productId,
        validatedData,
        userId,
        userRole
      );

      logger.info(`Product updated: ${productId} by user ${userId}`);
      res.status(200).json(result);
    }
  );

  /**
   * DELETE /api/v1/products/:id
   * Delete (archive) a product (seller/admin)
   */
  static deleteProduct = ErrorHandler.requireAuth(
    async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Validate parameters
      const { id: productId } = ProductValidators.productIdParam.parse(req.params);

      await ProductController.productService.deleteProduct(productId, userId, userRole);

      logger.info(`Product deleted: ${productId} by user ${userId}`);
      res.status(204).send();
    }
  );

  /**
   * PUT /api/v1/products/:id/stock
   * Update product stock (seller/admin)
   */
  static updateStock = ErrorHandler.requireAuth(
    async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
      const userId = req.user!.userId;

      // Validate parameters and body
      const { id: productId } = ProductValidators.productIdParam.parse(req.params);
      const validatedData = ProductValidators.updateStock.parse(req.body);

      const result = await ProductController.productService.updateProductStock(
        productId,
        validatedData.stockQuantity,
        validatedData.reason,
        userId
      );

      logger.info(`Product stock updated: ${productId} by user ${userId}`);
      res.status(200).json(result);
    }
  );
}
