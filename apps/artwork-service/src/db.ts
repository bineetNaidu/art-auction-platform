import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { artworks } from './schema.js';
import { createLogger } from '@platform/shared-logger';

const logger = createLogger('artwork-service:db');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgres://postgres:supersecretpassword@localhost:5432/artwork_db',
});

export const db = drizzle(pool, { schema: { artworks } });

// Function executing localized migrations safely on application startup
export async function initializeDatabase() {
  try {
    logger.info('Running structural artwork domain table synchronization checking...');

    // Explicit raw Drizzle table create fallback statement to establish structural boundaries
    await pool.query(`
      CREATE TABLE IF NOT EXISTS artworks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL,
        artist_id UUID NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    logger.info('Artwork database infrastructure sync completed successfully.');
  } catch (error) {
    logger.error('Artwork database instantiation migration pipeline failure:', error);
    process.exit(1);
  }
}
