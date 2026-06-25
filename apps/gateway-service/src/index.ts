import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from './config.js';
import { authorizeJWT } from './authMiddleware';
import { createLogger } from '@platform/shared-logger';
import { ApiResponse } from '@platform/shared-types';

const logger = createLogger('gateway-service:main');
const app = express();

// Intercept security parameters before forwarding down proxy channels
app.use(authorizeJWT(logger));

/**
 * Configure Reverse Proxy Mapping with explicit route path rewriting rules
 */
app.use(
  '/api/v1/auth',
  createProxyMiddleware({
    target: config.services.auth,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/auth': '/auth' },
  }),
);

app.use(
  '/api/v1/artworks',
  createProxyMiddleware({
    target: config.services.artwork,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/artworks': '/artworks' },
  }),
);

app.use(
  '/api/v1/auctions',
  createProxyMiddleware({
    target: config.services.auction,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/auctions': '/auctions' },
  }),
);

app.use(
  '/api/v1/bids',
  createProxyMiddleware({
    target: config.services.bid,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/bids': '/bids' },
  }),
);

app.use(
  '/api/v1/analytics',
  createProxyMiddleware({
    target: config.services.analytics,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/analytics': '/analytics' },
  }),
);

// Fallback error handler capturing structural missing path routes cleanly
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
