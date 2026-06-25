-- Create isolated databases for each microservice boundary
CREATE DATABASE auth_db;
CREATE DATABASE artwork_db;
CREATE DATABASE auction_db;
CREATE DATABASE bid_db;
CREATE DATABASE notification_db;
CREATE DATABASE analytics_db;

-- Optional: Confirm database generation logs
\l