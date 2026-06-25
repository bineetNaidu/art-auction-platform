import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { auctions } from './schema.js';
import { createLogger } from '@platform/shared-logger';

const logger = createLogger('auction-service:db');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgres://postgres:supersecretpassword@localhost:5432/auction_db',
});

export const db = drizzle(pool, { schema: { auctions } });

// Synchronizes the structural tables inside auction_db on service activation
export async function initializeDatabase() {
  try {
    logger.info('Running structural auction domain table synchronization checking...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS auctions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        artwork_id UUID NOT NULL,
        seller_id UUID NOT NULL,
        start_price INTEGER NOT NULL,
        current_highest_bid INTEGER DEFAULT 0 NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    logger.info('Auction database infrastructure sync completed successfully.');
  } catch (error) {
    logger.error('Auction database initialization pipeline failure:', error);
    process.exit(1);
  }
}
