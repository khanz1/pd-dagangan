import { Router } from 'express';

// Import route modules
import authRoutes from './auth';
import userRoutes from './users';
import publicRoutes from './public';
// import addressRoutes from './addresses';
// import productRoutes from './products';
// import categoryRoutes from './categories';
// import cartRoutes from './cart';
// import orderRoutes from './orders';

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
        midtrans: 'unknown',
        rajaongkir: 'unknown'
      }
    },
    uptime: process.uptime()
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/pub', publicRoutes); // Public endpoints

// TODO: Implement in next steps
// router.use('/addresses', addressRoutes);
// router.use('/products', productRoutes);
// router.use('/categories', categoryRoutes);
// router.use('/cart', cartRoutes);
// router.use('/orders', orderRoutes);

export default router; 