import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { platformMetrics } from './schema.js';
import { createLogger } from '@platform/shared-logger';

const logger = createLogger('analytics-service:db');
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://postgres:supersecretpassword@localhost:5432/analytics_db',
});

export const db = drizzle(pool, { schema: { platformMetrics } });

export async function initializeDatabase() {
  try {
    logger.info('Running structural analytics domain table initialization checks...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS platform_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        total_auctions INTEGER DEFAULT 0 NOT NULL,
        total_bids INTEGER DEFAULT 0 NOT NULL,
        total_volume_cents BIGINT DEFAULT 0 NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Auto-seed a base metrics tracking row if the registry table is empty
    const checkRow = await pool.query('SELECT id FROM platform_metrics LIMIT 1;');
    if (checkRow.rowCount === 0) {
      await pool.query(
        'INSERT INTO platform_metrics (total_auctions, total_bids, total_volume_cents) VALUES (0, 0, 0);',
      );
      logger.info('Global analytics tracker seeded successfully.');
    }

    logger.info('Analytics database infrastructure sync completed successfully.');
  } catch (error) {
    logger.error('Analytics datastore initialization sequence failed:', error);
    process.exit(1);
  }
}
