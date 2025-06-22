import { Response } from 'express';
import { ApiResponse, ErrorCode, ERROR_STATUS_MAP } from '../types/response';
import { ApiError } from '../middleware/errorHandler';

export const createSuccessResponse = <T>(
  data: T,
  meta?: Partial<ApiResponse['meta']>
): ApiResponse<T> => ({
  success: true,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    ...meta
  }
});

export const createErrorResponse = (
  code: ErrorCode,
  message: string,
  details?: any,
  meta?: Partial<ApiResponse['meta']>
): ApiResponse => ({
  success: false,
  error: {
    code,
    message,
    details
  },
  meta: {
    timestamp: new Date().toISOString(),
    ...meta
  }
});

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: Partial<ApiResponse['meta']>
) => {
  const response = createSuccessResponse(data, meta);
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  code: ErrorCode,
  message: string,
  details?: any,
  meta?: Partial<ApiResponse['meta']>
) => {
  const response = createErrorResponse(code, message, details, meta);
  const statusCode = ERROR_STATUS_MAP[code] || 500;
  res.status(statusCode).json(response);
};

export const sendValidationError = (
  res: Response,
  errors: Record<string, string[]>,
  message: string = 'Validation failed'
) => {
  const response = createErrorResponse(
    ErrorCode.VALIDATION_ERROR, 
    message, 
    { validationErrors: errors }
  );
  res.status(400).json(response);
};
