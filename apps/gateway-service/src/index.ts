import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from './config';
import { rateLimit } from 'express-rate-limit';
import { authorizeJWT } from './authMiddleware';
import { createLogger } from '@platform/shared-logger';
import { ApiResponse } from '@platform/shared-types';

const logger = createLogger('gateway-service:main');
const app = express();

/**
 * Configure Cross-Origin Resource Sharing (CORS) Policy
 * Expressly authorizes our containerized/local Next.js frontend origin
 */
app.use(
  cors({
    origin: 'http://localhost:3000', // Matches your apps/web server address
    credentials: true, // Permits cookie attachments or Authorization headers across origins
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

/**
 * Configure Global Rate Limiter to mitigate DDoS/Brute-Force vectors at the edge
 */
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minute observation window
  limit: 100, // Restrict individual IP clients to 100 calls per window metric
  standardHeaders: 'draft-8', // Enforce clean modern RFC RateLimit standard headers
  legacyHeaders: false, // Drop archaic X-RateLimit headers
  handler: (_req, res) => {
    // Wrap exhaustion flags cleanly inside our standard contract blueprint
    const rateLimitError: ApiResponse = {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        details: 'Rate limit threshold exceeded. Please try again later.',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(429).json(rateLimitError);
  },
});

// Bind rate-limiting policy ahead of all routing definitions
app.use(globalRateLimiter);
// Intercept token parameters across the entire request line
app.use(authorizeJWT(logger));

/**
 * Configure Reverse Proxies using explicit root-level path filters.
 * This prevents Express from prematurely truncating our route strings.
 */
app.use(
  createProxyMiddleware({
    pathFilter: '/api/v1/auth',
    target: config.services.auth,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/auth': '/auth' },
  }),
);

app.use(
  createProxyMiddleware({
    pathFilter: '/api/v1/artworks',
    target: config.services.artwork,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/artworks': '/artworks' },
  }),
);

app.use(
  createProxyMiddleware({
    pathFilter: '/api/v1/auctions',
    target: config.services.auction,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/auctions': '/auctions' },
  }),
);

app.use(
  createProxyMiddleware({
    pathFilter: '/api/v1/bids',
    target: config.services.bid,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/bids': '/bids' },
  }),
);

app.use(
  createProxyMiddleware({
    pathFilter: '/api/v1/analytics',
    target: config.services.analytics,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/analytics': '/analytics' },
  }),
);

// Fallback capturing unmapped path boundaries cleanly
app.use((req, res) => {
  const finalError: ApiResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      details: `Requested edge pathway structure does not exist: ${req.path}`,
    },
    timestamp: new Date().toISOString(),
  };
  res.status(404).json(finalError);
});

app.listen(config.port, () => {
  logger.info(`Central Edge Gateway running seamlessly over boundary address: ${config.port}`);
});
