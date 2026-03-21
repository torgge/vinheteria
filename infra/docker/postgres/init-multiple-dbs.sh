#!/bin/bash
# init-multiple-dbs.sh — Create databases for each microservice
# Used by docker-compose postgres init

set -e

POSTGRES_MULTIPLE_DATABASES=${POSTGRES_MULTIPLE_DATABASES:-"catalog,order_db,inventory,pricing,payment,shipping,identity"}

for db in $(echo "$POSTGRES_MULTIPLE_DATABASES" | tr ',' ' '); do
  echo "Creating database: $db"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE $db;
    GRANT ALL PRIVILEGES ON DATABASE $db TO $POSTGRES_USER;
EOSQL
done

# Enable logical replication for CDC/Debezium on each database
for db in $(echo "$POSTGRES_MULTIPLE_DATABASES" | tr ',' ' '); do
  echo "Enabling logical replication on: $db"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db" <<-EOSQL
    ALTER SYSTEM SET wal_level = logical;
EOSQL
done
