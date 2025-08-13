import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Appointment Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    
    // Navigate to appointment management
    await page.click('text=Appointment Management');
    await expect(page).toHaveURL('/dashboard/appointments');
    
    await injectAxe(page);
  });

  test('should display appointment management page with accessibility compliance', async ({ page }) => {
    // Check accessibility
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });

    // Verify page elements
    await expect(page.locator('h1:has-text("Appointment Management")')).toBeVisible();
    await expect(page.locator('button:has-text("Schedule New Appointment")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    await expect(page.locator('button:has-text("Calendar View")')).toBeVisible();
  });

  test('should schedule new appointment', async ({ page }) => {
    const patientName = `Test Patient ${Date.now()}`;
    
    await page.click('button:has-text("Schedule New Appointment")');
    
    // Fill appointment form
    await expect(page.locator('text=Schedule New Appointment')).toBeVisible();
    await page.fill('input[name="patientName"]', patientName);
    
    // Select doctor
    await page.selectOption('select[name="doctorId"]', { index: 1 });
    
    // Select date and time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await page.fill('input[name="date"]', dateString);
    await page.selectOption('select[name="time"]', '10:00');
    
    await page.click('button:has-text("Schedule Appointment")');
    
    // Verify appointment appears in list
    await expect(page.locator(`text=${patientName}`)).toBeVisible();
    await expect(page.locator('text=Booked')).toBeVisible();
  });

  test('should reschedule existing appointment', async ({ page }) => {
    // Assuming there's at least one appointment
    const appointmentRow = page.locator('tbody tr').first();
    
    if (await appointmentRow.isVisible()) {
      await appointmentRow.locator('button:has-text("Reschedule")').click();
      
      // Select new time slot
      await page.selectOption('select[name="time"]', '14:00');
      await page.click('button:has-text("Reschedule Appointment")');
      
      // Verify appointment is updated
      await expect(page.locator('text=14:00')).toBeVisible();
    }
  });

  test('should cancel appointment', async ({ page }) => {
    // Assuming there's at least one appointment
    const appointmentRow = page.locator('tbody tr').first();
    
    if (await appointmentRow.isVisible()) {
      await appointmentRow.locator('button:has-text("Cancel")').click();
      
      // Confirm cancellation
      await page.click('button:has-text("Confirm")');
      
      // Verify appointment status is updated
      await expect(appointmentRow.locator('text=Canceled')).toBeVisible();
    }
  });

  test('should switch to calendar view', async ({ page }) => {
    await page.click('button:has-text("Calendar View")');
    
    // Verify calendar is displayed
    await expect(page.locator('.calendar, [data-testid="calendar"]')).toBeVisible();
    await expect(page.locator('button:has-text("Previous Month")')).toBeVisible();
    await expect(page.locator('button:has-text("Next Month")')).toBeVisible();
  });

  test('should navigate calendar months', async ({ page }) => {
    await page.click('button:has-text("Calendar View")');
    
    // Get current month
    const currentMonth = await page.locator('.calendar-header, [data-testid="current-month"]').textContent();
    
    // Navigate to next month
    await page.click('button:has-text("Next Month")');
    
    // Verify month changed
    const newMonth = await page.locator('.calendar-header, [data-testid="current-month"]').textContent();
    expect(newMonth).not.toBe(currentMonth);
  });

  test('should filter appointments by status', async ({ page }) => {
    await page.selectOption('select[name="statusFilter"]', 'booked');
    
    // Verify only booked appointments are shown
    const appointmentRows = page.locator('tbody tr');
    const count = await appointmentRows.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const row = appointmentRows.nth(i);
        await expect(row.locator('text=Booked')).toBeVisible();
      }
    }
  });

  test('should search appointments by patient name', async ({ page }) => {
    const searchTerm = 'John';
    
    await page.fill('input[placeholder*="Search"]', searchTerm);
    
    // Wait for search results
    await page.waitForTimeout(500); // Debounce delay
    
    // Verify search results
    const appointmentRows = page.locator('tbody tr');
    const count = await appointmentRows.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const row = appointmentRows.nth(i);
        await expect(row.locator('td').first()).toContainText(searchTerm, { ignoreCase: true });
      }
    }
  });

  test('should display available doctors section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Available Doctors")')).toBeVisible();
    
    // Check doctor cards
    const doctorCards = page.locator('.doctor-card, [data-testid="doctor-card"]');
    const count = await doctorCards.count();
    
    if (count > 0) {
      const firstCard = doctorCards.first();
      await expect(firstCard.locator('.doctor-name')).toBeVisible();
      await expect(firstCard.locator('.doctor-status')).toBeVisible();
      await expect(firstCard.locator('button:has-text("View Schedule")')).toBeVisible();
    }
  });

  test('should view doctor schedule', async ({ page }) => {
    const doctorCard = page.locator('.doctor-card, [data-testid="doctor-card"]').first();
    
    if (await doctorCard.isVisible()) {
      await doctorCard.locator('button:has-text("View Schedule")').click();
      
      // Verify schedule modal opens
      await expect(page.locator('text=Doctor Schedule')).toBeVisible();
      await expect(page.locator('.schedule-grid, [data-testid="schedule-grid"]')).toBeVisible();
    }
  });

  test('should validate appointment form', async ({ page }) => {
    await page.click('button:has-text("Schedule New Appointment")');
    
    // Try to submit empty form
    await page.click('button:has-text("Schedule Appointment")');
    
    // Check for validation messages
    await expect(page.locator('text=Patient name is required')).toBeVisible();
    await expect(page.locator('text=Doctor is required')).toBeVisible();
    await expect(page.locator('text=Date is required')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through main elements
    await page.keyboard.press('Tab');
    await expect(page.locator('button:has-text("Schedule New Appointment")')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[placeholder*="Search"]')).toBeFocused();
    
    // Test modal keyboard navigation
    await page.click('button:has-text("Schedule New Appointment")');
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="patientName"]')).toBeFocused();
    
    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Schedule New Appointment')).not.toBeVisible();
  });

  test('should validate response time under 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.click('button:has-text("Schedule New Appointment")');
    await page.fill('input[name="patientName"]', 'Speed Test Patient');
    await page.selectOption('select[name="doctorId"]', { index: 1 });
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await page.fill('input[name="date"]', dateString);
    await page.selectOption('select[name="time"]', '10:00');
    await page.click('button:has-text("Schedule Appointment")');
    
    // Wait for appointment to appear
    await expect(page.locator('text=Speed Test Patient')).toBeVisible();
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(responseTime).toBeLessThan(2000); // 2 seconds
  });
});