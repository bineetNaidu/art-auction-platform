import { pgTable, uuid, integer, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// Define the append-only permanent ledger table for bids
export const bids = pgTable('bids', {
  id: uuid('id').defaultRandom().primaryKey(),
  auctionId: uuid('auction_id').notNull(),
  bidderId: uuid('bidder_id').notNull(),
  amount: integer('amount').notNull(), // Track price in integer cents to block floating-point issues
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Zod Payload Constraints enforcing strict transactional typing criteria
 */
export const PlaceBidSchema = z.object({
  auctionId: z.string().uuid({ message: 'auctionId must be a valid UUIDv4 identifier string' }),
  bidderId: z.string().uuid({ message: 'bidderId must be a valid UUIDv4 identifier string' }),
  // Bids must be structural positive integers tracking currency cents ($1.00 minimum = 100)
  amount: z
    .number()
    .int()
    .positive({ message: 'Bidding amount must be an absolute positive integer value in cents' }),
});
