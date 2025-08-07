@echo off
echo Setting up Front Desk System Database...
echo.

echo Step 1: Creating database...
mysql -u root -e "CREATE DATABASE IF NOT EXISTS front_desk_system;" 2>nul
if %errorlevel% neq 0 (
    echo Error: Could not connect to MySQL. Please check:
    echo 1. MySQL is running
    echo 2. Root password is correct
    echo 3. Try running: mysql -u root -p
    pause
    exit /b 1
)

echo Step 2: Running setup script...
mysql -u root front_desk_system < backend/database-setup.sql
if %errorlevel% neq 0 (
    echo Error: Could not run setup script
    pause
    exit /b 1
)

echo.
echo ✅ Database setup completed successfully!
echo Database: front_desk_system
echo Tables created with sample data
echo.
pause