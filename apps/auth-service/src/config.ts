export const config = {
  port: process.env.PORT || 3001,
  // PostgreSQL Auth Service isolated path database connection string
  databaseUrl:
    process.env.DATABASE_URL || 'postgres://postgres:supersecretpassword@localhost:5432/auth_db',
  // Secret string used for encrypting user JWT tokens
  jwtSecret: process.env.JWT_SECRET || 'fallback-super-secure-token-secret-key-string',
  // Kafka connection metadata strings
  kafkaBroker: process.env.KAFKA_BROKER || 'localhost:9092',
};
