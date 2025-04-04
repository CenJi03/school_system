-- Create database if it doesn't exist
CREATE DATABASE school_management WITH ENCODING 'UTF8' LC_COLLATE='en_US.utf8' LC_CTYPE='en_US.utf8';

-- Create user if it doesn't exist and grant privileges
DO
$$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = 'administrator'
   ) THEN
      CREATE USER postgres WITH PASSWORD 'administrator2003';
   END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE school_management TO administrator;
ALTER USER administrator WITH SUPERUSER;