import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Queue Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    
    // Navigate to queue management
    await page.click('text=Queue Management');
    await expect(page).toHaveURL('/dashboard/queue');
    
    await injectAxe(page);
  });

  test('should display queue management page with accessibility compliance', async ({ page }) => {
    // Check accessibility
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });

    // Verify page elements
    await expect(page.locator('h1:has-text("Queue Management")')).toBeVisible();
    await expect(page.locator('button:has-text("Add New Patient to Queue")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    await expect(page.locator('select')).toBeVisible(); // Status filter
  });

  test('should add new patient to queue', async ({ page }) => {
    const patientName = `Test Patient ${Date.now()}`;
    
    await page.click('button:has-text("Add New Patient to Queue")');
    
    // Fill patient form
    await expect(page.locator('text=Add Patient to Queue')).toBeVisible();
    await page.fill('input[name="name"]', patientName);
    await page.fill('input[name="contactInfo"]', '123-456-7890');
    
    await page.click('button:has-text("Add to Queue")');
    
    // Verify patient appears in queue
    await expect(page.locator(`text=${patientName}`)).toBeVisible();
    await expect(page.locator('text=Waiting')).toBeVisible();
  });

  test('should update patient status', async ({ page }) => {
    // First add a patient
    const patientName = `Test Patient ${Date.now()}`;
    await page.click('button:has-text("Add New Patient to Queue")');
    await page.fill('input[name="name"]', patientName);
    await page.click('button:has-text("Add to Queue")');
    
    // Find the patient row and update status
    const patientRow = page.locator(`tr:has-text("${patientName}")`);
    await patientRow.locator('select').selectOption('with_doctor');
    
    // Verify status updated
    await expect(patientRow.locator('text=With Doctor')).toBeVisible();
  });

  test('should filter patients by status', async ({ page }) => {
    // Add patients with different statuses (assuming some exist)
    await page.selectOption('select[name="statusFilter"]', 'waiting');
    
    // Verify only waiting patients are shown
    const waitingPatients = page.locator('tr:has-text("Waiting")');
    await expect(waitingPatients.first()).toBeVisible();
  });

  test('should search patients by name', async ({ page }) => {
    const searchTerm = 'John';
    
    await page.fill('input[placeholder*="Search"]', searchTerm);
    
    // Wait for search results
    await page.waitForTimeout(500); // Debounce delay
    
    // Verify search results contain the search term
    const patientRows = page.locator('tbody tr');
    const count = await patientRows.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const row = patientRows.nth(i);
        await expect(row.locator('td').first()).toContainText(searchTerm, { ignoreCase: true });
      }
    }
  });

  test('should handle priority patients', async ({ page }) => {
    const patientName = `Urgent Patient ${Date.now()}`;
    
    await page.click('button:has-text("Add New Patient to Queue")');
    await page.fill('input[name="name"]', patientName);
    await page.selectOption('select[name="priority"]', 'urgent');
    await page.click('button:has-text("Add to Queue")');
    
    // Verify urgent priority indicator
    const patientRow = page.locator(`tr:has-text("${patientName}")`);
    await expect(patientRow.locator('.priority-urgent, text=Urgent')).toBeVisible();
  });

  test('should remove patient from queue', async ({ page }) => {
    // First add a patient
    const patientName = `Test Patient ${Date.now()}`;
    await page.click('button:has-text("Add New Patient to Queue")');
    await page.fill('input[name="name"]', patientName);
    await page.click('button:has-text("Add to Queue")');
    
    // Remove patient
    const patientRow = page.locator(`tr:has-text("${patientName}")`);
    await patientRow.locator('button:has-text("Remove")').click();
    
    // Confirm removal
    await page.click('button:has-text("Confirm")');
    
    // Verify patient is removed
    await expect(page.locator(`text=${patientName}`)).not.toBeVisible();
  });

  test('should display estimated wait times', async ({ page }) => {
    const queueRows = page.locator('tbody tr');
    const count = await queueRows.count();
    
    if (count > 0) {
      // Check that wait times are displayed
      await expect(queueRows.first().locator('td').nth(3)).toContainText(/\d+\s*min/);
    }
  });

  test('should support keyboard navigation in queue table', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    
    if (await firstRow.isVisible()) {
      // Tab to first interactive element in row
      await page.keyboard.press('Tab');
      
      // Should be able to navigate through table elements
      const statusSelect = firstRow.locator('select');
      if (await statusSelect.isVisible()) {
        await statusSelect.focus();
        await expect(statusSelect).toBeFocused();
      }
    }
  });

  test('should validate response time under 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.click('button:has-text("Add New Patient to Queue")');
    await page.fill('input[name="name"]', 'Speed Test Patient');
    await page.click('button:has-text("Add to Queue")');
    
    // Wait for patient to appear in queue
    await expect(page.locator('text=Speed Test Patient')).toBeVisible();
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(responseTime).toBeLessThan(2000); // 2 seconds
  });
});