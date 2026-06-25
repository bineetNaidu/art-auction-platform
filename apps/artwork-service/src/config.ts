export const config = {
  port: process.env.PORT || 3002,
  // PostgreSQL Artwork Service isolated path connection string
  databaseUrl:
    process.env.DATABASE_URL || 'postgres://postgres:supersecretpassword@localhost:5432/artwork_db',
  // Kafka cluster string coordinates
  kafkaBroker: process.env.KAFKA_BROKER || 'localhost:9092',
};
