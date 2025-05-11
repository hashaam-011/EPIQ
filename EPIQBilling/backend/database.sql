-- Create database
CREATE DATABASE epiq_billing;

-- Connect to the database
\c epiq_billing;

-- Drop the existing table if it exists
DROP TABLE IF EXISTS users;

-- Create users table with the correct column names
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    accept_offers BOOLEAN DEFAULT false,
    accept_terms BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clean up any invalid records
DELETE FROM users WHERE email = '' OR email IS NULL;

-- Table for user submissions
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for all user form submissions
CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    form_type VARCHAR(50) NOT NULL,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'final'
);

ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';

-- Drop and recreate with cascade
ALTER TABLE form_submissions DROP CONSTRAINT form_submissions_user_id_fkey;
ALTER TABLE form_submissions ADD CONSTRAINT form_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE submissions DROP CONSTRAINT submissions_user_id_fkey;
ALTER TABLE submissions ADD CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

SELECT * FROM users WHERE id = 3;

SELECT * FROM users WHERE email = 'admin@gmail.com';