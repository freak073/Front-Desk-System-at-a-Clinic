import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should display login form with proper accessibility', async ({ page }) => {
    await page.goto('/login');
    
    // Check accessibility
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });

    // Verify form elements
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check ARIA labels
    await expect(page.locator('input[name="username"]')).toHaveAttribute('aria-label');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('aria-label');
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');
    
    await page.click('button[type="submit"]');
    
    // Check for validation messages
    await expect(page.locator('text=Username is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="username"]', 'invalid_user');
    await page.fill('input[name="password"]', 'wrong_password');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Front Desk Dashboard')).toBeVisible();
  });

  test('should maintain session after page refresh', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // Refresh page
    await page.reload();
    
    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Front Desk Dashboard')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // Logout
    await page.click('button:has-text("Logout")');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/login');
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="username"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
    
    // Submit with Enter key
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.keyboard.press('Enter');
    
    await expect(page).toHaveURL('/dashboard');
  });
});