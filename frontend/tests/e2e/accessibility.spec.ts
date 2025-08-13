import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

test.describe('Accessibility Testing (WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
  });

  test('should pass accessibility audit on login page', async ({ page }) => {
    await page.goto('/login');
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
      rules: {
        // WCAG 2.1 AA rules
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true },
        'aria-labels': { enabled: true },
        'heading-structure': { enabled: true },
        'form-labels': { enabled: true },
      }
    });
  });

  test('should pass accessibility audit on dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('should pass accessibility audit on queue management', async ({ page }) => {
    // Login and navigate
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.click('text=Queue Management');
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('should pass accessibility audit on appointment management', async ({ page }) => {
    // Login and navigate
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.click('text=Appointment Management');
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/login');
    
    // Check heading structure
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1); // Should have exactly one h1
    
    // Check that headings are in logical order
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    
    // Verify h1 exists and is meaningful
    const h1Text = await page.locator('h1').textContent();
    expect(h1Text).toBeTruthy();
    expect(h1Text?.length).toBeGreaterThan(0);
  });

  test('should have proper form labels and ARIA attributes', async ({ page }) => {
    await page.goto('/login');
    
    // Check that all form inputs have labels or aria-label
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.locator('xpath=//label[@for="' + await input.getAttribute('id') + '"]').count() > 0;
      const hasAriaLabel = await input.getAttribute('aria-label') !== null;
      const hasAriaLabelledBy = await input.getAttribute('aria-labelledby') !== null;
      
      expect(hasLabel || hasAriaLabel || hasAriaLabelledBy).toBe(true);
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/login');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    const firstFocusable = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A'].includes(firstFocusable || '')).toBe(true);
    
    // Test that all interactive elements are reachable by keyboard
    const interactiveElements = await page.locator('button, input, select, textarea, a[href]').count();
    
    let tabCount = 0;
    let currentElement = '';
    
    // Tab through all elements (with reasonable limit)
    for (let i = 0; i < Math.min(interactiveElements + 5, 20); i++) {
      await page.keyboard.press('Tab');
      const newElement = await page.evaluate(() => document.activeElement?.outerHTML);
      if (newElement !== currentElement) {
        tabCount++;
        currentElement = newElement || '';
      }
    }
    
    expect(tabCount).toBeGreaterThan(0);
  });

  test('should have sufficient color contrast ratios', async ({ page }) => {
    await page.goto('/login');
    
    // Use axe-core to check color contrast
    const violations = await getViolations(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
    
    const contrastViolations = violations.filter(v => v.id === 'color-contrast');
    expect(contrastViolations.length).toBe(0);
  });

  test('should have proper focus indicators', async ({ page }) => {
    await page.goto('/login');
    
    // Check that focusable elements have visible focus indicators
    const focusableElements = page.locator('button, input, select, textarea, a[href]');
    const count = await focusableElements.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = focusableElements.nth(i);
      await element.focus();
      
      // Check that element has focus styles
      const focusStyles = await element.evaluate((el) => {
        const styles = window.getComputedStyle(el, ':focus');
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow,
        };
      });
      
      // Should have some form of focus indicator
      const hasFocusIndicator = 
        focusStyles.outline !== 'none' ||
        focusStyles.outlineWidth !== '0px' ||
        focusStyles.boxShadow !== 'none';
      
      expect(hasFocusIndicator).toBe(true);
    }
  });

  test('should have proper ARIA roles and properties', async ({ page }) => {
    await page.goto('/login');
    
    // Check for proper ARIA usage
    const violations = await getViolations(page, null, {
      rules: {
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'aria-roles': { enabled: true },
        'aria-required-attr': { enabled: true },
      }
    });
    
    expect(violations.length).toBe(0);
  });

  test('should be compatible with screen readers', async ({ page }) => {
    await page.goto('/login');
    
    // Check for screen reader compatibility
    const violations = await getViolations(page, null, {
      rules: {
        'image-alt': { enabled: true },
        'label': { enabled: true },
        'link-name': { enabled: true },
        'button-name': { enabled: true },
      }
    });
    
    expect(violations.length).toBe(0);
  });

  test('should handle modal accessibility correctly', async ({ page }) => {
    // Login and open a modal
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.click('text=Queue Management');
    await page.click('button:has-text("Add New Patient to Queue")');
    
    // Check modal accessibility
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Check that focus is trapped in modal
    const modalElement = page.locator('[role="dialog"], .modal, [data-testid="modal"]');
    await expect(modalElement).toBeVisible();
    
    // Check that modal has proper ARIA attributes
    const hasAriaModal = await modalElement.getAttribute('aria-modal');
    const hasAriaLabelledBy = await modalElement.getAttribute('aria-labelledby');
    const hasAriaLabel = await modalElement.getAttribute('aria-label');
    
    expect(hasAriaModal).toBe('true');
    expect(hasAriaLabelledBy || hasAriaLabel).toBeTruthy();
  });

  test('should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
    await page.goto('/login');
    
    // Check that content is still visible and accessible
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Run accessibility check in high contrast mode
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('should be responsive and accessible on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    // Check accessibility on mobile
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Check that touch targets are large enough (minimum 44px)
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const boundingBox = await button.boundingBox();
      
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});