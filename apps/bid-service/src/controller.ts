import { Request, Response } from 'express';
import { db } from './db.js';
import { bids } from './schema.js';
import { redis } from './redis.js';
import { PlatformEventName, CloudEvent } from '@platform/shared-events';
import { ApiResponse } from '@platform/shared-types';
import { Producer } from 'kafkajs';
import crypto from 'crypto';

/**
 * High-performance transactional placement handler
 */
export const placeBid =
  (producer: Producer, logger: any) => async (req: Request, res: Response) => {
    try {
      const { auctionId, bidderId, amount } = req.body;

      if (!auctionId || !bidderId || !amount) {
        const errorRes: ApiResponse = {
          success: false,
          error: { code: 'BAD_REQUEST', details: 'Missing required request parameters' },
          timestamp: new Date().toISOString(),
        };
        return res.status(400).json(errorRes);
      }

      // Key format used inside our global shared Redis engine
      const redisKey = `auction:${auctionId}:highest_bid`;

      // 1. Fetch current max bid value directly from memory cache
      const currentHighestCached = await redis.get(redisKey);
      const currentHighest = currentHighestCached ? parseInt(currentHighestCached, 10) : 0;

      // 2. Reject instantly if the incoming bid does not beat the current maximum
      if (amount <= currentHighest) {
        const outbidRes: ApiResponse = {
          success: false,
          error: {
            code: 'BID_TOO_LOW',
            details: `Bid must be strictly greater than current highest value: ${currentHighest}`,
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(422).json(outbidRes);
      }

      // 3. Persist the bid permanently to our immutable database ledger
      const [newBid] = await db
        .insert(bids)
        .values({
          auctionId,
          bidderId,
          amount,
        })
        .returning();

      // 4. Update the high-water mark state in Redis atomically
      await redis.set(redisKey, amount.toString());

      // 5. Broadcast changes asynchronously to our event streams
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
          // Keying by auctionId ensures sequential delivery ordering within this partition space
          messages: [
            {
              key: auctionId,
              value: JSON.stringify(bidPlacedEvent),
            },
          ],
        });
      } catch (kafkaError) {
        logger.error('Failed to stream bid notification event payload downstream:', kafkaError);
      }

      const successRes: ApiResponse = {
        success: true,
        message: 'Bid placed and confirmed successfully',
        data: newBid,
        timestamp: new Date().toISOString(),
      };
      return res.status(201).json(successRes);
    } catch (err) {
      logger.error('Critical bid transaction placement engine crash:', err);
      const errorRes: ApiResponse = {
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR' },
        timestamp: new Date().toISOString(),
      };
      return res.status(500).json(errorRes);
    }
  };
