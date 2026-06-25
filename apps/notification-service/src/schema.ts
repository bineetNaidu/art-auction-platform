import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

// Define the schema for audit tracking notifications delivered across our system
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // Target user ID reference
  type: varchar('type', { length: 50 }).notNull(), // e.g., 'BID_CONFIRMATION' or 'OUTBID_ALERT'
  message: text('message').notNull(), // The dynamic message payload string text
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
