export const config = {
  port: process.env.PORT || 3003,
  // PostgreSQL Auction Service isolated instance database pathway
  databaseUrl:
    process.env.DATABASE_URL || 'postgres://postgres:supersecretpassword@localhost:5432/auction_db',
  // Local Kafka broker instance endpoints
  kafkaBroker: process.env.KAFKA_BROKER || 'localhost:9092',
};
