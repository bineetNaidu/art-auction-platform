import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { notifications } from './schema.js';
import { createLogger } from '@platform/shared-logger';
import { config } from './config';

const logger = createLogger('notification-service:db');
const pool = new Pool({ connectionString: config.databaseUrl });

export const db = drizzle(pool, { schema: { notifications } });

// Structural initialization checks verifying notification logs storage spaces
export async function initializeDatabase() {
  try {
    logger.info('Running structural notification domain table initialization checks...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    logger.info('Notification database infrastructure sync completed successfully.');
  } catch (error) {
    logger.error('Notification datastore initialization sequence failed:', error);
    process.exit(1);
  }
}
