import { Consumer } from 'kafkajs';
import { db } from './db.js';
import { platformMetrics } from './schema.js';
import { PlatformEventName, CloudEvent } from '@platform/shared-events';
import { sql } from 'drizzle-orm';

export async function runAnalyticsConsumer(consumer: Consumer, logger: any) {
  // Coalesce cross-domain topic listening allocations into a single streaming connection loop
  await consumer.subscribe({
    topics: ['platform.auctions', 'platform.bids'],
    fromBeginning: false,
  });
  logger.info('Analytics Real-time Projection engine listening to event lines...');

  await consumer.run({
    eachMessage: async ({ topic: _topic, message }) => {
      try {
        if (!message.value) return;
        const parsedEvent = JSON.parse(message.value.toString()) as CloudEvent<any>;

        logger.info(
          `Analytics service processing background message event: "${parsedEvent.event}"`,
        );

        // Update pre-computed metrics atomically using fine-grained increments
        if (parsedEvent.event === PlatformEventName.AUCTION_CREATED) {
          await db.update(platformMetrics).set({
            totalAuctions: sql`${platformMetrics.totalAuctions} + 1`,
            updatedAt: new Date(),
          });
          logger.info('Projection updated: Increment total auctions metric');
        } else if (parsedEvent.event === PlatformEventName.BID_PLACED) {
          const bidData = parsedEvent.data;
          await db.update(platformMetrics).set({
            totalBids: sql`${platformMetrics.totalBids} + 1`,
            totalVolumeCents: sql`${platformMetrics.totalVolumeCents} + ${bidData.amount}`,
            updatedAt: new Date(),
          });
          logger.info(
            `Projection updated: Ingested bid volume adjustment +$${(bidData.amount / 100).toFixed(2)}`,
          );
        }
      } catch (err) {
        logger.error('Friction within background analytics compilation engine pipeline:', err);
      }
    },
  });
}
