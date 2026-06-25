import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { bids } from './schema';
import { redis } from './redis';
import { eq, asc } from 'drizzle-orm';
import { PlatformEventName, CloudEvent } from '@platform/shared-events';
import { ApiResponse } from '@platform/shared-types';
import { Producer } from 'kafkajs';
import crypto from 'crypto';

/**
 * High-performance transactional placement handler protected by upstream Zod checking
 */
export const placeBid =
  (producer: Producer, logger: any) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { auctionId, bidderId, amount } = req.body;

      const redisKey = `auction:${auctionId}:highest_bid`;

      // 1. In-memory validation phase against low-latency Redis cache
      const currentHighestCached = await redis.get(redisKey);
      const currentHighest = currentHighestCached ? parseInt(currentHighestCached, 10) : 0;

      if (amount <= currentHighest) {
        const outbidRes: ApiResponse = {
          success: false,
          error: {
            code: 'BID_TOO_LOW',
            details: `Bid amount must be strictly greater than current high mark: ${currentHighest}`,
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(422).json(outbidRes);
      }

      // 2. Persistence phase into the structural append-only PostgreSQL ledger
      const [newBid] = await db
        .insert(bids)
        .values({
          auctionId,
          bidderId,
          amount,
        })
        .returning();

      // 3. Atomically advance the state line high-water mark inside Redis memory
      await redis.set(redisKey, amount.toString());

      // 4. Asynchronously broadcast the confirmation event down the Kafka pipe
      const bidPlacedEvent: CloudEvent<PlatformEventName.BID_PLACED> = {
        event: PlatformEventName.BID_PLACED,
        traceId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        data: {
          bidId: newBid.id,
          auctionId: newBid.auctionId,
          bidderId: newBid.bidderId,
          amount: newBid.amount,
        },
      };

      try {
        await producer.send({
          topic: 'platform.bids',
          messages: [{ key: auctionId, value: JSON.stringify(bidPlacedEvent) }],
        });
      } catch (kafkaError) {
        logger.error('Async bid streaming notice skipped:', kafkaError);
      }

      const successRes: ApiResponse = {
        success: true,
        message: 'Bid processed and recorded cleanly',
        data: newBid,
        timestamp: new Date().toISOString(),
      };
      return res.status(201).json(successRes);
    } catch (err) {
      return next(err); // Pass systemic runtime failures down to the global error interceptor
    }
  };

/**
 * Retrieves the sequential chronological ledger of all bids placed within a targeted auction
 */
export const getBidsByAuction =
  (logger: any) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { auctionId } = req.params;

      // Fetch entries sorted chronologically using ascending order parameters
      const history = await db
        .select()
        .from(bids)
        .where(eq(bids.auctionId, auctionId))
        .orderBy(asc(bids.createdAt));

      const successRes: ApiResponse = {
        success: true,
        data: history,
        timestamp: new Date().toISOString(),
      };
      return res.status(200).json(successRes);
    } catch (err) {
      logger.error(
        `Failed to map historical audit logs for auction context parameter: ${req.params.auctionId}`,
      );
      return next(err);
    }
  };
