import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Doctor Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    
    // Navigate to doctor management
    await page.click('text=Doctor Management');
    await expect(page).toHaveURL('/dashboard/doctors');
    
    await injectAxe(page);
  });

  test('should display doctor management page with accessibility compliance', async ({ page }) => {
    // Check accessibility
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });

    // Verify page elements
    await expect(page.locator('h1:has-text("Doctor Management")')).toBeVisible();
    await expect(page.locator('button:has-text("Add New Doctor")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test('should add new doctor', async ({ page }) => {
    const doctorName = `Dr. Test ${Date.now()}`;
    
    await page.click('button:has-text("Add New Doctor")');
    
    // Fill doctor form
    await expect(page.locator('text=Add New Doctor')).toBeVisible();
    await page.fill('input[name="name"]', doctorName);
    await page.fill('input[name="specialization"]', 'Cardiology');
    await page.selectOption('select[name="gender"]', 'male');
    await page.fill('input[name="location"]', 'Room 101');
    
    await page.click('button:has-text("Add Doctor")');
    
    // Verify doctor appears in list
    await expect(page.locator(`text=${doctorName}`)).toBeVisible();
    await expect(page.locator('text=Cardiology')).toBeVisible();
  });

  test('should edit existing doctor', async ({ page }) => {
    // Assuming there's at least one doctor
    const doctorCard = page.locator('.doctor-card, [data-testid="doctor-card"]').first();
    
    if (await doctorCard.isVisible()) {
      await doctorCard.locator('button:has-text("Edit")').click();
      
      // Update doctor information
      await page.fill('input[name="specialization"]', 'Updated Specialization');
      await page.click('button:has-text("Update Doctor")');
      
      // Verify doctor is updated
      await expect(page.locator('text=Updated Specialization')).toBeVisible();
    }
  });

  test('should delete doctor with confirmation', async ({ page }) => {
    // First add a doctor to delete
    const doctorName = `Dr. Delete Test ${Date.now()}`;
    await page.click('button:has-text("Add New Doctor")');
    await page.fill('input[name="name"]', doctorName);
    await page.fill('input[name="specialization"]', 'Test Specialty');
    await page.selectOption('select[name="gender"]', 'female');
    await page.fill('input[name="location"]', 'Room 999');
    await page.click('button:has-text("Add Doctor")');
    
    // Now delete the doctor
    const doctorCard = page.locator(`[data-testid="doctor-card"]:has-text("${doctorName}")`);
    await doctorCard.locator('button:has-text("Delete")').click();
    
    // Confirm deletion
    await page.click('button:has-text("Confirm")');
    
    // Verify doctor is removed
    await expect(page.locator(`text=${doctorName}`)).not.toBeVisible();
  });

  test('should display doctor status indicators', async ({ page }) => {
    const doctorCards = page.locator('.doctor-card, [data-testid="doctor-card"]');
    const count = await doctorCards.count();
    
    if (count > 0) {
      const firstCard = doctorCards.first();
      
      // Check for status badge
      const statusBadge = firstCard.locator('.status-badge, [data-testid="status-badge"]');
      await expect(statusBadge).toBeVisible();
      
      // Status should be one of: Available, Busy, Off Duty
      const statusText = await statusBadge.textContent();
      expect(['Available', 'Busy', 'Off Duty']).toContain(statusText?.trim());
    }
  });

  test('should filter doctors by specialization', async ({ page }) => {
    // Assuming there are doctors with different specializations
    await page.selectOption('select[name="specializationFilter"]', 'Cardiology');
    
    // Verify only cardiology doctors are shown
    const doctorCards = page.locator('.doctor-card, [data-testid="doctor-card"]');
    const count = await doctorCards.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const card = doctorCards.nth(i);
        await expect(card.locator('text=Cardiology')).toBeVisible();
      }
    }
  });

  test('should filter doctors by availability status', async ({ page }) => {
    await page.selectOption('select[name="statusFilter"]', 'available');
    
    // Verify only available doctors are shown
    const doctorCards = page.locator('.doctor-card, [data-testid="doctor-card"]');
    const count = await doctorCards.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const card = doctorCards.nth(i);
        await expect(card.locator('text=Available')).toBeVisible();
      }
    }
  });

  test('should search doctors by name', async ({ page }) => {
    const searchTerm = 'Dr';
    
    await page.fill('input[placeholder*="Search"]', searchTerm);
    
    // Wait for search results
    await page.waitForTimeout(500); // Debounce delay
    
    // Verify search results
    const doctorCards = page.locator('.doctor-card, [data-testid="doctor-card"]');
    const count = await doctorCards.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const card = doctorCards.nth(i);
        await expect(card.locator('.doctor-name')).toContainText(searchTerm, { ignoreCase: true });
      }
    }
  });

  test('should view doctor schedule', async ({ page }) => {
    const doctorCard = page.locator('.doctor-card, [data-testid="doctor-card"]').first();
    
    if (await doctorCard.isVisible()) {
      await doctorCard.locator('button:has-text("View Schedule")').click();
      
      // Verify schedule modal opens
      await expect(page.locator('text=Doctor Schedule')).toBeVisible();
      await expect(page.locator('.schedule-grid, [data-testid="schedule-grid"]')).toBeVisible();
      
      // Close modal
      await page.keyboard.press('Escape');
      await expect(page.locator('text=Doctor Schedule')).not.toBeVisible();
    }
  });

  test('should display next available appointment time', async ({ page }) => {
    const doctorCards = page.locator('.doctor-card, [data-testid="doctor-card"]');
    const count = await doctorCards.count();
    
    if (count > 0) {
      const firstCard = doctorCards.first();
      
      // Check for next available time
      const nextAvailable = firstCard.locator('.next-available, [data-testid="next-available"]');
      await expect(nextAvailable).toBeVisible();
      
      // Should contain time information
      const timeText = await nextAvailable.textContent();
      expect(timeText).toMatch(/\d{1,2}:\d{2}|Tomorrow|Today|Available/);
    }
  });

  test('should validate doctor form', async ({ page }) => {
    await page.click('button:has-text("Add New Doctor")');
    
    // Try to submit empty form
    await page.click('button:has-text("Add Doctor")');
    
    // Check for validation messages
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Specialization is required')).toBeVisible();
    await expect(page.locator('text=Gender is required')).toBeVisible();
    await expect(page.locator('text=Location is required')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through main elements
    await page.keyboard.press('Tab');
    await expect(page.locator('button:has-text("Add New Doctor")')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[placeholder*="Search"]')).toBeFocused();
    
    // Test modal keyboard navigation
    await page.click('button:has-text("Add New Doctor")');
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="name"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="specialization"]')).toBeFocused();
    
    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Add New Doctor')).not.toBeVisible();
  });

  test('should display color-coded status indicators', async ({ page }) => {
    const doctorCards = page.locator('.doctor-card, [data-testid="doctor-card"]');
    const count = await doctorCards.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const card = doctorCards.nth(i);
        const statusBadge = card.locator('.status-badge, [data-testid="status-badge"]');
        
        if (await statusBadge.isVisible()) {
          const statusText = await statusBadge.textContent();
          
          // Check color coding based on status
          if (statusText?.includes('Available')) {
            await expect(statusBadge).toHaveClass(/green|success/);
          } else if (statusText?.includes('Busy')) {
            await expect(statusBadge).toHaveClass(/yellow|warning/);
          } else if (statusText?.includes('Off Duty')) {
            await expect(statusBadge).toHaveClass(/red|danger/);
          }
        }
      }
    }
  });

  test('should validate response time under 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.click('button:has-text("Add New Doctor")');
    await page.fill('input[name="name"]', 'Speed Test Doctor');
    await page.fill('input[name="specialization"]', 'Speed Testing');
    await page.selectOption('select[name="gender"]', 'male');
    await page.fill('input[name="location"]', 'Speed Room');
    await page.click('button:has-text("Add Doctor")');
    
    // Wait for doctor to appear
    await expect(page.locator('text=Speed Test Doctor')).toBeVisible();
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(responseTime).toBeLessThan(2000); // 2 seconds
  });
});