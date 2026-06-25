import { pgTable, uuid, integer, bigint, timestamp } from 'drizzle-orm/pg-core';

// Represents pre-computed, flat global business metrics for swift querying
export const platformMetrics = pgTable('platform_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  totalAuctions: integer('total_auctions').default(0).notNull(),
  totalBids: integer('total_bids').default(0).notNull(),
  // Using bigint to store global accumulated transaction volume in cents securely
  totalVolumeCents: bigint('total_volume_cents', { mode: 'number' }).default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
