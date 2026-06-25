import express from 'express';
import { config } from './config.js';
import { initializeDatabase } from './db.js';
import { createArtwork, getArtworks } from './controller.js';
import { KafkaBrokerClient } from '@platform/shared-kafka';
import { createLogger } from '@platform/shared-logger';

const logger = createLogger('artwork-service:main');
const app = express();

app.use(express.json());

// Initialize our infrastructure client wrappers
const kafkaClient = new KafkaBrokerClient({
  clientId: 'artwork-service-client',
  brokers: [config.kafkaBroker],
});

async function main() {
  // Sync core database schema structures
  await initializeDatabase();

  // Establish live stream communication pipelines
  const producer = await kafkaClient.getProducer();
  logger.info('Connected to Kafka Broker server successfully.');

  // Mount API paths
  app.post('/artworks', createArtwork(producer, logger));
  app.get('/artworks', getArtworks(logger));

  app.listen(config.port, () => {
    logger.info(
      `Artwork Service container listening perfectly over port destination: ${config.port}`,
    );
  });
}

main().catch((err) => {
  logger.error('Fatal initialization error encountered:', err);
  process.exit(1);
});
