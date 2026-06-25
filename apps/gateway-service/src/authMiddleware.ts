import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { ApiResponse } from '@platform/shared-types';

/**
 * Validates cryptographic authenticity signatures across incoming route lines
 */
export const authorizeJWT = (logger: any) => (req: Request, res: Response, next: NextFunction) => {
  // Define endpoints completely accessible without validation headers
  const publicPaths = ['/api/v1/auth/register', '/api/v1/auth/login'];

  if (publicPaths.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const errorRes: ApiResponse = {
      success: false,
      error: { code: 'UNAUTHORIZED', details: 'Missing or malformed Authorization header token' },
      timestamp: new Date().toISOString(),
    };
    return res.status(401).json(errorRes);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    // Inject parsed string representations of identity straight into upstream headers
    // to propagate state cleanly without forcing downstream services to perform database checks.
    req.headers['x-user-payload'] = JSON.stringify(decoded);
    next();
  } catch (err) {
    logger.warn('Cryptographic token checking processing signature failure:', err);
    const errorRes: ApiResponse = {
      success: false,
      error: { code: 'UNAUTHORIZED', details: 'Invalid or expired signature access token' },
      timestamp: new Date().toISOString(),
    };
    return res.status(401).json(errorRes);
  }
};
