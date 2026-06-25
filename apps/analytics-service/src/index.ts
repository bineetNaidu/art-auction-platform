import express from 'express';
import { config } from './config.js';
import { initializeDatabase } from './db.js';
import { getDashboardSummary } from './controller.js';
import { runAnalyticsConsumer } from './consumer';
import { KafkaBrokerClient } from '@platform/shared-kafka';
import { createLogger } from '@platform/shared-logger';

const logger = createLogger('analytics-service:main');
const app = express();

app.use(express.json());

const kafkaClient = new KafkaBrokerClient({
  clientId: 'analytics-service-client',
  brokers: [config.kafkaBroker],
});

async function main() {
  await initializeDatabase();

  // Spin up dual processing capability: Listen to event messages while keeping HTTP endpoints receptive
  const consumer = await kafkaClient.createConsumer('analytics-service-group');
  await runAnalyticsConsumer(consumer, logger);

  app.get('/analytics/dashboard', getDashboardSummary(logger));

  app.listen(config.port, () => {
    logger.info(`Analytics Projection cluster online over port address: ${config.port}`);
  });
}

main().catch((err) => {
  logger.error('Fatal orchestration system drop on startup context:', err);
  process.exit(1);
});
