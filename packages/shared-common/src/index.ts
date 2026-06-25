import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiResponse } from '@platform/shared-types';

/**
 * Reusable Express middleware running structural input sanitization over incoming body data
 */
export const validateBody =
  (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrorRes: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(400).json(validationErrorRes);
      }
      return next(error);
    }
  };

/**
 * Global Exception Interceptor catching all unhandled async errors at runtime
 */
export const errorHandler =
  (logger: any) => (err: any, _req: Request, res: Response, _next: NextFunction) => {
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
