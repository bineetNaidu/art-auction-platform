export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'fallback-super-secure-token-secret-key-string',
  // Local or container coordinates defining microservice base endpoint paths
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    artwork: process.env.ARTWORK_SERVICE_URL || 'http://localhost:3002',
    auction: process.env.AUCTION_SERVICE_URL || 'http://localhost:3003',
    bid: process.env.BID_SERVICE_URL || 'http://localhost:3004',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3005',
  },
};
