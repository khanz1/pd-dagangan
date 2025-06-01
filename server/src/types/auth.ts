import { User } from '@/models';

export interface JWTPayload {
  id: number;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  id: number;
  email: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
  };
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
