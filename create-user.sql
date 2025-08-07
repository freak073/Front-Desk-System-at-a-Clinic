-- Run this as MySQL root to create a dedicated user
CREATE USER 'frontdesk'@'localhost' IDENTIFIED BY 'frontdesk123';
GRANT ALL PRIVILEGES ON front_desk_system.* TO 'frontdesk'@'localhost';
FLUSH PRIVILEGES;

-- Create the database
CREATE DATABASE IF NOT EXISTS front_desk_system;