const request = require('supertest');
const app = require('../../src/server');

describe('Health Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('services');
    });
  });

  describe('GET /api/health/liveness', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/api/health/liveness')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toEqual({
        status: 'alive',
        timestamp: expect.any(String)
      });
    });
  });

  describe('GET /api/health/readiness', () => {
    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/api/health/readiness')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('ready');
      expect(response.body).toHaveProperty('checks');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.ready).toBe('boolean');
    });
  });
});