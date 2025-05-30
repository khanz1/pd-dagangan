import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { ValidationMiddleware, CommonSchemas } from '../middleware/validation';
import { AuthMiddleware } from '../middleware/auth';
import { RBACMiddleware } from '../middleware/rbac';
import { UserValidators } from '../validators/userValidators';

const router = Router();

// GET /users/me - Get current user profile
router.get('/me',
  AuthMiddleware.authenticate,
  UserController.getProfile
);

// PUT /users/me - Update current user profile
router.put('/me',
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate({ body: UserValidators.updateProfile }),
  UserController.updateProfile
);

// PUT /users/me/password - Change current user password
router.put('/me/password',
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate({ body: UserValidators.changePassword }),
  UserController.changePassword
);

// GET /users - List all users (Admin only)
router.get('/',
  AuthMiddleware.authenticate,
  RBACMiddleware.requireAdmin,
  ValidationMiddleware.validate({ query: UserValidators.listUsersQuery }),
  UserController.listUsers
);

// GET /users/:id - Get user by ID (Admin only)
router.get('/:id',
  AuthMiddleware.authenticate,
  RBACMiddleware.requireAdmin,
  ValidationMiddleware.validate({ params: CommonSchemas.idParam }),
  UserController.getUserById
);

// PUT /users/:id/status - Update user status (Admin only)
router.put('/:id/status',
  AuthMiddleware.authenticate,
  RBACMiddleware.requireAdmin,
  ValidationMiddleware.validate({ 
    params: CommonSchemas.idParam,
    body: UserValidators.updateUserStatus 
  }),
  UserController.updateUserStatus
);

export default router; 