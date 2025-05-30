import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

import { config } from '@/config';
import { logger, morganStream } from '@/config/logger';
import { connectDatabase } from '@/config/database';
import { initializeAssociations } from '@/models';
import { ErrorHandler } from '@/middleware/errorHandler';

// Import routes
import routes from '@/routes';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Compression middleware
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // HTTP request logging
    this.app.use(morgan('combined', { stream: morganStream }));

    // Static files
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // API Documentation
    if (config.app.nodeEnv === 'development') {
      // Placeholder for Swagger documentation
      this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup({
        openapi: '3.0.0',
        info: {
          title: 'Dagangan API',
          version: '1.0.0',
          description: 'E-commerce API for Dagangan platform',
        },
        servers: [{
          url: `http://localhost:${config.app.port}/api/${config.app.apiVersion}`,
          description: 'Development server',
        }],
        paths: {},
      }));
    }
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use(`/api/${config.app.apiVersion}`, routes);

    // Root endpoint
    this.app.get('/', (_req: Request, res: Response) => {
      res.status(200).json({
        message: 'Dagangan API is running!',
        version: config.app.apiVersion,
        timestamp: new Date().toISOString(),
        documentation: `/api/docs`,
        health: `/api/${config.app.apiVersion}/healthz`,
        endpoints: {
          health: `/api/${config.app.apiVersion}/healthz`,
          auth: {
            signup: `POST /api/${config.app.apiVersion}/auth/signup`,
            login: `POST /api/${config.app.apiVersion}/auth/login`,
            google: `POST /api/${config.app.apiVersion}/auth/google`,
            refresh: `POST /api/${config.app.apiVersion}/auth/token/refresh`,
            logout: `POST /api/${config.app.apiVersion}/auth/logout`,
            me: `GET /api/${config.app.apiVersion}/auth/me`
          },
          users: {
            profile: `GET /api/${config.app.apiVersion}/users/me`,
            updateProfile: `PUT /api/${config.app.apiVersion}/users/me`,
            changePassword: `PUT /api/${config.app.apiVersion}/users/me/password`,
            listUsers: `GET /api/${config.app.apiVersion}/users`,
            getUser: `GET /api/${config.app.apiVersion}/users/:id`
          },
          public: {
            home: `GET /api/${config.app.apiVersion}/pub/home`,
            products: `GET /api/${config.app.apiVersion}/pub/products`,
            product: `GET /api/${config.app.apiVersion}/pub/products/:id`,
            categories: `GET /api/${config.app.apiVersion}/pub/categories`,
            category: `GET /api/${config.app.apiVersion}/pub/categories/:id`
          }
        },
      });
    });

    // 404 handler
    this.app.use('*', ErrorHandler.notFound);
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use(ErrorHandler.handle);

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason: Error) => {
      logger.error('Unhandled Rejection:', reason);
      process.exit(1);
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      process.exit(0);
    });
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();
      
      // Initialize model associations
      initializeAssociations();
      logger.info('✅ Model associations initialized');

      // Start server
      this.app.listen(config.app.port, () => {
        logger.info(`🚀 Server running on port ${config.app.port} in ${config.app.nodeEnv} mode`);
        logger.info(`📚 API Documentation: http://localhost:${config.app.port}/api/docs`);
        logger.info(`🏥 Health check: http://localhost:${config.app.port}/healthz`);
        logger.info(`🗄️  Models loaded: User, SellerProfile, Address, Product, Category, ProductCategory, Cart, CartItem, Coupon, Order, OrderItem, PaymentMethod, Payment, Shipment, InventoryLog, Wishlist, WishlistItem, Review, ReviewMedia, Notification, AuditLog`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Create and start the application
const appInstance = new App();

if (require.main === module) {
  appInstance.start();
}

// Export the Express app for testing
export const app = appInstance.app; 