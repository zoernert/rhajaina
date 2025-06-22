import { ApiResponse, ErrorCode } from '../types/response';

export class ResponseBuilder {
  static success<T>(data: T, metadata?: Record<string, any>): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  static error(code: ErrorCode, message: string, details?: any): ApiResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  static validationError(errors: Record<string, string[]>, message = 'Validation failed'): ApiResponse {
    return this.error(ErrorCode.VALIDATION_ERROR, message, { validationErrors: errors });
  }

  static notFound(resource = 'Resource'): ApiResponse {
    return this.error(ErrorCode.NOT_FOUND, `${resource} not found`);
  }

  static unauthorized(message = 'Unauthorized access'): ApiResponse {
    return this.error(ErrorCode.UNAUTHORIZED, message);
  }

  static forbidden(message = 'Access forbidden'): ApiResponse {
    return this.error(ErrorCode.FORBIDDEN, message);
  }

  static serverError(message = 'Internal server error'): ApiResponse {
    return this.error(ErrorCode.INTERNAL_ERROR, message);
  }

  static conflict(message = 'Resource conflict'): ApiResponse {
    return this.error(ErrorCode.CONFLICT, message);
  }

  static badRequest(message = 'Bad request'): ApiResponse {
    return this.error(ErrorCode.BAD_REQUEST, message);
  }

  static tooManyRequests(message = 'Too many requests'): ApiResponse {
    return this.error(ErrorCode.TOO_MANY_REQUESTS, message);
  }
}

export default ResponseBuilder;
