import express from 'express';
import { config } from './config';
import { initializeDatabase } from './db';
import { createAuction, getAuctions, getAuctionById, cancelAuction } from './controller';
import { CreateAuctionSchema } from './schema.js';
import { validateBody, errorHandler } from '@platform/shared-common';
import { KafkaBrokerClient } from '@platform/shared-kafka';
import { createLogger } from '@platform/shared-logger';

const logger = createLogger('auction-service:main');
const app = express();

app.use(express.json());

const kafkaClient = new KafkaBrokerClient({
  clientId: 'auction-service-client',
  brokers: [config.kafkaBroker],
});

async function main() {
  await initializeDatabase();

  const producer = await kafkaClient.getProducer();
  logger.info('Connected to Kafka Broker server successfully.');

  // Mount API paths mapped to Zod structural verification layers
  app.post('/auctions', validateBody(CreateAuctionSchema), createAuction(producer, logger));
  app.get('/auctions', getAuctions(logger));
  app.get('/auctions/:id', getAuctionById(logger));
  app.patch('/auctions/:id/cancel', cancelAuction(logger));

  // Anchor the unified exception processor at the very base of the routing engine
  app.use(errorHandler(logger));

  app.listen(config.port, () => {
    logger.info(`Hardened Auction Service cluster operating safely over port: ${config.port}`);
  });
}

main().catch((err) => {
  logger.error('Fatal execution setup crash caught:', err);
  process.exit(1);
});
