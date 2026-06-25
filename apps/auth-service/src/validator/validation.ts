import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiResponse } from '@platform/shared-types';

/**
 * Reusable Express middleware running structural input sanitization over incoming body data
 */
export const validateBody =
  (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse input against schema parameters
      await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Map Zod issue matrices cleanly back into the validation envelope
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
