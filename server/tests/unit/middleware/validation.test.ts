import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams } from '@/middleware/validation';
import { ValidationError } from '@/types/errors';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('validateBody', () => {
    const testSchema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      age: z.number().min(18).optional()
    });

    it('should validate valid body data', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      };

      const middleware = validateBody(testSchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should transform and validate data', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: '25' // String that should be transformed to number
      };

      const schemaWithTransform = z.object({
        name: z.string(),
        email: z.string().email(),
        age: z.coerce.number()
      });

      const middleware = validateBody(schemaWithTransform);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.body.age).toBe(25);
      expect(typeof mockRequest.body.age).toBe('number');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject invalid body data', () => {
      mockRequest.body = {
        name: 'J', // Too short
        email: 'invalid-email',
        age: 16 // Too young
      };

      const middleware = validateBody(testSchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      
      const error = mockNext.mock.calls[0][0] as ValidationError;
      expect(error.details).toHaveLength(3);
      expect(error.details).toContainEqual(
        expect.objectContaining({
          field: 'name'
        })
      );
      expect(error.details).toContainEqual(
        expect.objectContaining({
          field: 'email'
        })
      );
      expect(error.details).toContainEqual(
        expect.objectContaining({
          field: 'age'
        })
      );
    });

    it('should handle missing required fields', () => {
      mockRequest.body = {};

      const middleware = validateBody(testSchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      
      const error = mockNext.mock.calls[0][0] as ValidationError;
      expect(error.details).toContainEqual(
        expect.objectContaining({
          field: 'name'
        })
      );
      expect(error.details).toContainEqual(
        expect.objectContaining({
          field: 'email'
        })
      );
    });

    it('should work with optional fields', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com'
        // age is optional
      };

      const middleware = validateBody(testSchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should strip unknown fields', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
        unknownField: 'should be removed'
      };

      const middleware = validateBody(testSchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.body).not.toHaveProperty('unknownField');
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('validateQuery', () => {
    const querySchema = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      search: z.string().optional(),
      status: z.enum(['active', 'inactive']).optional()
    });

    it('should validate valid query parameters', () => {
      mockRequest.query = {
        page: '2',
        limit: '30',
        search: 'test',
        status: 'active'
      };

      const middleware = validateQuery(querySchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.query.page).toBe(2);
      expect(mockRequest.query.limit).toBe(30);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should apply default values', () => {
      mockRequest.query = {};

      const middleware = validateQuery(querySchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.query.page).toBe(1);
      expect(mockRequest.query.limit).toBe(20);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject invalid query parameters', () => {
      mockRequest.query = {
        page: '0', // Invalid: too small
        limit: '150', // Invalid: too large
        status: 'invalid' // Invalid enum value
      };

      const middleware = validateQuery(querySchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      
      const error = mockNext.mock.calls[0][0] as ValidationError;
      expect(error.details).toHaveLength(3);
    });

    it('should handle array query parameters', () => {
      const arraySchema = z.object({
        tags: z.array(z.string()).optional(),
        ids: z.array(z.coerce.number()).optional()
      });

      mockRequest.query = {
        tags: ['tag1', 'tag2'],
        ids: ['1', '2', '3']
      };

      const middleware = validateQuery(arraySchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.query.tags).toEqual(['tag1', 'tag2']);
      expect(mockRequest.query.ids).toEqual([1, 2, 3]);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('validateParams', () => {
    const paramsSchema = z.object({
      id: z.coerce.number().positive(),
      slug: z.string().min(1).optional()
    });

    it('should validate valid path parameters', () => {
      mockRequest.params = {
        id: '123',
        slug: 'test-slug'
      };

      const middleware = validateParams(paramsSchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.params.id).toBe(123);
      expect(mockRequest.params.slug).toBe('test-slug');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject invalid path parameters', () => {
      mockRequest.params = {
        id: 'abc', // Invalid: not a number
        slug: '' // Invalid: empty string
      };

      const middleware = validateParams(paramsSchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      
      const error = mockNext.mock.calls[0][0] as ValidationError;
      expect(error.details).toHaveLength(2);
      expect(error.details).toContainEqual(
        expect.objectContaining({
          field: 'id'
        })
      );
      expect(error.details).toContainEqual(
        expect.objectContaining({
          field: 'slug'
        })
      );
    });

    it('should handle missing required parameters', () => {
      mockRequest.params = {};

      const middleware = validateParams(paramsSchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      
      const error = mockNext.mock.calls[0][0] as ValidationError;
      expect(error.details).toContainEqual(
        expect.objectContaining({
          field: 'id'
        })
      );
    });

    it('should work with only required parameters', () => {
      mockRequest.params = {
        id: '456'
      };

      const middleware = validateParams(paramsSchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.params.id).toBe(456);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('error handling', () => {
    it('should format validation errors correctly', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18)
      });

      mockRequest.body = {
        email: 'invalid',
        age: 16
      };

      const middleware = validateBody(schema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      
      const error = mockNext.mock.calls[0][0] as ValidationError;
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.details).toHaveLength(2);
      
      const emailError = error.details.find(e => e.field === 'email');
      const ageError = error.details.find(e => e.field === 'age');
      
      expect(emailError).toBeDefined();
      expect(ageError).toBeDefined();
      expect(emailError?.message).toContain('email');
      expect(ageError?.message).toContain('18');
    });

    it('should handle nested validation errors', () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(2),
          profile: z.object({
            age: z.number().min(18)
          })
        })
      });

      mockRequest.body = {
        user: {
          name: 'J',
          profile: {
            age: 16
          }
        }
      };

      const middleware = validateBody(schema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      
      const error = mockNext.mock.calls[0][0] as ValidationError;
      expect(error.details).toHaveLength(2);
      expect(error.details).toContainEqual(
        expect.objectContaining({
          field: 'user.name'
        })
      );
      expect(error.details).toContainEqual(
        expect.objectContaining({
          field: 'user.profile.age'
        })
      );
    });
  });
}); 