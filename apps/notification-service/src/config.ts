export const config = {
  // PostgreSQL connection mapping string directly to notification_db context
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgres://postgres:supersecretpassword@localhost:5432/notification_db',
  // Kafka cluster broker endpoint allocation coordinates
  kafkaBroker: process.env.KAFKA_BROKER || 'localhost:9092',
};
