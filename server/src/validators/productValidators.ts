import { z } from 'zod';

export class ProductValidators {
  // Product ID parameter validation
  static readonly productIdParam = z.object({
    id: z.string().transform(val => {
      const num = parseInt(val, 10);
      if (isNaN(num) || num <= 0) {
        throw new Error('Product ID must be a positive number');
      }
      return num;
    }),
  });

  // Create product validation
  static readonly createProduct = z.object({
    name: z
      .string()
      .min(1, 'Product name is required')
      .max(200, 'Product name must be less than 200 characters')
      .trim(),

    description: z.string().max(5000, 'Description must be less than 5000 characters').optional(),

    price: z
      .number()
      .positive('Price must be greater than 0')
      .max(999999999.99, 'Price is too large'),

    sku: z
      .string()
      .min(1, 'SKU is required')
      .max(50, 'SKU must be less than 50 characters')
      .regex(/^[A-Za-z0-9\-_]+$/, 'SKU can only contain letters, numbers, hyphens, and underscores')
      .trim(),

    stockQuantity: z
      .number()
      .int('Stock quantity must be an integer')
      .min(0, 'Stock quantity cannot be negative'),

    weight: z
      .number()
      .positive('Weight must be greater than 0')
      .max(99999.999, 'Weight is too large')
      .optional(),

    dimensions: z.string().max(100, 'Dimensions must be less than 100 characters').optional(),

    categoryIds: z
      .array(z.number().positive('Category ID must be positive'))
      .min(1, 'At least one category is required')
      .max(10, 'Maximum 10 categories allowed'),

    sellerId: z.number().positive('Seller ID must be positive'),
  });

  // Update product validation
  static readonly updateProduct = z.object({
    name: z
      .string()
      .min(1, 'Product name is required')
      .max(200, 'Product name must be less than 200 characters')
      .trim()
      .optional(),

    description: z.string().max(5000, 'Description must be less than 5000 characters').optional(),

    price: z
      .number()
      .positive('Price must be greater than 0')
      .max(999999999.99, 'Price is too large')
      .optional(),

    sku: z
      .string()
      .min(1, 'SKU is required')
      .max(50, 'SKU must be less than 50 characters')
      .regex(/^[A-Za-z0-9\-_]+$/, 'SKU can only contain letters, numbers, hyphens, and underscores')
      .trim()
      .optional(),

    stockQuantity: z
      .number()
      .int('Stock quantity must be an integer')
      .min(0, 'Stock quantity cannot be negative')
      .optional(),

    weight: z
      .number()
      .positive('Weight must be greater than 0')
      .max(99999.999, 'Weight is too large')
      .optional(),

    dimensions: z.string().max(100, 'Dimensions must be less than 100 characters').optional(),

    status: z
      .enum(['active', 'archived'], {
        errorMap: () => ({ message: 'Status must be either active or archived' }),
      })
      .optional(),

    categoryIds: z
      .array(z.number().positive('Category ID must be positive'))
      .max(10, 'Maximum 10 categories allowed')
      .optional(),
  });

  // List products query validation
  static readonly listProductsQuery = z.object({
    page: z
      .string()
      .transform(val => parseInt(val, 10))
      .refine(val => !isNaN(val) && val > 0, 'Page must be a positive number')
      .optional(),

    limit: z
      .string()
      .transform(val => parseInt(val, 10))
      .refine(val => !isNaN(val) && val > 0 && val <= 100, 'Limit must be between 1 and 100')
      .optional(),

    status: z.enum(['active', 'archived']).optional(),

    search: z.string().max(100, 'Search term must be less than 100 characters').optional(),

    category: z
      .string()
      .transform(val => parseInt(val, 10))
      .refine(val => !isNaN(val) && val > 0, 'Category must be a positive number')
      .optional(),

    minPrice: z
      .string()
      .transform(val => parseFloat(val))
      .refine(val => !isNaN(val) && val >= 0, 'Minimum price must be a non-negative number')
      .optional(),

    maxPrice: z
      .string()
      .transform(val => parseFloat(val))
      .refine(val => !isNaN(val) && val >= 0, 'Maximum price must be a non-negative number')
      .optional(),

    sellerId: z
      .string()
      .transform(val => parseInt(val, 10))
      .refine(val => !isNaN(val) && val > 0, 'Seller ID must be a positive number')
      .optional(),
  });

  // Public products query validation
  static readonly publicProductsQuery = z.object({
    page: z
      .string()
      .transform(val => parseInt(val, 10))
      .refine(val => !isNaN(val) && val > 0, 'Page must be a positive number')
      .optional(),

    limit: z
      .string()
      .transform(val => parseInt(val, 10))
      .refine(val => !isNaN(val) && val > 0 && val <= 100, 'Limit must be between 1 and 100')
      .optional(),

    search: z.string().max(100, 'Search term must be less than 100 characters').optional(),

    category: z
      .string()
      .transform(val => parseInt(val, 10))
      .refine(val => !isNaN(val) && val > 0, 'Category must be a positive number')
      .optional(),

    minPrice: z
      .string()
      .transform(val => parseFloat(val))
      .refine(val => !isNaN(val) && val >= 0, 'Minimum price must be a non-negative number')
      .optional(),

    maxPrice: z
      .string()
      .transform(val => parseFloat(val))
      .refine(val => !isNaN(val) && val >= 0, 'Maximum price must be a non-negative number')
      .optional(),

    sort: z
      .enum(['priceAsc', 'priceDesc', 'rating', 'newest'], {
        errorMap: () => ({ message: 'Sort must be one of: priceAsc, priceDesc, rating, newest' }),
      })
      .optional(),
  });

  // Update stock validation
  static readonly updateStock = z.object({
    stockQuantity: z
      .number()
      .int('Stock quantity must be an integer')
      .min(0, 'Stock quantity cannot be negative'),

    reason: z
      .string()
      .min(1, 'Reason is required')
      .max(50, 'Reason must be less than 50 characters')
      .trim(),
  });
}
