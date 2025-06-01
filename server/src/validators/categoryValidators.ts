import { z } from 'zod';

export class CategoryValidators {
  // Category ID parameter validation
  static readonly categoryIdParam = z.object({
    id: z.string().transform(val => {
      const num = parseInt(val, 10);
      if (isNaN(num) || num <= 0) {
        throw new Error('Category ID must be a positive number');
      }
      return num;
    }),
  });

  // Create category validation
  static readonly createCategory = z.object({
    name: z
      .string()
      .min(1, 'Category name is required')
      .max(100, 'Category name must be less than 100 characters')
      .trim(),

    description: z.string().max(500, 'Description must be less than 500 characters').optional(),

    parentId: z.number().positive('Parent ID must be positive').optional().nullable(),
  });

  // Update category validation
  static readonly updateCategory = z.object({
    name: z
      .string()
      .min(1, 'Category name is required')
      .max(100, 'Category name must be less than 100 characters')
      .trim()
      .optional(),

    description: z.string().max(500, 'Description must be less than 500 characters').optional(),

    parentId: z.number().positive('Parent ID must be positive').optional().nullable(),
  });

  // List categories query validation
  static readonly listCategoriesQuery = z.object({
    includeEmpty: z
      .string()
      .transform(val => val === 'true')
      .optional(),
  });
}
