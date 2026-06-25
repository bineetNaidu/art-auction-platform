import express from 'express';
import { config } from './config';
import { initializeDatabase } from './db';
import { createArtwork, getArtworks, getArtworkById, verifyArtwork } from './controller';
import { validateBody, errorHandler } from '@platform/shared-common';
import { KafkaBrokerClient } from '@platform/shared-kafka';
import { createLogger } from '@platform/shared-logger';
import { CreateArtworkSchema, VerifyArtworkSchema } from './schema';

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
  app.post('/artworks', validateBody(CreateArtworkSchema), createArtwork(producer, logger));
  app.get('/artworks', getArtworks(logger));
  app.get('/artworks/:id', getArtworkById(logger));
  app.patch('/artworks/:id/verify', validateBody(VerifyArtworkSchema), verifyArtwork(logger));

  // Enforce centralized unhandled error parsing logic at the absolute base of the pipeline
  app.use(errorHandler(logger));

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
