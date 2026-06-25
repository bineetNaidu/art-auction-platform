import { Consumer } from 'kafkajs';
import { db } from './db.js';
import { notifications } from './schema.js';
import { PlatformEventName, CloudEvent } from '@platform/shared-events';

/**
 * Attaches message ingestion loops across targeting topics subscription channels
 */
export async function runNotificationConsumer(consumer: Consumer, logger: any) {
  // Subscribe to target topics mapping our system actions
  await consumer.subscribe({ topics: ['platform.bids'], fromBeginning: false });

  logger.info('Kafka Notification Consumer subscribed to streaming channels.');

  // Run the event processing loop worker execution context
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        if (!message.value) return;

        // Parse string record back safely into typed CloudEvent specifications
        const rawPayload = message.value.toString();
        const parsedEvent = JSON.parse(rawPayload) as CloudEvent<any>;

        logger.info(
          `Received event: "${parsedEvent.event}" inside partition context: [${partition}] from topic: ${topic}`,
        );

        // Route processing rules dynamically matching event signatures
        if (parsedEvent.event === PlatformEventName.BID_PLACED) {
          const bidData = parsedEvent.data;

          // Write record confirming bid ingestion transaction back to notification logs data spaces
          await db.insert(notifications).values({
            userId: bidData.bidderId,
            type: 'BID_CONFIRMATION',
            message: `Success! Your bid of $${(bidData.amount / 100).toFixed(2)} was securely processed for Auction reference: ${bidData.auctionId}.`,
          });

          logger.info(
            `Notification confirmation tracked successfully for bidder user: ${bidData.bidderId}`,
          );
        }
      } catch (err) {
        // Enforce fault isolation so single broken payloads don't crash our ingestion engine
        logger.error(
          'Error processing streaming payload message inside background loop execution:',
          err,
        );
      }
    },
  });
}
