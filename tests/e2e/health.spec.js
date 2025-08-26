const { test, expect } = require('@playwright/test');

test.describe('Health Check API E2E Tests', () => {
  test('health endpoint should return proper response', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('uptime');
    expect(data).toHaveProperty('services');
  });

  test('liveness probe should return alive status', async ({ request }) => {
    const response = await request.get('/api/health/liveness');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('alive');
    expect(data).toHaveProperty('timestamp');
  });

  test('readiness probe should return ready status', async ({ request }) => {
    const response = await request.get('/api/health/readiness');
    
    const data = await response.json();
    expect(data).toHaveProperty('ready');
    expect(data).toHaveProperty('checks');
    expect(data).toHaveProperty('timestamp');
    expect(typeof data.ready).toBe('boolean');
  });

  test('metrics endpoint should return prometheus metrics', async ({ request }) => {
    const response = await request.get('/metrics');
    expect(response.status()).toBe(200);
    
    const text = await response.text();
    expect(text).toContain('kozsd_mail_service_');
    expect(text).toContain('# HELP');
    expect(text).toContain('# TYPE');
  });
});