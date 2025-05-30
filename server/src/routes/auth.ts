import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { ValidationMiddleware } from '../middleware/validation';
import { AuthMiddleware } from '../middleware/auth';
import { AuthValidators } from '../validators/authValidators';

const router = Router();

// POST /auth/signup - Register new user
router.post('/signup',
  ValidationMiddleware.validate({ body: AuthValidators.signup }),
  AuthController.signup
);

// POST /auth/login - Login user
router.post('/login',
  ValidationMiddleware.validate({ body: AuthValidators.login }),
  AuthController.login
);

// POST /auth/google - Google OAuth login
router.post('/google',
  ValidationMiddleware.validate({ body: AuthValidators.googleAuth }),
  AuthController.googleAuth
);

// POST /auth/token/refresh - Refresh access token
router.post('/token/refresh',
  ValidationMiddleware.validate({ body: AuthValidators.refreshToken }),
  AuthController.refreshToken
);

// POST /auth/logout - Logout user
router.post('/logout',
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate({ body: AuthValidators.logout }),
  AuthController.logout
);

// GET /auth/me - Get current user info
router.get('/me',
  AuthMiddleware.authenticate,
  AuthController.getMe
);

export default router; 