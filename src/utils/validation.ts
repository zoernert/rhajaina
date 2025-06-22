import Joi from 'joi';
import { ValidationError as CustomValidationError } from './errors';

interface ValidationOptions {
  abortEarly?: boolean;
  allowUnknown?: boolean;
  stripUnknown?: boolean;
}

interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
  required?: boolean;
}

interface FileObject {
  size: number;
  mimetype: string;
  [key: string]: any;
}

/**
 * Common validation schemas
 */
export const schemas = {
  // Basic types
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).min(10).max(20),
  url: Joi.string().uri(),
  mongoId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  
  // User validation
  user: {
    register: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required(),
      firstName: Joi.string().min(2).max(50).required(),
      lastName: Joi.string().min(2).max(50).required(),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).min(10).max(20).optional()
    }),
    
    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }),
    
    update: Joi.object({
      firstName: Joi.string().min(2).max(50).optional(),
      lastName: Joi.string().min(2).max(50).optional(),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).min(10).max(20).optional()
    })
  },

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').default('asc')
  }),

  // Query parameters
  query: {
    search: Joi.object({
      q: Joi.string().min(1).max(100).optional(),
      filter: Joi.object().optional(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      sort: Joi.string().optional(),
      order: Joi.string().valid('asc', 'desc').default('asc')
    })
  }
};

/**
 * Validation helper functions for Moleculer services
 */
export const ValidationHelper = {
  /**
   * Validate data against a Joi schema
   */
  validate<T = any>(data: any, schema: Joi.Schema, options: ValidationOptions = {}): T {
    const defaultOptions: ValidationOptions = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    };

    const validationOptions = { ...defaultOptions, ...options };
    const { error, value } = schema.validate(data, validationOptions);

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      const field = error.details[0]?.path?.join('.') || undefined;
      throw new CustomValidationError(errorMessage, field);
    }

    return value;
  },

  /**
   * Validate action parameters for Moleculer services
   */
  validateParams<T = any>(data: any, schemaName: string): T {
    const schema = this.getSchema(schemaName);
    return this.validate(data, schema);
  },

  /**
   * Validate query parameters
   */
  validateQuery<T = any>(data: any, schemaName: string = 'pagination'): T {
    const schema = this.getSchema(schemaName);
    return this.validate(data, schema, { allowUnknown: true });
  },

  /**
   * Validate using custom schema
   */
  validateCustom<T = any>(data: any, customSchema: Joi.Schema): T {
    return this.validate(data, customSchema);
  },

  /**
   * Get schema by name
   */
  getSchema(schemaName: string): Joi.Schema {
    const schemaParts = schemaName.split('.');
    let schema: any = schemas;
    
    for (const part of schemaParts) {
      schema = schema[part];
      if (!schema) {
        throw new Error(`Schema '${schemaName}' not found`);
      }
    }
    
    return schema;
  },

  /**
   * Create custom validation schema
   */
  createSchema(definition: Record<string, Joi.Schema>): Joi.ObjectSchema {
    return Joi.object(definition);
  },

  /**
   * Validate array of items
   */
  validateArray<T = any>(data: any, itemSchema: Joi.Schema, options: ValidationOptions = {}): T[] {
    const arraySchema = Joi.array().items(itemSchema);
    return this.validate(data, arraySchema, options);
  },

  /**
   * Validate file upload
   */
  validateFile(file: FileObject | undefined, options: FileValidationOptions = {}): FileObject | undefined {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
      required = false
    } = options;

    if (!file && required) {
      throw new CustomValidationError('File is required');
    }

    if (file) {
      if (file.size > maxSize) {
        throw new CustomValidationError(`File size exceeds maximum allowed size of ${maxSize} bytes`);
      }

      if (!allowedTypes.includes(file.mimetype)) {
        throw new CustomValidationError(`File type '${file.mimetype}' is not allowed`);
      }
    }

    return file;
  }
};

/**
 * Moleculer service validation utilities
 */
export const MoleculerValidation = {
  /**
   * Create Joi validation for Moleculer action parameters
   * This converts Joi schema to Moleculer's fastest-validator format
   */
  createParamsSchema(joiSchema: Joi.ObjectSchema): Record<string, any> {
    // For now, return the Joi schema directly as Moleculer supports Joi
    // In the future, you might want to convert to fastest-validator format
    return joiSchema;
  },

  /**
   * Validate action context parameters
   */
  validateActionParams<T = any>(ctx: any, schemaName: string): T {
    try {
      return ValidationHelper.validateParams(ctx.params, schemaName);
    } catch (error) {
      // Re-throw as Moleculer validation error
      throw new CustomValidationError((error as Error).message);
    }
  },

  /**
   * Create validation middleware for Moleculer actions
   */
  createValidator(schemaName: string) {
    return (ctx: any) => {
      ctx.params = ValidationHelper.validateParams(ctx.params, schemaName);
      return ctx.params;
    };
  }
};

/**
 * Pre-defined parameter schemas for common operations
 */
export const paramSchemas = {
  id: Joi.object({
    id: schemas.mongoId.required()
  }),
  
  userId: Joi.object({
    userId: schemas.mongoId.required()
  }),

  // Moleculer service common schemas
  pagination: schemas.pagination,
  
  search: schemas.query.search
};

// Export Joi for custom schemas
export { Joi };

export default ValidationHelper;
