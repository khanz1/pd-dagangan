import { sequelize } from '@/config/database';
import { 
  User, 
  SellerProfile, 
  Address, 
  Product, 
  Category, 
  Cart, 
  CartItem, 
  Coupon,
  initializeAssociations 
} from '@/models';

describe('Models', () => {
  beforeAll(async () => {
    // Initialize associations
    initializeAssociations();
    
    // Sync database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('User Model', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: '$2b$10$hashedpassword',
        role: 'buyer' as const,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        status: 'active' as const,
      };

      const user = await User.create(userData);
      
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should enforce email uniqueness', async () => {
      const userData = {
        email: 'duplicate@example.com',
        passwordHash: '$2b$10$hashedpassword',
        role: 'buyer' as const,
        firstName: 'Jane',
      };

      await User.create(userData);
      
      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('Product Model', () => {
    let seller: User;

    beforeEach(async () => {
      seller = await User.create({
        email: 'seller@example.com',
        passwordHash: '$2b$10$hashedpassword',
        role: 'seller',
        firstName: 'Seller',
      });
    });

    it('should create a product with valid data', async () => {
      const productData = {
        sellerId: seller.id,
        name: 'Test Product',
        description: 'A test product',
        price: 99.99,
        sku: 'TEST-001',
        stockQuantity: 10,
        weight: 1.5,
        slug: 'test-product',
        status: 'active' as const,
      };

      const product = await Product.create(productData);
      
      expect(product.id).toBeDefined();
      expect(product.name).toBe(productData.name);
      expect(product.price).toBe(productData.price);
      expect(product.sku).toBe(productData.sku);
      expect(product.sellerId).toBe(seller.id);
    });

    it('should enforce SKU uniqueness', async () => {
      const productData = {
        sellerId: seller.id,
        name: 'Test Product',
        price: 99.99,
        sku: 'DUPLICATE-SKU',
        stockQuantity: 10,
        weight: 1.0,
        slug: 'test-product-1',
      };

      await Product.create(productData);
      
      await expect(Product.create({
        ...productData,
        slug: 'test-product-2',
      })).rejects.toThrow();
    });
  });

  describe('Category Model', () => {
    it('should create a category', async () => {
      const categoryData = {
        name: 'Electronics',
        description: 'Electronic devices and accessories',
      };

      const category = await Category.create(categoryData);
      
      expect(category.id).toBeDefined();
      expect(category.name).toBe(categoryData.name);
      expect(category.description).toBe(categoryData.description);
      expect(category.parentId).toBeNull();
    });

    it('should create a subcategory', async () => {
      const parent = await Category.create({
        name: 'Electronics',
        description: 'Electronic devices',
      });

      const subcategory = await Category.create({
        name: 'Smartphones',
        description: 'Mobile phones',
        parentId: parent.id,
      });

      expect(subcategory.parentId).toBe(parent.id);
    });
  });

  describe('Cart and CartItem Models', () => {
    let user: User;
    let product: Product;
    let seller: User;

    beforeEach(async () => {
      user = await User.create({
        email: 'cartuser@example.com',
        passwordHash: '$2b$10$hashedpassword',
        role: 'buyer',
        firstName: 'Cart User',
      });

      seller = await User.create({
        email: 'cartseller@example.com',
        passwordHash: '$2b$10$hashedpassword',
        role: 'seller',
        firstName: 'Cart Seller',
      });

      product = await Product.create({
        sellerId: seller.id,
        name: 'Cart Product',
        price: 50.00,
        sku: 'CART-001',
        stockQuantity: 5,
        weight: 1.0,
        slug: 'cart-product',
      });
    });

    it('should create a cart for user', async () => {
      const cart = await Cart.create({
        userId: user.id,
      });

      expect(cart.id).toBeDefined();
      expect(cart.userId).toBe(user.id);
    });

    it('should add items to cart', async () => {
      const cart = await Cart.create({
        userId: user.id,
      });

      const cartItem = await CartItem.create({
        cartId: cart.id,
        productId: product.id,
        quantity: 2,
        unitPriceAtAdd: product.price,
      });

      expect(cartItem.id).toBeDefined();
      expect(cartItem.cartId).toBe(cart.id);
      expect(cartItem.productId).toBe(product.id);
      expect(cartItem.quantity).toBe(2);
    });
  });

  describe('Coupon Model', () => {
    it('should create a percentage coupon', async () => {
      const couponData = {
        code: 'SAVE10',
        type: 'percent' as const,
        value: 10,
        minOrderAmount: 100,
        maxUses: 1000,
        perUserLimit: 1,
        startAt: new Date(),
        status: 'active' as const,
      };

      const coupon = await Coupon.create(couponData);
      
      expect(coupon.id).toBeDefined();
      expect(coupon.code).toBe(couponData.code);
      expect(coupon.type).toBe(couponData.type);
      expect(coupon.value).toBe(couponData.value);
    });

    it('should create a fixed amount coupon', async () => {
      const couponData = {
        code: 'FIXED20',
        type: 'fixed' as const,
        value: 20000,
        minOrderAmount: 50000,
        maxUses: 500,
        perUserLimit: 2,
        startAt: new Date(),
        status: 'active' as const,
      };

      const coupon = await Coupon.create(couponData);
      
      expect(coupon.type).toBe('fixed');
      expect(coupon.value).toBe(20000);
    });
  });

  describe('Model Associations', () => {
    let user: User;
    let seller: User;
    let product: Product;
    let category: Category;

    beforeEach(async () => {
      user = await User.create({
        email: 'assocuser@example.com',
        passwordHash: '$2b$10$hashedpassword',
        role: 'buyer',
        firstName: 'Association User',
      });

      seller = await User.create({
        email: 'assocseller@example.com',
        passwordHash: '$2b$10$hashedpassword',
        role: 'seller',
        firstName: 'Association Seller',
      });

      category = await Category.create({
        name: 'Test Category',
        description: 'A test category',
      });

      product = await Product.create({
        sellerId: seller.id,
        name: 'Association Product',
        price: 75.00,
        sku: 'ASSOC-001',
        stockQuantity: 8,
        weight: 2.0,
        slug: 'association-product',
      });
    });

    it('should load product with seller association', async () => {
      const productWithSeller = await Product.findByPk(product.id, {
        include: [{ model: User, as: 'seller' }],
      });

      expect(productWithSeller).toBeDefined();
      expect(productWithSeller!.seller).toBeDefined();
      expect(productWithSeller!.seller!.id).toBe(seller.id);
      expect(productWithSeller!.seller!.firstName).toBe('Association Seller');
    });

    it('should load user with addresses', async () => {
      await Address.create({
        userId: user.id,
        type: 'shipping',
        street1: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
      });

      const userWithAddresses = await User.findByPk(user.id, {
        include: [{ model: Address, as: 'addresses' }],
      });

      expect(userWithAddresses).toBeDefined();
      expect(userWithAddresses!.addresses).toBeDefined();
      expect(userWithAddresses!.addresses!.length).toBe(1);
      expect(userWithAddresses!.addresses![0]!.street1).toBe('123 Test St');
    });
  });
}); 