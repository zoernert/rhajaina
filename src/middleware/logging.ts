import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface LoggedRequest extends Request {
  requestId: string;
  startTime: number;
}

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const loggedReq = req as LoggedRequest;
  loggedReq.requestId = uuidv4();
  loggedReq.startTime = Date.now();

  // Log incoming request
  console.log(`[${new Date().toISOString()}] [${loggedReq.requestId}] ${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    body: req.method !== 'GET' ? req.body : undefined
  });

  // Override res.json to log responses
  const originalJson = res.json.bind(res);
  res.json = function(body: any) {
    const duration = Date.now() - loggedReq.startTime;
    
    console.log(`[${new Date().toISOString()}] [${loggedReq.requestId}] Response ${res.statusCode}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: res.statusCode < 400
    });

    // Add request ID to response meta
    if (body && typeof body === 'object' && 'meta' in body) {
      body.meta.requestId = loggedReq.requestId;
    }

    return originalJson(body);
  };

  next();
};

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const loggedReq = req as LoggedRequest;
  if (!loggedReq.requestId) {
    loggedReq.requestId = uuidv4();
  }
  next();
};
