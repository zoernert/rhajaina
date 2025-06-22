/**
 * Base application error class that extends the native Error class.
 * Provides additional properties for HTTP status codes, operational flags, and timestamps.
 * 
 * @class AppError
 * @extends Error
 * @example
 * throw new AppError('Something went wrong', 500, true);
 */
class AppError extends Error {
  /**
   * Creates an instance of AppError.
   * 
   * @param {string} message - The error message
   * @param {number} [statusCode=500] - HTTP status code associated with the error
   * @param {boolean} [isOperational=true] - Whether this is an operational error (expected) or programming error
   * @memberof AppError
   */
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for invalid input data.
 * Used when user input fails validation rules.
 * 
 * @class ValidationError
 * @extends AppError
 * @example
 * throw new ValidationError('Email is required', 'email');
 */
class ValidationError extends AppError {
  /**
   * Creates an instance of ValidationError.
   * 
   * @param {string} message - The validation error message
   * @param {string|null} [field=null] - The field name that failed validation
   * @memberof ValidationError
   */
  constructor(message, field = null) {
    super(message, 400);
    this.field = field;
    this.type = 'validation';
  }
}

/**
 * Authentication error for login/token issues.
 * Used when user authentication fails or tokens are invalid.
 * 
 * @class AuthenticationError
 * @extends AppError
 * @example
 * throw new AuthenticationError('Invalid credentials');
 */
class AuthenticationError extends AppError {
  /**
   * Creates an instance of AuthenticationError.
   * 
   * @param {string} [message='Authentication failed'] - The authentication error message
   * @memberof AuthenticationError
   */
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.type = 'authentication';
  }
}

/**
 * Authorization error for permission issues.
 * Used when authenticated users lack permissions for specific actions.
 * 
 * @class AuthorizationError
 * @extends AppError
 * @example
 * throw new AuthorizationError('Insufficient permissions');
 */
class AuthorizationError extends AppError {
  /**
   * Creates an instance of AuthorizationError.
   * 
   * @param {string} [message='Access denied'] - The authorization error message
   * @memberof AuthorizationError
   */
  constructor(message = 'Access denied') {
    super(message, 403);
    this.type = 'authorization';
  }
}

/**
 * Not found error for missing resources.
 * Used when requested resources don't exist in the system.
 * 
 * @class NotFoundError
 * @extends AppError
 * @example
 * throw new NotFoundError('User');
 */
class NotFoundError extends AppError {
  /**
   * Creates an instance of NotFoundError.
   * 
   * @param {string} [resource='Resource'] - The name of the resource that was not found
   * @memberof NotFoundError
   */
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.type = 'not_found';
    this.resource = resource;
  }
}

/**
 * Conflict error for duplicate resources.
 * Used when attempting to create resources that already exist.
 * 
 * @class ConflictError
 * @extends AppError
 * @example
 * throw new ConflictError('Email already exists');
 */
class ConflictError extends AppError {
  /**
   * Creates an instance of ConflictError.
   * 
   * @param {string} [message='Resource already exists'] - The conflict error message
   * @memberof ConflictError
   */
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.type = 'conflict';
  }
}

/**
 * Database operation error.
 * Used when database operations fail or encounter issues.
 * 
 * @class DatabaseError
 * @extends AppError
 * @example
 * throw new DatabaseError('Connection timeout', originalDbError);
 */
class DatabaseError extends AppError {
  /**
   * Creates an instance of DatabaseError.
   * 
   * @param {string} [message='Database operation failed'] - The database error message
   * @param {Error|null} [originalError=null] - The original database error object
   * @memberof DatabaseError
   */
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500);
    this.type = 'database';
    this.originalError = originalError;
  }
}

/**
 * External API error.
 * Used when external service calls fail or return errors.
 * 
 * @class ExternalAPIError
 * @extends AppError
 * @example
 * throw new ExternalAPIError('Payment service unavailable', 'stripe', 503);
 */
class ExternalAPIError extends AppError {
  /**
   * Creates an instance of ExternalAPIError.
   * 
   * @param {string} [message='External API error'] - The API error message
   * @param {string|null} [service=null] - The name of the external service
   * @param {number} [statusCode=502] - HTTP status code from the external service
   * @memberof ExternalAPIError
   */
  constructor(message = 'External API error', service = null, statusCode = 502) {
    super(message, statusCode);
    this.type = 'external_api';
    this.service = service;
  }
}

/**
 * Rate limiting error.
 * Used when API rate limits are exceeded.
 * 
 * @class RateLimitError
 * @extends AppError
 * @example
 * throw new RateLimitError('Too many requests', 60);
 */
class RateLimitError extends AppError {
  /**
   * Creates an instance of RateLimitError.
   * 
   * @param {string} [message='Rate limit exceeded'] - The rate limit error message
   * @param {number|null} [retryAfter=null] - Seconds to wait before retrying
   * @memberof RateLimitError
   */
  constructor(message = 'Rate limit exceeded', retryAfter = null) {
    super(message, 429);
    this.type = 'rate_limit';
    this.retryAfter = retryAfter;
  }
}

/**
 * File operation error.
 * Used when file system operations fail.
 * 
 * @class FileError
 * @extends AppError
 * @example
 * throw new FileError('File not readable', 'read');
 */
class FileError extends AppError {
  /**
   * Creates an instance of FileError.
   * 
   * @param {string} [message='File operation failed'] - The file error message
   * @param {string|null} [operation=null] - The type of file operation that failed
   * @memberof FileError
   */
  constructor(message = 'File operation failed', operation = null) {
    super(message, 500);
    this.type = 'file';
    this.operation = operation;
  }
}

/**
 * Network/connection error.
 * Used when network operations fail or connections are lost.
 * 
 * @class NetworkError
 * @extends AppError
 * @example
 * throw new NetworkError('Connection timeout');
 */
class NetworkError extends AppError {
  /**
   * Creates an instance of NetworkError.
   * 
   * @param {string} [message='Network error occurred'] - The network error message
   * @memberof NetworkError
   */
  constructor(message = 'Network error occurred') {
    super(message, 503);
    this.type = 'network';
  }
}

/**
 * Error factory for creating appropriate error instances.
 * Provides a centralized way to create different types of errors.
 * 
 * @class ErrorFactory
 * @example
 * const error = ErrorFactory.createError('validation', 'Invalid email', { field: 'email' });
 */
class ErrorFactory {
  /**
   * Creates an error instance based on the specified type.
   * 
   * @static
   * @param {string} type - The type of error to create
   * @param {string} message - The error message
   * @param {Object} [options={}] - Additional options for the error
   * @param {string} [options.field] - Field name for validation errors
   * @param {string} [options.resource] - Resource name for not found errors
   * @param {Error} [options.originalError] - Original error for database errors
   * @param {string} [options.service] - Service name for external API errors
   * @param {number} [options.statusCode] - Status code for external API errors
   * @param {number} [options.retryAfter] - Retry delay for rate limit errors
   * @param {string} [options.operation] - Operation type for file errors
   * @returns {AppError} The created error instance
   * @memberof ErrorFactory
   * @example
   * ErrorFactory.createError('validation', 'Email is required', { field: 'email' });
   * ErrorFactory.createError('not_found', 'User not found', { resource: 'User' });
   */
  static createError(type, message, options = {}) {
    switch (type) {
      case 'validation':
        return new ValidationError(message, options.field);
      case 'authentication':
        return new AuthenticationError(message);
      case 'authorization':
        return new AuthorizationError(message);
      case 'not_found':
        return new NotFoundError(options.resource || message);
      case 'conflict':
        return new ConflictError(message);
      case 'database':
        return new DatabaseError(message, options.originalError);
      case 'external_api':
        return new ExternalAPIError(message, options.service, options.statusCode);
      case 'rate_limit':
        return new RateLimitError(message, options.retryAfter);
      case 'file':
        return new FileError(message, options.operation);
      case 'network':
        return new NetworkError(message);
      default:
        return new AppError(message, options.statusCode);
    }
  }
}

/**
 * Error handler utility functions.
 * Provides utilities for error processing, formatting, and analysis.
 * 
 * @namespace ErrorHandler
 */
const ErrorHandler = {
  /**
   * Check if error is operational (expected) or programming error.
   * Operational errors are expected errors that should be handled gracefully.
   * 
   * @param {Error} error - The error to check
   * @returns {boolean} True if the error is operational, false otherwise
   * @memberof ErrorHandler
   * @example
   * if (ErrorHandler.isOperationalError(error)) {
   *   // Handle gracefully
   * } else {
   *   // Log and exit
   * }
   */
  isOperationalError(error) {
    return error instanceof AppError && error.isOperational;
  },

  /**
   * Extract error details for logging.
   * Creates a structured object with all relevant error information.
   * 
   * @param {Error} error - The error to extract details from
   * @returns {Object} Object containing error details
   * @returns {string} returns.name - Error name
   * @returns {string} returns.message - Error message
   * @returns {number} returns.statusCode - HTTP status code
   * @returns {string} returns.type - Error type
   * @returns {string} returns.timestamp - Error timestamp
   * @returns {string} returns.stack - Error stack trace
   * @returns {string} returns.field - Field name (for validation errors)
   * @returns {string} returns.resource - Resource name (for not found errors)
   * @returns {string} returns.service - Service name (for external API errors)
   * @returns {string} returns.operation - Operation type (for file errors)
   * @returns {number} returns.retryAfter - Retry delay (for rate limit errors)
   * @returns {Error} returns.originalError - Original error (for database errors)
   * @memberof ErrorHandler
   * @example
   * const details = ErrorHandler.extractErrorDetails(error);
   * logger.error('Error occurred', details);
   */
  extractErrorDetails(error) {
    return {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      type: error.type,
      timestamp: error.timestamp,
      stack: error.stack,
      field: error.field,
      resource: error.resource,
      service: error.service,
      operation: error.operation,
      retryAfter: error.retryAfter,
      originalError: error.originalError
    };
  },

  /**
   * Format error for API response.
   * Creates a clean, safe error object suitable for client responses.
   * 
   * @param {Error} error - The error to format
   * @returns {Object} Formatted error object for API response
   * @returns {boolean} returns.error - Always true to indicate error response
   * @returns {string} returns.message - Error message
   * @returns {string} returns.timestamp - Error timestamp
   * @returns {string} returns.type - Error type (for AppError instances)
   * @returns {number} returns.statusCode - HTTP status code (for AppError instances)
   * @returns {string} returns.field - Field name (for validation errors)
   * @returns {string} returns.resource - Resource name (for not found errors)
   * @returns {number} returns.retryAfter - Retry delay (for rate limit errors)
   * @memberof ErrorHandler
   * @example
   * const response = ErrorHandler.formatForResponse(error);
   * res.status(response.statusCode || 500).json(response);
   */
  formatForResponse(error) {
    const baseResponse = {
      error: true,
      message: error.message,
      timestamp: error.timestamp || new Date().toISOString()
    };

    if (error instanceof AppError) {
      baseResponse.type = error.type;
      baseResponse.statusCode = error.statusCode;

      // Add specific fields based on error type
      if (error.field) baseResponse.field = error.field;
      if (error.resource) baseResponse.resource = error.resource;
      if (error.retryAfter) baseResponse.retryAfter = error.retryAfter;
    }

    return baseResponse;
  }
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalAPIError,
  RateLimitError,
  FileError,
  NetworkError,
  ErrorFactory,
  ErrorHandler
};
