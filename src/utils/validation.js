const Joi = require('joi');
const { ValidationError } = require('./errors');

/**
 * Common validation schemas
 */
const schemas = {
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
      ...schemas.pagination.describe().keys
    })
  }
};

/**
 * Validation helper functions
 */
const ValidationHelper = {
  /**
   * Validate data against a Joi schema
   */
  validate(data, schema, options = {}) {
    const defaultOptions = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    };

    const validationOptions = { ...defaultOptions, ...options };
    const { error, value } = schema.validate(data, validationOptions);

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      const field = error.details[0]?.path?.join('.') || null;
      throw new ValidationError(errorMessage, field);
    }

    return value;
  },

  /**
   * Validate request body
   */
  validateBody(data, schemaName) {
    const schema = this.getSchema(schemaName);
    return this.validate(data, schema);
  },

  /**
   * Validate query parameters
   */
  validateQuery(data, schemaName = 'pagination') {
    const schema = this.getSchema(schemaName);
    return this.validate(data, schema, { allowUnknown: true });
  },

  /**
   * Validate URL parameters
   */
  validateParams(data, customSchema) {
    return this.validate(data, customSchema);
  },

  /**
   * Get schema by name
   */
  getSchema(schemaName) {
    const schemaParts = schemaName.split('.');
    let schema = schemas;
    
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
  createSchema(definition) {
    return Joi.object(definition);
  },

  /**
   * Validate array of items
   */
  validateArray(data, itemSchema, options = {}) {
    const arraySchema = Joi.array().items(itemSchema);
    return this.validate(data, arraySchema, options);
  },

  /**
   * Validate file upload
   */
  validateFile(file, options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
      required = false
    } = options;

    if (!file && required) {
      throw new ValidationError('File is required');
    }

    if (file) {
      if (file.size > maxSize) {
        throw new ValidationError(`File size exceeds maximum allowed size of ${maxSize} bytes`);
      }

      if (!allowedTypes.includes(file.mimetype)) {
        throw new ValidationError(`File type '${file.mimetype}' is not allowed`);
      }
    }

    return file;
  }
};

/**
 * Express middleware for validation
 */
const validationMiddleware = {
  /**
   * Validate request body
   */
  body(schemaName) {
    return (req, res, next) => {
      try {
        req.body = ValidationHelper.validateBody(req.body, schemaName);
        next();
      } catch (error) {
        next(error);
      }
    };
  },

  /**
   * Validate query parameters
   */
  query(schemaName = 'pagination') {
    return (req, res, next) => {
      try {
        req.query = ValidationHelper.validateQuery(req.query, schemaName);
        next();
      } catch (error) {
        next(error);
      }
    };
  },

  /**
   * Validate URL parameters
   */
  params(customSchema) {
    return (req, res, next) => {
      try {
        req.params = ValidationHelper.validateParams(req.params, customSchema);
        next();
      } catch (error) {
        next(error);
      }
    };
  },

  /**
   * Custom validation middleware
   */
  custom(validationFn) {
    return (req, res, next) => {
      try {
        validationFn(req);
        next();
      } catch (error) {
        next(error);
      }
    };
  }
};

/**
 * Pre-defined parameter schemas
 */
const paramSchemas = {
  id: Joi.object({
    id: schemas.mongoId.required()
  }),
  
  userId: Joi.object({
    userId: schemas.mongoId.required()
  })
};

module.exports = {
  schemas,
  ValidationHelper,
  validationMiddleware,
  paramSchemas,
  Joi // Export Joi for custom schemas
};
