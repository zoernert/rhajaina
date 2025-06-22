import { ApiResponse } from '../types/response';
import { ResponseBuilder } from './response-builder';

export class ErrorHandler {
  static handle(error: unknown): ApiResponse {
    if (error instanceof ValidationError) {
      return ResponseBuilder.validationError(error.errors, error.message);
    }

    if (error instanceof NotFoundError) {
      return ResponseBuilder.notFound(error.resource);
    }

    if (error instanceof UnauthorizedError) {
      return ResponseBuilder.unauthorized(error.message);
    }

    if (error instanceof ForbiddenError) {
      return ResponseBuilder.forbidden(error.message);
    }

    if (error instanceof Error) {
      console.error('Unhandled error:', error);
      return ResponseBuilder.serverError(
        process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      );
    }

    console.error('Unknown error:', error);
    return ResponseBuilder.serverError();
  }
}

export class ValidationError extends Error {
  constructor(
    public errors: Record<string, string[]>,
    message = 'Validation failed'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(public resource = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
