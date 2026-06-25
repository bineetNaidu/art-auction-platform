import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from './schema.js';
import { createLogger } from '@platform/shared-logger';

const logger = createLogger('auth-service:db');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgres://postgres:supersecretpassword@localhost:5432/auth_db',
});

export const db = drizzle(pool, { schema: { users } });

// Function executing localized migrations safely on application startup
export async function initializeDatabase() {
  try {
    logger.info('Running structural user domain table synchronization checking...');

    // For local incremental agility, we run a direct raw Drizzle table create statement
    // to build the schema if it is absent inside our isolated auth_db.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'buyer' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    logger.info('Database infrastructure sync completed successfully.');
  } catch (error) {
    logger.error('Database instantiation migration pipeline failure:', error);
    process.exit(1);
  }
}
