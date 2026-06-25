import express from 'express';
import { config } from './config.js';
import { initializeDatabase } from './db.js';
import { registerUser, loginUser } from './controller.js';
import { KafkaBrokerClient } from '@platform/shared-kafka';
import { createLogger } from '@platform/shared-logger';

const logger = createLogger('auth-service:main');
const app = express();

app.use(express.json());

// Instantiate baseline connectivity orchestration wrappers
const kafkaClient = new KafkaBrokerClient({
  clientId: 'auth-service-client',
  brokers: [config.kafkaBroker],
});

async function main() {
  // Sync databases structures
  await initializeDatabase();

  // Connect active streaming producer pipelines
  const producer = await kafkaClient.getProducer();
  logger.info('Connected to Kafka Broker server successfully.');

  // Mount API paths
  app.post('/auth/register', registerUser(producer, logger));
  app.post('/auth/login', loginUser(logger));

  app.listen(config.port, () => {
    logger.info(`Auth Service container listening perfectly over port destination: ${config.port}`);
  });
}

main().catch((err) => {
  logger.error('Fatal initialization error:', err);
  process.exit(1);
});
