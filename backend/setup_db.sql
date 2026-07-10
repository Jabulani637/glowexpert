-- Create user if not exists
DO
$do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'glowexpert') THEN
    CREATE USER glowexpert WITH PASSWORD 'glowexpert';
    ALTER USER glowexpert CREATEDB;
  END IF;
END
$do$;

-- Create database if not exists
SELECT 'CREATE DATABASE glowexpert OWNER glowexpert'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'glowexpert')\gexec
