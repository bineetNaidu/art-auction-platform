import express from 'express';
import { config } from './config';
import { initializeDatabase } from './db';
import { placeBid, getBidsByAuction } from './controller';
import { PlaceBidSchema } from './schema';
import { validateBody, errorHandler } from '@platform/shared-common';
import { KafkaBrokerClient } from '@platform/shared-kafka';
import { createLogger } from '@platform/shared-logger';

const logger = createLogger('bid-service:main');
const app = express();

app.use(express.json());

const kafkaClient = new KafkaBrokerClient({
  clientId: 'bid-service-client',
  brokers: [config.kafkaBroker],
});

async function main() {
  await initializeDatabase();

  const producer = await kafkaClient.getProducer();
  logger.info('Connected to Kafka Broker server successfully.');

  // Mount API paths integrated with explicit Zod payload verification guards
  app.post('/bids', validateBody(PlaceBidSchema), placeBid(producer, logger));
  app.get('/bids/auction/:auctionId', getBidsByAuction(logger));

  // Anchor the unified exception processor at the very base of the routing stack
  app.use(errorHandler(logger));

  app.listen(config.port, () => {
    logger.info(`Hardened Bid Transaction Service cluster online over port: ${config.port}`);
  });
}

main().catch((err) => {
  logger.error('Fatal initialization crash caught:', err);
  process.exit(1);
});
