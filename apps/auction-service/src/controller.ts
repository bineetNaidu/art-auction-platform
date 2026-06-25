import { Request, Response } from 'express';
import { db } from './db.js';
import { auctions } from './schema.js';
import { PlatformEventName, CloudEvent } from '@platform/shared-events';
import { ApiResponse } from '@platform/shared-types';
import { Producer } from 'kafkajs';
import crypto from 'crypto';

/**
 * Creates an auction timeline mapping record and logs an auction.created event
 */
export const createAuction =
  (producer: Producer, logger: any) => async (req: Request, res: Response) => {
    try {
      const { artworkId, sellerId, startPrice, startTime, endTime } = req.body;

      if (!artworkId || !sellerId || !startPrice || !startTime || !endTime) {
        const errorRes: ApiResponse = {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            details: 'Missing required validation fields for auction registration',
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(400).json(errorRes);
      }

      // Capture entry to database layer
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

      // Map contract validation message body
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

      // Broadcast change payload asynchronously to Kafka
      try {
        await producer.send({
          topic: 'platform.auctions',
          messages: [
            {
              key: newAuction.id,
              value: JSON.stringify(auctionCreatedEvent),
            },
          ],
        });
        logger.info(
          `Kafka broadcast verification event fired cleanly for auction: ${newAuction.id}`,
        );
      } catch (kafkaError) {
        logger.error('Downstream Kafka connection notification delivery slipped:', kafkaError);
      }

      const successRes: ApiResponse = {
        success: true,
        message: 'Auction event scheduled successfully',
        data: newAuction,
        timestamp: new Date().toISOString(),
      };
      return res.status(201).json(successRes);
    } catch (err) {
      logger.error('Auction timeline processing registration error:', err);
      const errorRes: ApiResponse = {
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR' },
        timestamp: new Date().toISOString(),
      };
      return res.status(500).json(errorRes);
    }
  };

/**
 * Lists all active and scheduled auction elements
 */
export const getAuctions = (logger: any) => async (_req: Request, res: Response) => {
  try {
    const data = await db.select().from(auctions);
    const successRes: ApiResponse = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
    return res.status(200).json(successRes);
  } catch (err) {
    logger.error('Failed to parse auction metrics query list:', err);
    const errorRes: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR' },
      timestamp: new Date().toISOString(),
    };
    return res.status(500).json(errorRes);
  }
};
