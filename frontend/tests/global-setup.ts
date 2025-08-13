import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  // Launch browser and create a new page
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the application to be ready
    await page.goto(baseURL!);
    await page.waitForLoadState('networkidle');
    
    // Create test user session if needed
    // This could include logging in as a test user and saving the session
    console.log('Global setup completed - Application is ready for testing');
    
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;