import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@platform/shared-types';

/**
 * Global Exception Interceptor catching all unhandled async errors runtime events
 */
export const errorHandler =
  (logger: any) => (err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Capture the error stack internally inside logs
    logger.error('Unhandled Microservice Core Exception Intercepted:', err);

    const errorEnvelope: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        details:
          process.env.NODE_ENV === 'development'
            ? err.message
            : 'An unexpected error occurred internally.',
      },
      timestamp: new Date().toISOString(),
    };

    return res.status(500).json(errorEnvelope);
  };
