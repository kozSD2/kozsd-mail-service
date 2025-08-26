const { test, expect } = require('@playwright/test');

test.describe('API Documentation E2E Tests', () => {
  test('should load Swagger UI documentation', async ({ page }) => {
    await page.goto('/api-docs');
    
    // Check that Swagger UI is loaded
    await expect(page.locator('.swagger-ui')).toBeVisible();
    
    // Check for the API title
    await expect(page.locator('text=KozSD Mail Service API')).toBeVisible();
    
    // Check for main API sections
    await expect(page.locator('text=Health')).toBeVisible();
    await expect(page.locator('text=Authentication')).toBeVisible();
    await expect(page.locator('text=Mail')).toBeVisible();
  });

  test('should display health check endpoints', async ({ page }) => {
    await page.goto('/api-docs');
    
    // Wait for Swagger UI to load
    await page.waitForSelector('.swagger-ui');
    
    // Look for health endpoints
    await expect(page.locator('text=/api/health')).toBeVisible();
    await expect(page.locator('text=/api/health/liveness')).toBeVisible();
    await expect(page.locator('text=/api/health/readiness')).toBeVisible();
  });

  test('should be able to expand endpoint details', async ({ page }) => {
    await page.goto('/api-docs');
    
    // Wait for Swagger UI to load
    await page.waitForSelector('.swagger-ui');
    
    // Find and click on a health endpoint to expand it
    const healthEndpoint = page.locator('text=/api/health').first();
    await healthEndpoint.click();
    
    // Check if the endpoint details are shown
    await expect(page.locator('text=Health check endpoint')).toBeVisible();
  });
});