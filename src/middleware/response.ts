import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '../types/response';
import { ErrorHandler } from '../utils/error-handler';

export function withErrorHandling(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      const errorResponse = ErrorHandler.handle(error);
      return NextResponse.json(errorResponse, {
        status: getStatusCode(errorResponse),
      });
    }
  };
}

export function createResponse(
  data: ApiResponse,
  statusCode?: number
): NextResponse {
  const status = statusCode || getStatusCode(data);
  return NextResponse.json(data, { status });
}

function getStatusCode(response: ApiResponse): number {
  if (response.success) {
    return 200;
  }

  const errorCode = response.error?.code;
  switch (errorCode) {
    case 'VALIDATION_ERROR':
      return 400;
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'SERVER_ERROR':
    default:
      return 500;
  }
}
