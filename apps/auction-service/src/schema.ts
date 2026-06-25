import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

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

/**
 * Zod validation constraints with logical timestamp refinement guards
 */
export const CreateAuctionSchema = z
  .object({
    artworkId: z.string().uuid({ message: 'artworkId must be a valid UUIDv4 string value' }),
    sellerId: z.string().uuid({ message: 'sellerId must be a valid UUIDv4 string value' }),
    // Ingested as integer cents. Minimum amount configured to $1.00 (100 cents)
    startPrice: z
      .number()
      .int()
      .min(100, { message: 'Starting price must be a positive integer greater than 100 cents' }),
    startTime: z.string().datetime({
      message: 'startTime must conform to an explicit ISO 8601 datetime format string',
    }),
    endTime: z
      .string()
      .datetime({ message: 'endTime must conform to an explicit ISO 8601 datetime format string' }),
  })
  .refine(
    (payload) => {
      const start = new Date(payload.startTime).getTime();
      const end = new Date(payload.endTime).getTime();
      // Structural validation rule: The closing window must follow the starting trigger line
      return end > start;
    },
    {
      message: 'Timeline conflict: endTime must be chronologically configured after startTime',
      path: ['endTime'], // Targets the validation warning output path directly to the field
    },
  );
