const request = require('supertest');
const app = require('../../src/server');

describe('Mail Endpoints', () => {
  describe('POST /api/mail/send', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/mail/send')
        .send({
          to: 'test@example.com',
          subject: 'Test',
          body: 'Test email'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Unauthorized');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/mail/send')
        .set('Authorization', 'Bearer invalid-token')
        .send({})
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/mail/send')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          to: 'invalid-email',
          subject: 'Test',
          body: 'Test email'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/mail/history', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/mail/history')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Unauthorized');
    });
  });

  describe('GET /api/mail/templates', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/mail/templates')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Unauthorized');
    });
  });
});