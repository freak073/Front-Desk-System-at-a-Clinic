import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Global teardown - Cleaning up test environment');
  
  // Clean up any test data, close connections, etc.
  // This could include database cleanup, file cleanup, etc.
  
  console.log('Global teardown completed');
}

export default globalTeardown;