import { test, expect } from '@playwright/test';

test.describe('Performance Testing', () => {
  test('should load login page within 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    expect(loadTime).toBeLessThan(2000);
  });

  test('should load dashboard within 2 seconds after login', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    
    const startTime = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    expect(loadTime).toBeLessThan(2000);
  });

  test('should navigate between pages quickly', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Test navigation speed
    const startTime = Date.now();
    await page.click('text=Queue Management');
    await page.waitForURL('/dashboard/queue');
    await page.waitForLoadState('networkidle');
    
    const endTime = Date.now();
    const navigationTime = endTime - startTime;
    
    expect(navigationTime).toBeLessThan(1000); // Navigation should be faster than initial load
  });

  test('should handle form submissions within 2 seconds', async ({ page }) => {
    // Login and navigate to queue management
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.click('text=Queue Management');
    
    // Test form submission speed
    await page.click('button:has-text("Add New Patient to Queue")');
    await page.fill('input[name="name"]', 'Performance Test Patient');
    
    const startTime = Date.now();
    await page.click('button:has-text("Add to Queue")');
    await expect(page.locator('text=Performance Test Patient')).toBeVisible();
    
    const endTime = Date.now();
    const submissionTime = endTime - startTime;
    
    expect(submissionTime).toBeLessThan(2000);
  });

  test('should handle search operations quickly', async ({ page }) => {
    // Login and navigate to queue management
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.click('text=Queue Management');
    
    // Test search performance
    const startTime = Date.now();
    await page.fill('input[placeholder*="Search"]', 'test');
    
    // Wait for search results (debounced)
    await page.waitForTimeout(600); // Account for debounce delay
    
    const endTime = Date.now();
    const searchTime = endTime - startTime;
    
    expect(searchTime).toBeLessThan(1000);
  });

  test('should measure Core Web Vitals', async ({ page }) => {
    await page.goto('/login');
    
    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: Record<string, number> = {};
          
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.FCP = entry.startTime;
            }
            if (entry.name === 'largest-contentful-paint') {
              vitals.LCP = entry.startTime;
            }
          });
          
          // Get CLS (Cumulative Layout Shift)
          let cls = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                cls += (entry as any).value;
              }
            }
            vitals.CLS = cls;
          }).observe({ type: 'layout-shift', buffered: true });
          
          setTimeout(() => resolve(vitals), 3000);
        }).observe({ type: 'paint', buffered: true });
      });
    });
    
    // Core Web Vitals thresholds
    if ((metrics as any).FCP) {
      expect((metrics as any).FCP).toBeLessThan(1800); // FCP should be < 1.8s
    }
    if ((metrics as any).LCP) {
      expect((metrics as any).LCP).toBeLessThan(2500); // LCP should be < 2.5s
    }
    if ((metrics as any).CLS !== undefined) {
      expect((metrics as any).CLS).toBeLessThan(0.1); // CLS should be < 0.1
    }
  });

  test('should handle concurrent users simulation', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);
    
    const pages = await Promise.all(contexts.map(context => context.newPage()));
    
    const startTime = Date.now();
    
    // Simulate concurrent logins
    await Promise.all(pages.map(async (page, index) => {
      await page.goto('/login');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
    }));
    
    const endTime = Date.now();
    const concurrentTime = endTime - startTime;
    
    // Should handle 3 concurrent users within reasonable time
    expect(concurrentTime).toBeLessThan(5000);
    
    // Cleanup
    await Promise.all(contexts.map(context => context.close()));
  });

  test('should have reasonable bundle size', async ({ page }) => {
    await page.goto('/login');
    
    // Get network requests
    const responses: any[] = [];
    page.on('response', response => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        responses.push({
          url: response.url(),
          size: response.headers()['content-length'],
          type: response.url().includes('.js') ? 'js' : 'css'
        });
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Calculate total bundle size
    let totalJSSize = 0;
    let totalCSSSize = 0;
    
    responses.forEach(response => {
      const size = parseInt(response.size || '0');
      if (response.type === 'js') {
        totalJSSize += size;
      } else {
        totalCSSSize += size;
      }
    });
    
    // Bundle size thresholds (in bytes)
    expect(totalJSSize).toBeLessThan(250 * 1024); // 250KB for JS
    expect(totalCSSSize).toBeLessThan(50 * 1024);  // 50KB for CSS
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      } : null;
    });
    
    // Navigate through different pages
    await page.click('text=Queue Management');
    await page.waitForLoadState('networkidle');
    
    await page.click('text=Appointment Management');
    await page.waitForLoadState('networkidle');
    
    await page.click('text=Doctor Management');
    await page.waitForLoadState('networkidle');
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      } : null;
    });
    
    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
      
      // Memory increase should be reasonable (less than 50% increase)
      expect(memoryIncreasePercent).toBeLessThan(50);
    }
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    // Login and navigate to queue management
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.click('text=Queue Management');
    
    // Add multiple patients to test performance with larger dataset
    const startTime = Date.now();
    
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Add New Patient to Queue")');
      await page.fill('input[name="name"]', `Performance Test Patient ${i}`);
      await page.click('button:has-text("Add to Queue")');
      await page.waitForTimeout(100); // Small delay between additions
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Should handle multiple operations efficiently
    expect(totalTime).toBeLessThan(10000); // 10 seconds for 5 operations
    
    // Test search performance with larger dataset
    const searchStartTime = Date.now();
    await page.fill('input[placeholder*="Search"]', 'Performance');
    await page.waitForTimeout(600); // Debounce delay
    
    const searchEndTime = Date.now();
    const searchTime = searchEndTime - searchStartTime;
    
    expect(searchTime).toBeLessThan(1000);
  });

  test('should maintain performance on mobile devices', async ({ page }) => {
    // Set mobile viewport and network conditions
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Simulate slower network (3G)
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 40, // 40ms latency
    });
    
    const startTime = Date.now();
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const endTime = Date.now();
    const mobileLoadTime = endTime - startTime;
    
    // Should load within reasonable time on mobile/3G
    expect(mobileLoadTime).toBeLessThan(5000); // 5 seconds on 3G
  });
});