import { sequelize } from '@/config/database';

// Import all models
import { User } from './User';
import { SellerProfile } from './SellerProfile';
import { Address } from './Address';
import { Product } from './Product';
import { Category } from './Category';
import { ProductCategory } from './ProductCategory';
import { Cart } from './Cart';
import { CartItem } from './CartItem';
import { Coupon } from './Coupon';
import { Order } from './Order';
import { OrderItem } from './OrderItem';
import { PaymentMethod } from './PaymentMethod';
import { Payment } from './Payment';
import { Shipment } from './Shipment';
import { InventoryLog } from './InventoryLog';
import { Wishlist } from './Wishlist';
import { WishlistItem } from './WishlistItem';
import { Review } from './Review';
import { ReviewMedia } from './ReviewMedia';
import { Notification } from './Notification';
import { AuditLog } from './AuditLog';

// Initialize model associations
const initializeAssociations = (): void => {
  // User associations
  User.hasOne(SellerProfile, { 
    foreignKey: 'userId', 
    as: 'sellerProfile',
    onDelete: 'CASCADE'
  });
  
  User.hasMany(Address, { 
    foreignKey: 'userId', 
    as: 'addresses',
    onDelete: 'CASCADE'
  });
  
  User.hasMany(Product, { 
    foreignKey: 'sellerId', 
    as: 'products',
    onDelete: 'CASCADE'
  });
  
  User.hasOne(Cart, { 
    foreignKey: 'userId', 
    as: 'cart',
    onDelete: 'CASCADE'
  });
  
  User.hasMany(Order, { 
    foreignKey: 'userId', 
    as: 'orders' 
  });
  
  User.hasMany(PaymentMethod, { 
    foreignKey: 'userId', 
    as: 'paymentMethods',
    onDelete: 'CASCADE'
  });
  
  User.hasOne(Wishlist, { 
    foreignKey: 'userId', 
    as: 'wishlist',
    onDelete: 'CASCADE'
  });
  
  User.hasMany(Review, { 
    foreignKey: 'userId', 
    as: 'reviews' 
  });
  
  User.hasMany(Notification, { 
    foreignKey: 'userId', 
    as: 'notifications',
    onDelete: 'CASCADE'
  });

  User.hasMany(AuditLog, { 
    foreignKey: 'userId', 
    as: 'auditLogs' 
  });

  // SellerProfile associations
  SellerProfile.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user',
    onDelete: 'CASCADE'
  });

  // Address associations
  Address.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user',
    onDelete: 'CASCADE'
  });
  
  Address.hasMany(Shipment, { 
    foreignKey: 'addressId', 
    as: 'shipments' 
  });

  // Product associations
  Product.belongsTo(User, { 
    foreignKey: 'sellerId', 
    as: 'seller',
    onDelete: 'CASCADE'
  });
  
  Product.belongsToMany(Category, { 
    through: ProductCategory, 
    foreignKey: 'productId', 
    otherKey: 'categoryId',
    as: 'categories'
  });
  
  Product.hasMany(CartItem, { 
    foreignKey: 'productId', 
    as: 'cartItems'
  });
  
  Product.hasMany(OrderItem, { 
    foreignKey: 'productId', 
    as: 'orderItems' 
  });
  
  Product.hasMany(WishlistItem, { 
    foreignKey: 'productId', 
    as: 'wishlistItems' 
  });
  
  Product.hasMany(Review, { 
    foreignKey: 'productId', 
    as: 'reviews' 
  });
  
  Product.hasMany(InventoryLog, { 
    foreignKey: 'productId', 
    as: 'inventoryLogs' 
  });

  // Category associations
  Category.belongsTo(Category, { 
    foreignKey: 'parentId', 
    as: 'parent'
  });
  
  Category.hasMany(Category, { 
    foreignKey: 'parentId', 
    as: 'children'
  });
  
  Category.belongsToMany(Product, { 
    through: ProductCategory, 
    foreignKey: 'categoryId', 
    otherKey: 'productId',
    as: 'products'
  });

  // ProductCategory associations
  ProductCategory.belongsTo(Product, { 
    foreignKey: 'productId', 
    as: 'product'
  });
  
  ProductCategory.belongsTo(Category, { 
    foreignKey: 'categoryId', 
    as: 'category'
  });

  // Cart associations
  Cart.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user',
    onDelete: 'CASCADE'
  });
  
  Cart.hasMany(CartItem, { 
    foreignKey: 'cartId', 
    as: 'items',
    onDelete: 'CASCADE'
  });

  // CartItem associations
  CartItem.belongsTo(Cart, { 
    foreignKey: 'cartId', 
    as: 'cart',
    onDelete: 'CASCADE'
  });
  
  CartItem.belongsTo(Product, { 
    foreignKey: 'productId', 
    as: 'product'
  });

  // Coupon associations
  Coupon.hasMany(Order, { 
    foreignKey: 'couponId', 
    as: 'orders' 
  });

  // Order associations
  Order.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
  });
  
  Order.belongsTo(Coupon, { 
    foreignKey: 'couponId', 
    as: 'coupon' 
  });
  
  Order.hasMany(OrderItem, { 
    foreignKey: 'orderId', 
    as: 'items',
    onDelete: 'CASCADE'
  });
  
  Order.hasOne(Payment, { 
    foreignKey: 'orderId', 
    as: 'payment',
    onDelete: 'CASCADE'
  });
  
  Order.hasOne(Shipment, { 
    foreignKey: 'orderId', 
    as: 'shipment',
    onDelete: 'CASCADE'
  });

  // OrderItem associations
  OrderItem.belongsTo(Order, { 
    foreignKey: 'orderId', 
    as: 'order',
    onDelete: 'CASCADE'
  });
  
  OrderItem.belongsTo(Product, { 
    foreignKey: 'productId', 
    as: 'product' 
  });

  // Payment associations
  Payment.belongsTo(Order, { 
    foreignKey: 'orderId', 
    as: 'order',
    onDelete: 'CASCADE'
  });
  
  Payment.belongsTo(PaymentMethod, { 
    foreignKey: 'paymentMethodId', 
    as: 'paymentMethod' 
  });

  // PaymentMethod associations
  PaymentMethod.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user',
    onDelete: 'CASCADE'
  });
  
  PaymentMethod.hasMany(Payment, { 
    foreignKey: 'paymentMethodId', 
    as: 'payments' 
  });

  // Shipment associations
  Shipment.belongsTo(Order, { 
    foreignKey: 'orderId', 
    as: 'order',
    onDelete: 'CASCADE'
  });
  
  Shipment.belongsTo(Address, { 
    foreignKey: 'addressId', 
    as: 'address' 
  });

  // Wishlist associations
  Wishlist.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user',
    onDelete: 'CASCADE'
  });
  
  Wishlist.hasMany(WishlistItem, { 
    foreignKey: 'wishlistId', 
    as: 'items',
    onDelete: 'CASCADE'
  });

  // WishlistItem associations
  WishlistItem.belongsTo(Wishlist, { 
    foreignKey: 'wishlistId', 
    as: 'wishlist',
    onDelete: 'CASCADE'
  });
  
  WishlistItem.belongsTo(Product, { 
    foreignKey: 'productId', 
    as: 'product' 
  });

  // Review associations
  Review.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
  });
  
  Review.belongsTo(Product, { 
    foreignKey: 'productId', 
    as: 'product' 
  });
  
  Review.hasMany(ReviewMedia, { 
    foreignKey: 'reviewId', 
    as: 'media',
    onDelete: 'CASCADE'
  });

  // ReviewMedia associations
  ReviewMedia.belongsTo(Review, { 
    foreignKey: 'reviewId', 
    as: 'review',
    onDelete: 'CASCADE'
  });

  // InventoryLog associations
  InventoryLog.belongsTo(Product, { 
    foreignKey: 'productId', 
    as: 'product' 
  });

  // Notification associations
  Notification.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user',
    onDelete: 'CASCADE'
  });

  // AuditLog associations
  AuditLog.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
  });
};

// Export database instance and models
export {
  sequelize,
  initializeAssociations,
  // Export all models
  User,
  SellerProfile,
  Address,
  Product,
  Category,
  ProductCategory,
  Cart,
  CartItem,
  Coupon,
  Order,
  OrderItem,
  PaymentMethod,
  Payment,
  Shipment,
  InventoryLog,
  Wishlist,
  WishlistItem,
  Review,
  ReviewMedia,
  Notification,
  AuditLog,
}; 