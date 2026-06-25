import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// Define the authoritative Artworks schema inside artwork_db
export const artworks = pgTable('artworks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url').notNull(),
  artistId: uuid('artist_id').notNull(), // Links across domain boundaries purely as an immutable ID string
  isVerified: boolean('is_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Zod validation contracts ensuring data sanity before database writes
 */
export const CreateArtworkSchema = z.object({
  title: z.string().min(1, { message: 'Title cannot be empty' }).max(255),
  description: z.string().min(1, { message: 'Description cannot be empty' }),
  imageUrl: z.string().url({ message: 'Must be a valid asset target URL string' }),
  artistId: z
    .string()
    .uuid({ message: 'Artist identification mapping must be a valid UUIDv4 string' }),
});

export const VerifyArtworkSchema = z.object({
  isVerified: z.boolean({ required_error: 'isVerified toggle state flag is mandatory' }),
});
