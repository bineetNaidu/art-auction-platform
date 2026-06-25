import { config } from './config.js';
import { initializeDatabase } from './db.js';
import { runNotificationConsumer } from './consumer.js';
import { KafkaBrokerClient } from '@platform/shared-kafka';
import { createLogger } from '@platform/shared-logger';

const logger = createLogger('notification-service:main');

// Initialize Kafka client reference identifiers
const kafkaClient = new KafkaBrokerClient({
  clientId: 'notification-service-client',
  brokers: [config.kafkaBroker],
});

async function main() {
  // Ensure storage components match expected schemas
  await initializeDatabase();

  // Create highly collaborative shared consumer grouping profiles
  const consumer = await kafkaClient.createConsumer('notification-service-group');
  logger.info('Connected to Kafka Broker server successfully as a Consumer Node.');

  // Hand off lifecycle context thread execution loop to background workers
  await runNotificationConsumer(consumer, logger);
}

main().catch((err) => {
  logger.error('Fatal initialization error on notification processor cluster startup:', err);
  process.exit(1);
});
