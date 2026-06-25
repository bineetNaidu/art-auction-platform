import express from 'express';
import { config } from './config.js';
import { initializeDatabase } from './db.js';
import { placeBid } from './controller.js';
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

  app.post('/bids', placeBid(producer, logger));

  app.listen(config.port, () => {
    logger.info(`Bid Service processing cluster online over port destination: ${config.port}`);
  });
}

main().catch((err) => {
  logger.error('Fatal initialization crash caught:', err);
  process.exit(1);
});
