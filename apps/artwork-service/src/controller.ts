import { NextFunction, Request, Response } from 'express';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { artworks } from './schema';
import { PlatformEventName, CloudEvent } from '@platform/shared-events';
import { ApiResponse } from '@platform/shared-types';
import { Producer } from 'kafkajs';
import crypto from 'crypto';

/**
 * Registers an artwork profile and publishes an artwork.created lifecycle event
 */
export const createArtwork =
  (producer: Producer, logger: any) => async (req: Request, res: Response) => {
    try {
      const { title, description, imageUrl, artistId } = req.body;

      if (!title || !description || !imageUrl || !artistId) {
        const errorRes: ApiResponse = {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            details: 'Missing required parameters: title, description, imageUrl, or artistId',
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(400).json(errorRes);
      }

      // Persist artwork object to our isolated artwork_db
      const [newArtwork] = await db
        .insert(artworks)
        .values({
          title,
          description,
          imageUrl,
          artistId,
        })
        .returning();

      // Map standardized domain event contract definition
      const artworkCreatedEvent: CloudEvent<PlatformEventName.ARTWORK_CREATED> = {
        event: PlatformEventName.ARTWORK_CREATED,
        traceId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        data: {
          artworkId: newArtwork.id,
          title: newArtwork.title,
          artistId: newArtwork.artistId,
        },
      };

      // Emit event asynchronously into Kafka stream pipelines
      try {
        await producer.send({
          topic: 'platform.artworks',
          messages: [
            {
              key: newArtwork.id,
              value: JSON.stringify(artworkCreatedEvent),
            },
          ],
        });
        logger.info(
          `Kafka broadcast verification event fired cleanly for artwork: ${newArtwork.id}`,
        );
      } catch (kafkaError) {
        logger.error('Downstream Kafka connection notification delivery slipped:', kafkaError);
      }

      // Package output using the uniform response layout
      const successRes: ApiResponse = {
        success: true,
        message: 'Artwork registered successfully',
        data: newArtwork,
        timestamp: new Date().toISOString(),
      };

      return res.status(201).json(successRes);
    } catch (err) {
      logger.error('Artwork creation handling processing failure:', err);
      const errorRes: ApiResponse = {
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR' },
        timestamp: new Date().toISOString(),
      };
      return res.status(500).json(errorRes);
    }
  };

/**
 * Retrieves all registered artworks
 */
export const getArtworks = (logger: any) => async (_req: Request, res: Response) => {
  try {
    const list = await db.select().from(artworks);

    const successRes: ApiResponse = {
      success: true,
      data: list,
      timestamp: new Date().toISOString(),
    };
    return res.status(200).json(successRes);
  } catch (err) {
    logger.error('Failed to retrieve artworks inventory:', err);
    const errorRes: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR' },
      timestamp: new Date().toISOString(),
    };
    return res.status(500).json(errorRes);
  }
};

/**
 * Retrieves a single artwork profile by its unique ID record
 */
export const getArtworkById =
  (logger: any) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const [artwork] = await db.select().from(artworks).where(eq(artworks.id, id)).limit(1);

      if (!artwork) {
        const errorRes: ApiResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            details: 'No active artwork entry maps to the provided identifier',
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(errorRes);
      }

      const successRes: ApiResponse = {
        success: true,
        data: artwork,
        timestamp: new Date().toISOString(),
      };
      return res.status(200).json(successRes);
    } catch (err) {
      logger.error(
        `Lookup fault tracking parameter execution context for entry ID: ${req.params.id}`,
      );
      return next(err);
    }
  };

/**
 * Updates the administrative verification provenance marker tag of an asset
 */
export const verifyArtwork =
  (logger: any) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { isVerified } = req.body;

      const [updatedArtwork] = await db
        .update(artworks)
        .set({ isVerified, createdAt: new Date() })
        .where(eq(artworks.id, id))
        .returning();

      if (!updatedArtwork) {
        const errorRes: ApiResponse = {
          success: false,
          error: { code: 'NOT_FOUND', details: 'Target artwork record missing' },
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(errorRes);
      }

      logger.info(`Administrative verification status updated to [${isVerified}] for entry: ${id}`);

      const successRes: ApiResponse = {
        success: true,
        message: 'Artwork provenance authentication marker updated cleanly.',
        data: updatedArtwork,
        timestamp: new Date().toISOString(),
      };
      return res.status(200).json(successRes);
    } catch (err) {
      return next(err);
    }
  };
