import express from 'express';
import { config } from './config.js';
import { initializeDatabase } from './db.js';
import { createAuction, getAuctions } from './controller.js';
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

  app.post('/auctions', createAuction(producer, logger));
  app.get('/auctions', getAuctions(logger));

  app.listen(config.port, () => {
    logger.info(
      `Auction Service container listening perfectly over port destination: ${config.port}`,
    );
  });
}

main().catch((err) => {
  logger.error('Fatal execution setup crash caught:', err);
  process.exit(1);
});
