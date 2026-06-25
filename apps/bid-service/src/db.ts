import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { bids } from './schema.js';
import { createLogger } from '@platform/shared-logger';
import { config } from './config';

const logger = createLogger('bid-service:db');
const pool = new Pool({ connectionString: config.databaseUrl });

export const db = drizzle(pool, { schema: { bids } });

export async function initializeDatabase() {
  try {
    logger.info('Running structural bid domain table synchronization checking...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bids (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        auction_id UUID NOT NULL,
        bidder_id UUID NOT NULL,
        amount INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    logger.info('Bid database infrastructure sync completed successfully.');
  } catch (error) {
    logger.error('Bid database instantiation failure:', error);
    process.exit(1);
  }
}
