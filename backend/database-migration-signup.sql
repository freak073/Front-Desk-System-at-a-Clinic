-- Migration script to update users table for signup functionality
-- Run this script to update existing database schema

USE front_desk_system;

-- Add full_name column if it doesn't exist
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `full_name` varchar(100) DEFAULT NULL;

-- Update role enum to include admin and staff
ALTER TABLE `users` 
MODIFY COLUMN `role` enum('admin','staff') NOT NULL DEFAULT 'staff';

-- Update existing users to use new role system
UPDATE `users` SET `role` = 'admin' WHERE `username` = 'admin';
UPDATE `users` SET `role` = 'staff' WHERE `role` = 'front_desk';

-- Add full names for existing users
UPDATE `users` SET `full_name` = 'System Administrator' WHERE `username` = 'admin';

-- Create staff user if it doesn't exist
INSERT IGNORE INTO `users` (`username`, `password_hash`, `role`, `full_name`) VALUES 
('staff', '$2b$10$K8BEyIXjyqOVqiw4.O.WG.abxD8YI4rU.rHxw5fxvjy4YQFGZQFGZ', 'staff', 'Front Desk Staff');

COMMIT;

SELECT 'Migration completed successfully!' as message;
SELECT 'Updated users table with signup functionality' as details;