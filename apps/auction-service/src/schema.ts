import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

// Define the authoritative Auctions table schema inside auction_db
export const auctions = pgTable('auctions', {
  id: uuid('id').defaultRandom().primaryKey(),
  artworkId: uuid('artwork_id').notNull(), // Foreign domain reference tracking art assets asynchronously
  sellerId: uuid('seller_id').notNull(), // Foreign domain reference tracking profile identities
  startPrice: integer('start_price').notNull(), // Track price in integer cents ($100.00 = 10000) to block floating-point rounding errors
  currentHighestBid: integer('current_highest_bid').default(0).notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  status: varchar('status', { length: 50 })
    .$type<'pending' | 'active' | 'ended' | 'cancelled'>()
    .default('pending')
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
