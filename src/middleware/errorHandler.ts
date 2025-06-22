import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ErrorCode, ERROR_STATUS_MAP } from '../types/response';

export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(code: ErrorCode, message: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = ERROR_STATUS_MAP[code];
    this.details = details;
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = (req as any).requestId || 'unknown';
  
  // Log error
  console.error(`[${new Date().toISOString()}] [${requestId}] Error:`, {
    name: error.name,
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  let response: ApiResponse;

  if (error instanceof ApiError) {
    // Handle known API errors
    response = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId
      }
    };
    res.status(error.statusCode);
  } else {
    // Handle unknown errors
    response = {
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId
      }
    };
    res.status(500);
  }

  res.json(response);
};

export const notFoundHandler = (req: Request, res: Response) => {
  const requestId = (req as any).requestId || 'unknown';
  
  const response: ApiResponse = {
    success: false,
    error: {
      code: ErrorCode.NOT_FOUND,
      message: `Route ${req.method} ${req.url} not found`
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId
    }
  };

  res.status(404).json(response);
};
