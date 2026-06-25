import express from 'express';
import { config } from './config';
import { initializeDatabase } from './db';
import { registerUser, loginUser } from './controller';
import { KafkaBrokerClient } from '@platform/shared-kafka';
import { createLogger } from '@platform/shared-logger';
import { LoginUserSchema, RegisterUserSchema } from './schema';
import { validateBody } from './validator/validation';

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
  app.post('/auth/register', validateBody(RegisterUserSchema), registerUser(producer, logger));
  app.post('/auth/login', validateBody(LoginUserSchema) ,loginUser(logger));

  app.listen(config.port, () => {
    logger.info(`Auth Service container listening perfectly over port destination: ${config.port}`);
  });
}

main().catch((err) => {
  logger.error('Fatal initialization error:', err);
  process.exit(1);
});
