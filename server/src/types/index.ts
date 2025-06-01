import { Request } from 'express';

// Base types
export type UserRole = 'buyer' | 'seller' | 'admin';
export type UserStatus = 'active' | 'blocked';
export type AddressType = 'billing' | 'shipping';
export type ProductStatus = 'active' | 'archived';
export type CouponType = 'percent' | 'fixed';
export type CouponStatus = 'active' | 'expired' | 'disabled';
export type OrderStatus = 'new' | 'paid' | 'shipped' | 'delivered' | 'closed';
export type PaymentMethodType = 'card' | 'wallet' | 'bank';
export type PaymentStatus = 'pending' | 'success' | 'failed';
export type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'returned';
export type MediaType = 'image' | 'video';
export type InventoryActionType = 'restock' | 'sale' | 'adjustment' | 'return';
export type NotificationType =
  | 'order_status_update'
  | 'payment_confirmation'
  | 'shipping_update'
  | 'promotion'
  | 'system_announcement';

// Database entity interfaces
export interface IUser {
  id: number;
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName?: string | undefined;
  phone?: string | undefined;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISellerProfile {
  userId: number;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress {
  id: number;
  userId: number;
  type: AddressType;
  street1: string;
  street2?: string;
  city: string;
  province?: string;
  postalCode?: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct {
  id: number;
  sellerId: number;
  name: string;
  description?: string;
  price: number;
  sku: string;
  stockQuantity: number;
  weight: number;
  dimensions?: string;
  slug: string;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductCategory {
  productId: number;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICart {
  id: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  selectedOptions?: Record<string, any>;
  unitPriceAtAdd: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoupon {
  id: number;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxUses: number;
  perUserLimit: number;
  startAt: Date;
  expiresAt?: Date;
  status: CouponStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrder {
  id: number;
  userId: number;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  shippingFee: number;
  total: number;
  couponId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentMethod {
  id: number;
  userId: number;
  type: PaymentMethodType;
  provider?: string;
  maskedAccount?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment {
  id: number;
  orderId: number;
  paymentMethodId?: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gatewayResponse?: Record<string, any>;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IShipment {
  id: number;
  orderId: number;
  addressId: number;
  courier?: string;
  trackingNumber?: string;
  status: ShipmentStatus;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryLog {
  id: number;
  productId: number;
  changeAmount: number;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWishlist {
  id: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWishlistItem {
  id: number;
  wishlistId: number;
  productId: number;
  addedAt: Date;
  updatedAt: Date;
}

export interface IReview {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  comment?: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReviewMedia {
  id: number;
  reviewId: number;
  mediaType: MediaType;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog {
  id: number;
  userId?: number;
  action: string;
  objectType?: string;
  objectId?: number;
  meta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  id: number;
  userId: number;
  type: NotificationType;
  payload: Record<string, any>;
  text?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  errors?: any[];
  meta?: {
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface SortQuery {
  sort?: string;
}

// JWT Payload
export interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  iat?: number;
  exp?: number;
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Utility types
export type CreateInput<T> = Pick<T, Exclude<keyof T, 'id' | 'createdAt' | 'updatedAt'>>;
export type UpdateInput<T> = Partial<Pick<T, Exclude<keyof T, 'id' | 'createdAt' | 'updatedAt'>>>;

// Re-export error types
export * from './errors';
