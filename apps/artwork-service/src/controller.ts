import { Request, Response } from 'express';
import { db } from './db.js';
import { artworks } from './schema.js';
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
