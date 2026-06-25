import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { users } from './schema.js';
import { eq } from 'drizzle-orm';
import { config } from './config.js';
import { PlatformEventName, CloudEvent } from '@platform/shared-events';
import { ApiResponse } from '@platform/shared-types';
import { Producer } from 'kafkajs';
import crypto from 'crypto';

export const registerUser =
  (producer: Producer, logger: any) => async (req: Request, res: Response) => {
    try {
      const { email, password, role } = req.body;

      if (!email || !password) {
        const errorRes: ApiResponse = {
          success: false,
          error: { code: 'BAD_REQUEST', details: 'Missing required parameters email or password' },
          timestamp: new Date().toISOString(),
        };
        return res.status(400).json(errorRes);
      }

      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        const errorRes: ApiResponse = {
          success: false,
          error: {
            code: 'USER_ALREADY_EXISTS',
            details: 'User account with this email already registered',
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(409).json(errorRes);
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const [newUser] = await db
        .insert(users)
        .values({
          email,
          passwordHash,
          role: role || 'buyer',
        })
        .returning();

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
      } catch (kafkaError) {
        logger.error('Downstream Kafka connection notification delivery slipped:', kafkaError);
      }

      // Wrap output in standard ApiResponse contract
      const successRes: ApiResponse = {
        success: true,
        message: 'User registered successfully',
        data: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
        timestamp: new Date().toISOString(),
      };

      return res.status(201).json(successRes);
    } catch (err) {
      logger.error('Registration processing error event:', err);
      const errorRes: ApiResponse = {
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR' },
        timestamp: new Date().toISOString(),
      };
      return res.status(500).json(errorRes);
    }
  };

export const loginUser = (logger: any) => async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      const errorRes: ApiResponse = {
        success: false,
        error: { code: 'UNAUTHORIZED', details: 'Invalid identification credentials provided' },
        timestamp: new Date().toISOString(),
      };
      return res.status(401).json(errorRes);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const errorRes: ApiResponse = {
        success: false,
        error: { code: 'UNAUTHORIZED', details: 'Invalid identification credentials provided' },
        timestamp: new Date().toISOString(),
      };
      return res.status(401).json(errorRes);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '24h' },
    );

    // Wrap token response in standard ApiResponse contract
    const successRes: ApiResponse = {
      success: true,
      message: 'Authentication successful',
      data: { token },
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json(successRes);
  } catch (err) {
    logger.error('Login action authentication sequence processing failure:', err);
    const errorRes: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR' },
      timestamp: new Date().toISOString(),
    };
    return res.status(500).json(errorRes);
  }
};
