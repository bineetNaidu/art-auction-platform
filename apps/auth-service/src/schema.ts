import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

// Define the authoritative Users schema inside auth_db
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 })
    .$type<'buyer' | 'seller' | 'admin'>()
    .default('buyer')
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
