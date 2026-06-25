import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import { auctions } from './schema';
import { eq } from 'drizzle-orm';
import { PlatformEventName, CloudEvent } from '@platform/shared-events';
import { ApiResponse } from '@platform/shared-types';
import { Producer } from 'kafkajs';
import crypto from 'crypto';

/**
 * Schedules an auction entry and emits an auction.created event message
 */
export const createAuction =
  (producer: Producer, logger: any) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { artworkId, sellerId, startPrice, startTime, endTime } = req.body;

      const [newAuction] = await db
        .insert(auctions)
        .values({
          artworkId,
          sellerId,
          startPrice,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          status: 'pending',
        })
        .returning();

      const auctionCreatedEvent: CloudEvent<PlatformEventName.AUCTION_CREATED> = {
        event: PlatformEventName.AUCTION_CREATED,
        traceId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        data: {
          auctionId: newAuction.id,
          artworkId: newAuction.artworkId,
          startPrice: newAuction.startPrice,
        },
      };

      try {
        await producer.send({
          topic: 'platform.auctions',
          messages: [{ key: newAuction.id, value: JSON.stringify(auctionCreatedEvent) }],
        });
      } catch (kafkaError) {
        logger.error('Failed to stream auction scheduling event:', kafkaError);
      }

      const successRes: ApiResponse = {
        success: true,
        message: 'Auction event scheduled successfully',
        data: newAuction,
        timestamp: new Date().toISOString(),
      };
      return res.status(201).json(successRes);
    } catch (err) {
      return next(err);
    }
  };

/**
 * Locates an isolated auction record profile by its UUID identifier
 */
export const getAuctionById =
  (logger: any) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const [auction] = await db.select().from(auctions).where(eq(auctions.id, id)).limit(1);

      if (!auction) {
        const errorRes: ApiResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            details: 'No active auction mapped to the provided identifier',
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(errorRes);
      }

      const successRes: ApiResponse = {
        success: true,
        data: auction,
        timestamp: new Date().toISOString(),
      };
      return res.status(200).json(successRes);
    } catch (err) {
      logger.error(`Error processing auction lookup trace for ID: ${req.params.id}`);
      return next(err);
    }
  };

/**
 * Triggers an administrative soft-state cancellation sequence over an auction pipeline
 */
export const cancelAuction =
  (logger: any) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const [cancelledAuction] = await db
        .update(auctions)
        .set({ status: 'cancelled', createdAt: new Date() })
        .where(eq(auctions.id, id))
        .returning();

      if (!cancelledAuction) {
        const errorRes: ApiResponse = {
          success: false,
          error: { code: 'NOT_FOUND', details: 'Target auction item not found for cancellation' },
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(errorRes);
      }

      logger.warn(`Auction event [${id}] has been marked cancelled manually.`);

      const successRes: ApiResponse = {
        success: true,
        message: 'Auction lifecycle context terminated successfully.',
        data: cancelledAuction,
        timestamp: new Date().toISOString(),
      };
      return res.status(200).json(successRes);
    } catch (err) {
      return next(err);
    }
  };

/**
 * Fetch bulk auction inventory records
 */
export const getAuctions =
  (_logger: any) => async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await db.select().from(auctions);
      const successRes: ApiResponse = { success: true, data, timestamp: new Date().toISOString() };
      return res.status(200).json(successRes);
    } catch (err) {
      return next(err);
    }
  };
