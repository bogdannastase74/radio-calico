const request = require('supertest');
const { createTestDb, seedTestData, cleanupDb } = require('../setup/testDb');
const { createTestApp } = require('../setup/testApp');

describe('Users API Endpoints', () => {
  let db;
  let app;

  beforeEach(() => {
    db = createTestDb();
    app = createTestApp(db);
  });

  afterEach(() => {
    cleanupDb(db);
  });

  describe('GET /api/users', () => {
    test('should return empty array when no users exist', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return all users', async () => {
      seedTestData(db);

      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name', 'Test User 1');
      expect(response.body[0]).toHaveProperty('email', 'test1@example.com');
      expect(response.body[0]).toHaveProperty('created_at');
    });
  });

  describe('POST /api/users', () => {
    test('should create a new user', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'New User',
          email: 'newuser@example.com'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'New User');
      expect(response.body).toHaveProperty('email', 'newuser@example.com');
    });

    test('should reject duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/users')
        .send({
          name: 'User One',
          email: 'duplicate@example.com'
        });

      // Try to create user with same email
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'User Two',
          email: 'duplicate@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle missing name', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle missing email', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
