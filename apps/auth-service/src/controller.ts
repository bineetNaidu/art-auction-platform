import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { users } from './schema.js';
import { eq } from 'drizzle-orm';
import { config } from './config.js';
import { PlatformEventName, CloudEvent } from '@platform/shared-events';
import { Producer } from 'kafkajs';
import crypto from 'crypto';

/**
 * Handles Account User Registrations
 */
export const registerUser =
  (producer: Producer, logger: any) => async (req: Request, res: Response) => {
    try {
      const { email, password, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Missing required parameters email or password' });
      }

      // Verify user duplication
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        return res.status(409).json({ error: 'User account with this email already registered' });
      }

      // Hash user passwords safely
      const passwordHash = await bcrypt.hash(password, 10);

      // Write transactional user to database record
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          passwordHash,
          role: role || 'buyer',
        })
        .returning();

      // Fabricate standardized cloud event configuration shape mapping step 1 specs
      const userCreatedEvent: CloudEvent<PlatformEventName.USER_CREATED> = {
        event: PlatformEventName.USER_CREATED,
        traceId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        data: {
          userId: newUser.id,
          email: newUser.email,
          role: newUser.role,
        },
      };

      // Emit event asynchronously to Kafka message streams
      try {
        await producer.send({
          topic: 'platform.users',
          messages: [
            {
              key: newUser.id,
              value: JSON.stringify(userCreatedEvent),
            },
          ],
        });
        logger.info(`Kafka broadcast verification event fired cleanly for profile: ${newUser.id}`);
      } catch (kafkaError) {
        // Gracefully capture broadcast slipups without destroying registration responses
        logger.error('Downstream Kafka connection notification delivery slipped:', kafkaError);
      }

      return res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      });
    } catch (err) {
      logger.error('Registration processing error event:', err);
      return res
        .status(500)
        .json({ error: 'Internal compilation server processing execution error' });
    }
  };

/**
 * Validates Credentials and Issues Authentic Access Tokens
 */
export const loginUser = (logger: any) => async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return res.status(401).json({ error: 'Invalid identification credentials provided' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid identification credentials provided' });
    }

    // Sign payload claims safely
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '24h' },
    );

    return res.status(200).json({ token });
  } catch (err) {
    logger.error('Login action authentication sequence processing failure:', err);
    return res
      .status(500)
      .json({ error: 'Internal compilation server processing execution error' });
  }
};
