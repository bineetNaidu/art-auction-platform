export const config = {
  port: process.env.PORT || 3005,
  // PostgreSQL connection targeting the isolated analytics_db cluster space
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgres://postgres:supersecretpassword@localhost:5432/analytics_db',
  // Kafka event bus endpoint mapping coordinates
  kafkaBroker: process.env.KAFKA_BROKER || 'localhost:9092',
};
