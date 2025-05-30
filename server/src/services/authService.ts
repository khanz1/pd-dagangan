import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// import { OAuth2Client } from 'google-auth-library';
import { config } from '@/config';
import { logger } from '@/config/logger';
import { UserRole, JwtPayload } from '@/types';
import { ConflictError, UnauthorizedError, ForbiddenError, ErrorMessages } from '@/types/errors';
import { UserRepository } from '@/repositories/userRepository';
import { SellerProfileRepository } from '@/repositories/sellerProfileRepository';
import { sequelize } from '@/config/database';

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName?: string | undefined;
  phone?: string | undefined;
  role: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    role: UserRole;
    status: string;
    sellerProfile?: {
      balance: number;
    } | null;
    createdAt: Date;
    updatedAt: Date;
  };
  tokens: AuthTokens;
}

// Helper function for JWT signing with proper types
function signJWT(payload: any, secret: string, options: any): string {
  return jwt.sign(payload, secret, options);
}

export class AuthService {
  private static userRepository = new UserRepository();
  private static sellerProfileRepository = new SellerProfileRepository();
  // private static googleClient = new OAuth2Client(config.google.clientId);

  /**
   * Register a new user
   */
  static async signup(data: SignupData): Promise<AuthResponse> {
    const transaction = await sequelize.transaction();
    
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(data.email, { transaction });

      if (existingUser) {
        throw new ConflictError(ErrorMessages.EMAIL_ALREADY_REGISTERED);
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(data.password, saltRounds);

      // Create user
      const user = await this.userRepository.createUser({
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName || '',
        phone: data.phone || '',
        role: data.role,
        status: 'active'
      }, { transaction });

      // Create seller profile if role is seller
      if (data.role === 'seller') {
        await this.sellerProfileRepository.createSellerProfile({
          userId: user.id,
          balance: 0
        }, { transaction });
      }

      await transaction.commit();

      // Generate tokens
      const tokens = this.generateTokens(user.id, user.email, user.role);

      // Fetch user with seller profile
      const userWithProfile = await this.userRepository.findByIdWithProfile(user.id);

      return {
        user: {
          id: userWithProfile!.id,
          email: userWithProfile!.email,
          firstName: userWithProfile!.firstName,
          lastName: userWithProfile!.lastName,
          phone: userWithProfile!.phone,
          role: userWithProfile!.role,
          status: userWithProfile!.status,
          sellerProfile: userWithProfile!.sellerProfile ? {
            balance: userWithProfile!.sellerProfile.balance
          } : null,
          createdAt: userWithProfile!.createdAt,
          updatedAt: userWithProfile!.updatedAt
        },
        tokens
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Signup error:', error);
      throw error;
    }
  }

  /**
   * Login user with email and password
   */
  static async login(data: LoginData): Promise<AuthResponse> {
    try {
      // Find user by email with seller profile
      const user = await this.userRepository.findByEmailWithProfile(data.email);

      if (!user) {
        throw new UnauthorizedError(ErrorMessages.INVALID_CREDENTIALS);
      }

      // Check if account is blocked
      if (user.status === 'blocked') {
        throw new ForbiddenError(ErrorMessages.ACCOUNT_BLOCKED);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError(ErrorMessages.INVALID_CREDENTIALS);
      }

      // Generate tokens
      const tokens = this.generateTokens(user.id, user.email, user.role);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          status: user.status,
          sellerProfile: user.sellerProfile ? {
            balance: user.sellerProfile.balance
          } : null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        tokens
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Login or register user with Google OAuth
   */
  static async googleAuth(_googleToken: string): Promise<AuthResponse> {
    // Temporarily disabled - will implement after basic auth is working
    throw new Error(ErrorMessages.GOOGLE_AUTH_FAILED);
    
    /*
    try {
      // Verify Google token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleToken,
        audience: config.google.clientId
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid Google token');
      }

      const { email, given_name: firstName, family_name: lastName } = payload;

      if (!email) {
        throw new Error('Email not provided by Google');
      }

      // Check if user exists
      let user = await this.userRepository.findByEmailWithProfile(email);

      if (!user) {
        // Create new user
        user = await this.userRepository.createUser({
          email,
          passwordHash: '', // No password for OAuth users
          firstName: firstName || '',
          lastName: lastName || '',
          phone: '',
          role: 'buyer',
          status: 'active'
        });

        // Reload with associations
        user = await this.userRepository.findByIdWithProfile(user.id);
      }

      // Check if account is blocked
      if (user!.status === 'blocked') {
        throw new Error('Account is blocked');
      }

      // Generate tokens
      const tokens = this.generateTokens(user!.id, user!.email, user!.role);

      return {
        user: {
          id: user!.id,
          email: user!.email,
          firstName: user!.firstName,
          lastName: user!.lastName,
          phone: user!.phone,
          role: user!.role,
          status: user!.status,
          sellerProfile: user!.sellerProfile ? {
            balance: user!.sellerProfile.balance
          } : null,
          createdAt: user!.createdAt,
          updatedAt: user!.updatedAt
        },
        tokens
      };
    } catch (error) {
      logger.error('Google auth error:', error);
      throw new Error('Google authentication failed');
    }
    */
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<Omit<AuthTokens, 'refreshToken'>> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret as string) as JwtPayload;
      
      // Find user to ensure they still exist and are active
      const user = await this.userRepository.findByPk(decoded.userId);
      if (!user || user.status === 'blocked') {
        throw new UnauthorizedError(ErrorMessages.INVALID_TOKEN);
      }

      // Generate new access token
      const accessToken = signJWT(
        { userId: user.id, email: user.email, role: user.role },
        config.jwt.secret as string,
        { expiresIn: config.jwt.expiresIn }
      );

      return {
        accessToken,
        expiresIn: 3600 // 1 hour
      };
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw new UnauthorizedError(ErrorMessages.INVALID_TOKEN);
    }
  }

  /**
   * Generate JWT tokens
   */
  private static generateTokens(userId: number, email: string, role: UserRole): AuthTokens {
    const payload: JwtPayload = { userId, email, role };

    const accessToken = signJWT(payload, config.jwt.secret as string, {
      expiresIn: config.jwt.expiresIn
    });

    const refreshToken = signJWT(payload, config.jwt.refreshSecret as string, {
      expiresIn: config.jwt.refreshExpiresIn
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600 // 1 hour in seconds
    };
  }

  /**
   * Validate token and return user info
   */
  static async validateToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret as string) as JwtPayload;
      
      // Verify user still exists and is active
      const user = await this.userRepository.findByPk(decoded.userId);
      if (!user || user.status === 'blocked') {
        throw new UnauthorizedError(ErrorMessages.INVALID_TOKEN);
      }

      return decoded;
    } catch (error) {
      logger.error('Token validation error:', error);
      throw new UnauthorizedError(ErrorMessages.INVALID_TOKEN);
    }
  }
} 