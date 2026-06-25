import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

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
