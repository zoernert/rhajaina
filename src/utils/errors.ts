interface AppErrorOptions {
  statusCode?: number;
  field?: string;
  resource?: string;
  originalError?: Error;
  service?: string;
  retryAfter?: number;
  operation?: string;
}

/**
 * Base application error class that extends the native Error class.
 * Provides additional properties for HTTP status codes, operational flags, and timestamps.
 */
export class AppError extends Error {
  public readonly name: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly type?: string;
  public readonly field?: string;
  public readonly resource?: string;
  public readonly service?: string;
  public readonly retryAfter?: number;
  public readonly operation?: string;
  public readonly originalError?: Error;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
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
 */
export class ValidationError extends AppError {
  public readonly type = 'validation';
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 400);
    this.field = field;
  }
}

/**
 * Authentication error for login/token issues.
 * Used when user authentication fails or tokens are invalid.
 */
export class AuthenticationError extends AppError {
  public readonly type = 'authentication';

  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

/**
 * Authorization error for permission issues.
 * Used when authenticated users lack permissions for specific actions.
 */
export class AuthorizationError extends AppError {
  public readonly type = 'authorization';

  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

/**
 * Not found error for missing resources.
 * Used when requested resources don't exist in the system.
 */
export class NotFoundError extends AppError {
  public readonly type = 'not_found';
  public readonly resource: string;

  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
    this.resource = resource;
  }
}

/**
 * Conflict error for duplicate resources.
 * Used when attempting to create resources that already exist.
 */
export class ConflictError extends AppError {
  public readonly type = 'conflict';

  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}

/**
 * Database operation error.
 * Used when database operations fail or encounter issues.
 */
export class DatabaseError extends AppError {
  public readonly type = 'database';
  public readonly originalError?: Error;

  constructor(message: string = 'Database operation failed', originalError?: Error) {
    super(message, 500);
    this.originalError = originalError;
  }
}

/**
 * External API error.
 * Used when external service calls fail or return errors.
 */
export class ExternalAPIError extends AppError {
  public readonly type = 'external_api';
  public readonly service?: string;

  constructor(message: string = 'External API error', service?: string, statusCode: number = 502) {
    super(message, statusCode);
    this.service = service;
  }
}

/**
 * Rate limiting error.
 * Used when API rate limits are exceeded.
 */
export class RateLimitError extends AppError {
  public readonly type = 'rate_limit';
  public readonly retryAfter?: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429);
    this.retryAfter = retryAfter;
  }
}

/**
 * File operation error.
 * Used when file system operations fail.
 */
export class FileError extends AppError {
  public readonly type = 'file';
  public readonly operation?: string;

  constructor(message: string = 'File operation failed', operation?: string) {
    super(message, 500);
    this.operation = operation;
  }
}

/**
 * Network/connection error.
 * Used when network operations fail or connections are lost.
 */
export class NetworkError extends AppError {
  public readonly type = 'network';

  constructor(message: string = 'Network error occurred') {
    super(message, 503);
  }
}

/**
 * Error factory for creating appropriate error instances.
 * Provides a centralized way to create different types of errors.
 */
export class ErrorFactory {
  static createError(type: string, message: string, options: AppErrorOptions = {}): AppError {
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

interface ErrorDetails {
  name: string;
  message: string;
  statusCode?: number;
  type?: string;
  timestamp?: string;
  stack?: string;
  field?: string;
  resource?: string;
  service?: string;
  operation?: string;
  retryAfter?: number;
  originalError?: Error;
}

interface ErrorResponse {
  error: boolean;
  message: string;
  timestamp: string;
  type?: string;
  statusCode?: number;
  field?: string;
  resource?: string;
  retryAfter?: number;
}

/**
 * Error handler utility functions.
 * Provides utilities for error processing, formatting, and analysis.
 */
export const ErrorHandler = {
  /**
   * Check if error is operational (expected) or programming error.
   * Operational errors are expected errors that should be handled gracefully.
   */
  isOperationalError(error: Error): boolean {
    return error instanceof AppError && error.isOperational;
  },

  /**
   * Extract error details for logging.
   * Creates a structured object with all relevant error information.
   */
  extractErrorDetails(error: Error): ErrorDetails {
    const appError = error as AppError;
    return {
      name: error.name,
      message: error.message,
      statusCode: appError.statusCode,
      type: appError.type,
      timestamp: appError.timestamp,
      stack: error.stack,
      field: appError.field,
      resource: appError.resource,
      service: appError.service,
      operation: appError.operation,
      retryAfter: appError.retryAfter,
      originalError: appError.originalError
    };
  },

  /**
   * Format error for API response.
   * Creates a clean, safe error object suitable for client responses.
   */
  formatForResponse(error: Error): ErrorResponse {
    const appError = error as AppError;
    const baseResponse: ErrorResponse = {
      error: true,
      message: error.message,
      timestamp: appError.timestamp || new Date().toISOString()
    };

    if (error instanceof AppError) {
      baseResponse.type = appError.type;
      baseResponse.statusCode = appError.statusCode;

      // Add specific fields based on error type
      if (appError.field) baseResponse.field = appError.field;
      if (appError.resource) baseResponse.resource = appError.resource;
      if (appError.retryAfter) baseResponse.retryAfter = appError.retryAfter;
    }

    return baseResponse;
  }
};

// Export all error types for convenience
export {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalAPIError,
  RateLimitError,
  FileError,
  NetworkError
};

export default AppError;
