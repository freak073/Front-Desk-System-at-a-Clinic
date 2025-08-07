-- Front Desk System Database Setup Script
-- Run this script in MySQL to create the database and tables

-- Create database
CREATE DATABASE IF NOT EXISTS front_desk_system;
USE front_desk_system;

-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('front_desk') NOT NULL DEFAULT 'front_desk',
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_fe0bb3f6520ee0469504521e71` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create doctors table
CREATE TABLE IF NOT EXISTS `doctors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `specialization` varchar(100) NOT NULL,
  `gender` enum('male','female','other') NOT NULL,
  `location` varchar(100) NOT NULL,
  `availability_schedule` json DEFAULT NULL,
  `status` enum('available','busy','off_duty') NOT NULL DEFAULT 'available',
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create patients table
CREATE TABLE IF NOT EXISTS `patients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `contact_info` varchar(255) DEFAULT NULL,
  `medical_record_number` varchar(50) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_medical_record_number` (`medical_record_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create queue_entries table
CREATE TABLE IF NOT EXISTS `queue_entries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `queue_number` int NOT NULL,
  `status` enum('waiting','with_doctor','completed') NOT NULL DEFAULT 'waiting',
  `priority` enum('normal','urgent') NOT NULL DEFAULT 'normal',
  `arrival_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estimated_wait_time` int DEFAULT NULL COMMENT 'Estimated wait time in minutes',
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_queue_number` (`queue_number`),
  KEY `IDX_status` (`status`),
  KEY `IDX_priority` (`priority`),
  KEY `IDX_arrival_time` (`arrival_time`),
  KEY `FK_queue_entries_patient` (`patient_id`),
  CONSTRAINT `FK_queue_entries_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create appointments table
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `doctor_id` int NOT NULL,
  `appointment_datetime` datetime NOT NULL,
  `status` enum('booked','completed','canceled') NOT NULL DEFAULT 'booked',
  `notes` text,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_appointment_datetime` (`appointment_datetime`),
  KEY `IDX_doctor_datetime` (`doctor_id`,`appointment_datetime`),
  KEY `IDX_patient_id` (`patient_id`),
  KEY `IDX_appointment_status` (`status`),
  CONSTRAINT `FK_appointments_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_appointments_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert sample data
-- Default user (admin/admin123)
INSERT IGNORE INTO `users` (`username`, `password_hash`, `role`) VALUES 
('admin', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQ', 'front_desk');

-- Sample doctors
INSERT IGNORE INTO `doctors` (`id`, `name`, `specialization`, `gender`, `location`, `status`, `availability_schedule`) VALUES
(1, 'Dr. Sarah Johnson', 'General Medicine', 'female', 'Room 101', 'available', '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "15:00"}}'),
(2, 'Dr. Michael Chen', 'Cardiology', 'male', 'Room 102', 'available', '{"monday": {"start": "10:00", "end": "18:00"}, "tuesday": {"start": "10:00", "end": "18:00"}, "wednesday": {"start": "10:00", "end": "18:00"}, "thursday": {"start": "10:00", "end": "18:00"}, "friday": {"start": "10:00", "end": "16:00"}}'),
(3, 'Dr. Emily Rodriguez', 'Pediatrics', 'female', 'Room 103', 'busy', '{"monday": {"start": "08:00", "end": "16:00"}, "tuesday": {"start": "08:00", "end": "16:00"}, "wednesday": {"start": "08:00", "end": "16:00"}, "thursday": {"start": "08:00", "end": "16:00"}, "friday": {"start": "08:00", "end": "14:00"}}'),
(4, 'Dr. James Wilson', 'Orthopedics', 'male', 'Room 104', 'off_duty', '{"monday": {"start": "11:00", "end": "19:00"}, "tuesday": {"start": "11:00", "end": "19:00"}, "wednesday": {"start": "11:00", "end": "19:00"}, "thursday": {"start": "11:00", "end": "19:00"}, "friday": {"start": "11:00", "end": "17:00"}}');

-- Sample patients
INSERT IGNORE INTO `patients` (`id`, `name`, `contact_info`, `medical_record_number`) VALUES
(1, 'John Smith', 'john.smith@email.com, (555) 123-4567', 'MR001'),
(2, 'Mary Johnson', 'mary.johnson@email.com, (555) 234-5678', 'MR002'),
(3, 'Robert Brown', 'robert.brown@email.com, (555) 345-6789', 'MR003'),
(4, 'Lisa Davis', 'lisa.davis@email.com, (555) 456-7890', 'MR004'),
(5, 'David Wilson', 'david.wilson@email.com, (555) 567-8901', 'MR005'),
(6, 'Jennifer Garcia', 'jennifer.garcia@email.com, (555) 678-9012', 'MR006'),
(7, 'Michael Martinez', 'michael.martinez@email.com, (555) 789-0123', 'MR007'),
(8, 'Sarah Anderson', 'sarah.anderson@email.com, (555) 890-1234', 'MR008');

-- Sample queue entries
INSERT IGNORE INTO `queue_entries` (`id`, `patient_id`, `queue_number`, `status`, `priority`, `arrival_time`, `estimated_wait_time`) VALUES
(1, 1, 1, 'waiting', 'normal', DATE_SUB(NOW(), INTERVAL 30 MINUTE), 15),
(2, 2, 2, 'with_doctor', 'urgent', DATE_SUB(NOW(), INTERVAL 45 MINUTE), 0),
(3, 3, 3, 'waiting', 'normal', DATE_SUB(NOW(), INTERVAL 15 MINUTE), 25),
(4, 4, 4, 'waiting', 'urgent', DATE_SUB(NOW(), INTERVAL 10 MINUTE), 5);

-- Sample appointments
INSERT IGNORE INTO `appointments` (`id`, `patient_id`, `doctor_id`, `appointment_datetime`, `status`, `notes`) VALUES
(1, 5, 1, DATE_ADD(NOW(), INTERVAL 2 HOUR), 'booked', 'Regular checkup'),
(2, 6, 2, DATE_ADD(NOW(), INTERVAL 4 HOUR), 'booked', 'Cardiology consultation'),
(3, 7, 3, DATE_ADD(NOW(), INTERVAL 1 DAY), 'booked', 'Pediatric examination'),
(4, 8, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), 'completed', 'Follow-up visit completed'),
(5, 1, 4, DATE_ADD(NOW(), INTERVAL 2 DAY), 'canceled', 'Patient requested cancellation');

COMMIT;

-- Display success message
SELECT 'Database setup completed successfully!' as message;
SELECT 'Default login: admin / admin123' as credentials;