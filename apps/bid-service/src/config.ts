export const config = {
  port: process.env.PORT || 3004,
  databaseUrl:
    process.env.DATABASE_URL || 'postgres://postgres:supersecretpassword@localhost:5432/bid_db',
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  kafkaBroker: process.env.KAFKA_BROKER || 'localhost:9092',
};
