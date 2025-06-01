import { z } from 'zod';

// Wishlist validation schemas
export const createWishlistSchema = z.object({
  name: z
    .string({
      required_error: 'Wishlist name is required',
      invalid_type_error: 'Wishlist name must be a string',
    })
    .min(1, 'Wishlist name cannot be empty')
    .max(100, 'Wishlist name cannot exceed 100 characters'),

  isPublic: z
    .boolean({
      invalid_type_error: 'isPublic must be a boolean',
    })
    .optional()
    .default(false),
});

export const updateWishlistSchema = z
  .object({
    name: z
      .string({
        invalid_type_error: 'Wishlist name must be a string',
      })
      .min(1, 'Wishlist name cannot be empty')
      .max(100, 'Wishlist name cannot exceed 100 characters')
      .optional(),

    isPublic: z
      .boolean({
        invalid_type_error: 'isPublic must be a boolean',
      })
      .optional(),
  })
  .refine(data => data.name !== undefined || data.isPublic !== undefined, {
    message: 'At least one field (name or isPublic) must be provided',
  });

// Wishlist item validation schemas
export const createWishlistItemSchema = z.object({
  productId: z
    .number({
      required_error: 'Product ID is required',
      invalid_type_error: 'Product ID must be a number',
    })
    .int()
    .positive('Product ID must be a positive integer'),

  wishlistId: z
    .number({
      required_error: 'Wishlist ID is required',
      invalid_type_error: 'Wishlist ID must be a number',
    })
    .int()
    .positive('Wishlist ID must be a positive integer')
    .optional(),
});

// Parameter validation schemas
export const wishlistParamsSchema = z.object({
  wishlistId: z.string().transform(val => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      throw new Error('Wishlist ID must be a positive integer');
    }
    return num;
  }),
});

export const wishlistItemParamsSchema = z.object({
  wishlistItemId: z.string().transform(val => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      throw new Error('Wishlist item ID must be a positive integer');
    }
    return num;
  }),
});

export const productParamsSchema = z.object({
  productId: z.string().transform(val => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      throw new Error('Product ID must be a positive integer');
    }
    return num;
  }),
});

// Query parameter schemas
export const wishlistQuerySchema = z.object({
  page: z
    .string()
    .transform(val => {
      const num = parseInt(val, 10);
      return isNaN(num) || num < 1 ? 1 : num;
    })
    .optional(),

  limit: z
    .string()
    .transform(val => {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1) return 20;
      return Math.min(num, 100); // Cap at 100
    })
    .optional(),

  search: z.string().max(255, 'Search term cannot exceed 255 characters').optional(),
  isPublic: z
    .string()
    .transform(val => val === 'true')
    .optional(),
});

export const wishlistItemQuerySchema = z.object({
  page: z
    .string()
    .transform(val => {
      const num = parseInt(val, 10);
      return isNaN(num) || num < 1 ? 1 : num;
    })
    .optional(),

  limit: z
    .string()
    .transform(val => {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1) return 20;
      return Math.min(num, 100); // Cap at 100
    })
    .optional(),
});

// Bulk operations schemas
export const bulkRemoveWishlistItemsSchema = z.object({
  wishlistItemIds: z
    .array(z.number().int().positive('Wishlist item ID must be a positive integer'))
    .min(1, 'At least one wishlist item ID is required')
    .max(50, 'Cannot remove more than 50 items at once'),
});

export const moveWishlistItemsSchema = z.object({
  itemIds: z
    .array(z.number().int().positive('Item ID must be a positive integer'))
    .min(1, 'At least one item ID is required')
    .max(20, 'Cannot move more than 20 items at once'),

  targetWishlistId: z
    .number({
      required_error: 'Target wishlist ID is required',
      invalid_type_error: 'Target wishlist ID must be a number',
    })
    .int()
    .positive('Target wishlist ID must be a positive integer'),
});

// Copy from cart to wishlist
export const copyFromCartSchema = z.object({
  cartItemIds: z
    .array(z.number().int().positive('Cart item ID must be a positive integer'))
    .min(1, 'At least one cart item ID is required')
    .max(20, 'Cannot copy more than 20 items at once'),

  wishlistId: z
    .number({
      required_error: 'Wishlist ID is required',
      invalid_type_error: 'Wishlist ID must be a number',
    })
    .int()
    .positive('Wishlist ID must be a positive integer')
    .optional(),
});

// Export types for TypeScript
export type CreateWishlistInput = z.infer<typeof createWishlistSchema>;
export type UpdateWishlistInput = z.infer<typeof updateWishlistSchema>;
export type CreateWishlistItemInput = z.infer<typeof createWishlistItemSchema>;
export type WishlistParamsInput = z.infer<typeof wishlistParamsSchema>;
export type WishlistItemParamsInput = z.infer<typeof wishlistItemParamsSchema>;
export type ProductParamsInput = z.infer<typeof productParamsSchema>;
export type WishlistQueryInput = z.infer<typeof wishlistQuerySchema>;
export type WishlistItemQueryInput = z.infer<typeof wishlistItemQuerySchema>;
export type BulkRemoveWishlistItemsInput = z.infer<typeof bulkRemoveWishlistItemsSchema>;
export type MoveWishlistItemsInput = z.infer<typeof moveWishlistItemsSchema>;
export type CopyFromCartInput = z.infer<typeof copyFromCartSchema>;
