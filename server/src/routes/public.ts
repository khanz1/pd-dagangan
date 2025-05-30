import { Router } from 'express';
import { PublicController } from '../controllers/publicController';
import { ValidationMiddleware, CommonSchemas } from '../middleware/validation';

const router = Router();

// GET /pub/home - Get homepage data
router.get('/home', PublicController.getHome);

// GET /pub/products - List public products
router.get('/products', PublicController.getProducts);

// GET /pub/products/:id - Get product details
router.get('/products/:id',
  ValidationMiddleware.validate({ params: CommonSchemas.idParam }),
  PublicController.getProduct
);

// GET /pub/categories - List categories
router.get('/categories', PublicController.getCategories);

// GET /pub/categories/:id - Get category details
router.get('/categories/:id',
  ValidationMiddleware.validate({ params: CommonSchemas.idParam }),
  PublicController.getCategory
);

export default router; 