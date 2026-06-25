import { pgTable, uuid, integer, timestamp } from 'drizzle-orm/pg-core';

// Define the append-only permanent ledger table for bids
export const bids = pgTable('bids', {
  id: uuid('id').defaultRandom().primaryKey(),
  auctionId: uuid('auction_id').notNull(),
  bidderId: uuid('bidder_id').notNull(),
  amount: integer('amount').notNull(), // Track price in integer cents to block floating-point issues
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
