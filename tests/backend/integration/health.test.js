const request = require('supertest');
const { createTestDb, cleanupDb } = require('../setup/testDb');
const { createTestApp } = require('../setup/testApp');

describe('Health API Endpoints', () => {
  let db;
  let app;

  beforeEach(() => {
    db = createTestDb();
    app = createTestApp(db);
  });

  afterEach(() => {
    cleanupDb(db);
  });

  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database', 'connected');
    });

    test('should return valid ISO timestamp', async () => {
      const response = await request(app)
        .get('/api/health');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });
  });

  describe('GET /api/client-ip', () => {
    test('should return client IP from x-forwarded-for header', async () => {
      const response = await request(app)
        .get('/api/client-ip')
        .set('x-forwarded-for', '192.168.1.100, 10.0.0.1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ip: '192.168.1.100' });
    });

    test('should return client IP from x-real-ip header', async () => {
      const response = await request(app)
        .get('/api/client-ip')
        .set('x-real-ip', '192.168.1.200');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ip: '192.168.1.200' });
    });

    test('should prioritize x-forwarded-for over x-real-ip', async () => {
      const response = await request(app)
        .get('/api/client-ip')
        .set('x-forwarded-for', '192.168.1.100')
        .set('x-real-ip', '192.168.1.200');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ip: '192.168.1.100' });
    });

    test('should handle empty IP gracefully', async () => {
      const response = await request(app)
        .get('/api/client-ip');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ip');
    });
  });
});
