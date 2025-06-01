import { Router } from 'express';

// Import route modules
import authRoutes from './auth';
import userRoutes from './users';
import publicRoutes from './public';
import productRoutes from './products';
import cartRoutes from './cartRoutes';
import wishlistRoutes from './wishlistRoutes';
import orderRoutes from './orderRoutes';
import paymentRoutes from './paymentRoutes';
import shippingRoutes from './shippingRoutes';
// import categoryRoutes from './categories';
// import addressRoutes from './addresses';

const router = Router();

// Health check endpoint
router.get('/healthz', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      redis: 'unknown',
      externalApis: {
        midtrans: 'mock_service_active',
        rajaongkir: 'mock_service_active',
      },
    },
    features: {
      authentication: 'active',
      products: 'active',
      cart: 'active',
      wishlist: 'active',
      orders: 'active',
      payments: 'active',
      shipping: 'active',
    },
    uptime: process.uptime(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/pub', publicRoutes); // Public endpoints
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlists', wishlistRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/shipping', shippingRoutes);

// TODO: Implement in next steps
// router.use('/categories', categoryRoutes);
// router.use('/addresses', addressRoutes);

export default router;
