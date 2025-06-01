import { z } from 'zod';

// Cart item validation schemas
export const createCartItemSchema = z.object({
  productId: z
    .number({
      required_error: 'Product ID is required',
      invalid_type_error: 'Product ID must be a number',
    })
    .int()
    .positive('Product ID must be a positive integer'),

  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .int()
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity cannot exceed 100'),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .int()
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity cannot exceed 100'),
});

// Cart operation validation schemas
export const cartItemParamsSchema = z.object({
  cartItemId: z.string().transform(val => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      throw new Error('Cart item ID must be a positive integer');
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

// Bulk cart operations
export const bulkUpdateCartItemsSchema = z.object({
  items: z
    .array(
      z.object({
        cartItemId: z.number().int().positive('Cart item ID must be a positive integer'),
        quantity: z
          .number()
          .int()
          .min(1, 'Quantity must be at least 1')
          .max(100, 'Quantity cannot exceed 100'),
      })
    )
    .min(1, 'At least one item is required')
    .max(50, 'Cannot update more than 50 items at once'),
});

export const bulkRemoveCartItemsSchema = z.object({
  cartItemIds: z
    .array(z.number().int().positive('Cart item ID must be a positive integer'))
    .min(1, 'At least one cart item ID is required')
    .max(50, 'Cannot remove more than 50 items at once'),
});

// Cart to wishlist operations
export const moveToWishlistSchema = z.object({
  cartItemIds: z
    .array(z.number().int().positive('Cart item ID must be a positive integer'))
    .min(1, 'At least one cart item ID is required')
    .max(20, 'Cannot move more than 20 items at once'),

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
export type CreateCartItemInput = z.infer<typeof createCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CartItemParamsInput = z.infer<typeof cartItemParamsSchema>;
export type ProductParamsInput = z.infer<typeof productParamsSchema>;
export type BulkUpdateCartItemsInput = z.infer<typeof bulkUpdateCartItemsSchema>;
export type BulkRemoveCartItemsInput = z.infer<typeof bulkRemoveCartItemsSchema>;
export type MoveToWishlistInput = z.infer<typeof moveToWishlistSchema>;
