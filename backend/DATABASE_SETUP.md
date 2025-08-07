# Database Setup Guide

This guide explains how to set up the MySQL database for the Front Desk System.

## Prerequisites

- MySQL 8.0 or higher installed and running
- MySQL client or MySQL Workbench for running SQL scripts

## Quick Setup

### Option 1: Using SQL Script (Recommended)

1. **Run the setup script:**
   ```bash
   mysql -u root -p < database-setup.sql
   ```

2. **Verify the setup:**
   ```bash
   mysql -u root -p -e "USE front_desk_system; SHOW TABLES;"
   ```

### Option 2: Manual Setup

1. **Create the database:**
   ```sql
   CREATE DATABASE front_desk_system;
   USE front_desk_system;
   ```

2. **Run the application with synchronize enabled:**
   - Set `synchronize: true` in `app.module.ts` (development only)
   - Start the application: `npm run start:dev`
   - TypeORM will automatically create the tables

3. **Seed the database:**
   ```bash
   npm run seed
   ```

## Database Schema

The database consists of 5 main tables:

### 1. users
- Stores front desk staff authentication information
- Fields: id, username, password_hash, role, created_at, updated_at

### 2. doctors
- Stores doctor profiles and availability
- Fields: id, name, specialization, gender, location, availability_schedule, status, created_at, updated_at

### 3. patients
- Stores patient information
- Fields: id, name, contact_info, medical_record_number, created_at, updated_at

### 4. queue_entries
- Manages the patient queue system
- Fields: id, patient_id, queue_number, status, priority, arrival_time, estimated_wait_time, created_at, updated_at
- Foreign Key: patient_id → patients(id)

### 5. appointments
- Manages appointment scheduling
- Fields: id, patient_id, doctor_id, appointment_datetime, status, notes, created_at, updated_at
- Foreign Keys: patient_id → patients(id), doctor_id → doctors(id)

## Sample Data

The setup script includes sample data:

### Default User
- **Username:** admin
- **Password:** admin123
- **Role:** front_desk

### Sample Doctors
- Dr. Sarah Johnson (General Medicine) - Available
- Dr. Michael Chen (Cardiology) - Available  
- Dr. Emily Rodriguez (Pediatrics) - Busy
- Dr. James Wilson (Orthopedics) - Off Duty

### Sample Patients
- 8 patients with medical record numbers MR001-MR008

### Sample Queue Entries
- 4 patients currently in queue with different statuses and priorities

### Sample Appointments
- 5 appointments with various statuses (booked, completed, canceled)

## Environment Configuration

Update your `.env` file with the correct database credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_NAME=front_desk_system
```

## Troubleshooting

### Connection Issues

1. **Access denied error:**
   - Verify MySQL credentials in `.env` file
   - Ensure MySQL server is running
   - Check if user has proper permissions

2. **Database doesn't exist:**
   - Run the setup script to create the database
   - Or manually create: `CREATE DATABASE front_desk_system;`

3. **Table creation errors:**
   - Ensure MySQL version is 8.0 or higher
   - Check for proper permissions to create tables
   - Verify JSON column support is available

### Data Issues

1. **No sample data:**
   - Run the seeding script: `npm run seed`
   - Or manually insert data using the SQL script

2. **Foreign key constraint errors:**
   - Ensure parent records exist before creating child records
   - Check cascade delete settings

## Migration Commands

For production deployments, use TypeORM migrations:

```bash
# Generate migration
npm run migration:generate -- -n CreateInitialTables

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## Testing Database

For running tests, create a separate test database:

```sql
CREATE DATABASE front_desk_system_test;
```

Update test configuration to use the test database to avoid conflicts with development data.

## Backup and Restore

### Create Backup
```bash
mysqldump -u root -p front_desk_system > backup.sql
```

### Restore from Backup
```bash
mysql -u root -p front_desk_system < backup.sql
```

## Security Considerations

1. **Change default password:** Update the admin user password after first login
2. **Database user:** Create a dedicated MySQL user for the application instead of using root
3. **Permissions:** Grant only necessary permissions to the application user
4. **SSL:** Enable SSL connections for production deployments

## Performance Optimization

The schema includes optimized indexes for:
- Queue number and status lookups
- Appointment datetime queries
- Doctor availability searches
- Patient medical record number uniqueness

Monitor query performance and add additional indexes as needed based on usage patterns.