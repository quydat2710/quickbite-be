-- QuickBite PostgreSQL Init Script
-- Creates separate databases per microservice for proper isolation

CREATE DATABASE quickbite_restaurants;
CREATE DATABASE quickbite_orders;
CREATE DATABASE quickbite_payments;
CREATE DATABASE quickbite_delivery;

-- Default database (quickbite_users) is created by POSTGRES_DB env var
-- Grant all privileges to the quickbite user
GRANT ALL PRIVILEGES ON DATABASE quickbite_restaurants TO postgres;
GRANT ALL PRIVILEGES ON DATABASE quickbite_orders TO postgres;
GRANT ALL PRIVILEGES ON DATABASE quickbite_payments TO postgres;
GRANT ALL PRIVILEGES ON DATABASE quickbite_delivery TO postgres;
