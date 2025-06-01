import { Router } from 'express';
import { ProductController } from '@/controllers/productController';
import { AuthMiddleware } from '@/middleware/auth';
import { RBACMiddleware } from '@/middleware/rbac';

const router = Router();

// All product routes require authentication
router.use(AuthMiddleware.authenticate);

// GET /api/v1/products - List products (authenticated users)
router.get('/', ProductController.listProducts);

// POST /api/v1/products - Create product (seller/admin only)
router.post('/', RBACMiddleware.requireRole('seller', 'admin'), ProductController.createProduct);

// GET /api/v1/products/:id - Get product details
router.get('/:id', ProductController.getProduct);

// PUT /api/v1/products/:id - Update product (seller/admin only)
router.put('/:id', RBACMiddleware.requireRole('seller', 'admin'), ProductController.updateProduct);

// DELETE /api/v1/products/:id - Delete product (seller/admin only)
router.delete(
  '/:id',
  RBACMiddleware.requireRole('seller', 'admin'),
  ProductController.deleteProduct
);

// PUT /api/v1/products/:id/stock - Update product stock (seller/admin only)
router.put(
  '/:id/stock',
  RBACMiddleware.requireRole('seller', 'admin'),
  ProductController.updateStock
);

export default router;
