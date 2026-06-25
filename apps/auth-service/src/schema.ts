import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from "zod";

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


/**
 * Zod Payload Constraints enforcing parameter type sanity at the application layer
 */
export const RegisterUserSchema = z.object({
  email: z.string().email({ message: 'Invalid format: Must comply with direct email patterns.' }),
  password: z.string().min(8, { message: 'Security constraint: Passwords must contain at least 8 characters.' }),
  role: z.enum(['buyer', 'seller', 'admin']).optional(),
});

export const LoginUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});