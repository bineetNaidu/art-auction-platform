import Redis from 'ioredis';
import { config } from './config';
import { createLogger } from '@platform/shared-logger';

const logger = createLogger('bid-service:redis');

// Initialize the Redis client instance connection
export const redis = new Redis({
  host: config.redisHost,
  port: config.redisPort,
});

redis.on('connect', () => {
  logger.info('Connected to Redis Cache Engine successfully.');
});

redis.on('error', (err) => {
  logger.error('Redis core cluster connection error event:', err);
});
