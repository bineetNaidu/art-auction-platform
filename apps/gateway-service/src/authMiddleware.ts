import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { ApiResponse } from '@platform/shared-types';

interface TokenPayload {
  userId: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
}

/**
 * Validates cryptographic signatures and enforces strict Role-Based Access Control (RBAC)
 */
export const authorizeJWT = (logger: any) => (req: Request, res: Response, next: NextFunction) => {
  const { path, method } = req;

  // 1. PHASE 1: COMPREHENSIVE PUBLIC ROUTE PASSTHROUGH
  const isPublicAuth = path === '/api/v1/auth/register' || path === '/api/v1/auth/login';
  const isPublicCatalogRead =
    method === 'GET' &&
    (path.startsWith('/api/v1/artworks') || path.startsWith('/api/v1/auctions'));

  if (isPublicAuth || isPublicCatalogRead) {
    return next(); // Safely skip token verification for public viewing windows
  }

  // 2. PHASE 2: AUTHENTICATION TOKEN VERIFICATION
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const errorRes: ApiResponse = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        details: 'Access denied: Missing or malformed Authorization token header.',
      },
      timestamp: new Date().toISOString(),
    };
    return res.status(401).json(errorRes);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;

    // Inject parsed identity representations downstream for auditing tracking
    req.headers['x-user-payload'] = JSON.stringify(decoded);

    const userRole = decoded.role;

    // 3. PHASE 3: STRICT ROLE-BASED ACCESS CONTROL (RBAC) SECURITY ENFORCEMENT

    // Boundary Guard: Artwork Management
    if (path.startsWith('/api/v1/artworks')) {
      if (path.endsWith('/verify') && method === 'PATCH' && userRole !== 'admin') {
        return sendForbiddenResponse(
          res,
          'Administrative clearance mandatory to execute provenance verifications.',
        );
      }
      if (method === 'POST' && !['seller', 'admin'].includes(userRole)) {
        return sendForbiddenResponse(res, 'Seller credentials required to upload digital assets.');
      }
    }

    // Boundary Guard: Auction Lifecycle
    if (path.startsWith('/api/v1/auctions')) {
      if (path.endsWith('/cancel') && method === 'PATCH' && userRole !== 'admin') {
        return sendForbiddenResponse(
          res,
          'Administrative privileges required to terminate active auctions.',
        );
      }
      if (method === 'POST' && !['seller', 'admin'].includes(userRole)) {
        return sendForbiddenResponse(
          res,
          'Seller credentials required to schedule auction timelines.',
        );
      }
    }

    // Boundary Guard: High-Performance Bidding Engine
    if (path.startsWith('/api/v1/bids')) {
      if (method === 'POST' && userRole !== 'buyer') {
        return sendForbiddenResponse(
          res,
          'Bidding operations are restricted exclusively to verified collectors.',
        );
      }
    }

    // Boundary Guard: Analytical Infrastructure
    if (path.startsWith('/api/v1/analytics')) {
      if (userRole !== 'admin') {
        return sendForbiddenResponse(
          res,
          'Access Denied: Analytics dashboards are highly restricted data channels.',
        );
      }
    }

    // All structural criteria matched perfectly
    return next();
  } catch (err) {
    logger.warn(`Cryptographic validation failure encountered over path [${method} ${path}]:`, err);
    const errorRes: ApiResponse = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        details: 'Session expired or cryptographic signature token validation failed.',
      },
      timestamp: new Date().toISOString(),
    };
    return res.status(401).json(errorRes);
  }
};

/**
 * Clean reusable helper wrapping semantic security blocks
 */
function sendForbiddenResponse(res: Response, message: string): Response {
  const forbiddenRes: ApiResponse = {
    success: false,
    error: { code: 'FORBIDDEN', details: message },
    timestamp: new Date().toISOString(),
  };
  return res.status(403).json(forbiddenRes);
}
