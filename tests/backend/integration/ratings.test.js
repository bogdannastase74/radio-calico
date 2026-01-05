const request = require('supertest');
const { createTestDb, cleanupDb } = require('../setup/testDb');
const { createTestApp } = require('../setup/testApp');

describe('Rating API Endpoints', () => {
  let db;
  let app;

  beforeEach(() => {
    db = createTestDb();
    app = createTestApp(db);
  });

  afterEach(() => {
    cleanupDb(db);
  });

  describe('POST /api/ratings', () => {
    test('should submit a thumbs up rating (rating=1)', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: 'test_song_1',
          userId: 'test_user_1',
          rating: 1
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        songId: 'test_song_1',
        thumbsUp: 1,
        thumbsDown: 0
      });
    });

    test('should submit a thumbs down rating (rating=0)', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: 'test_song_1',
          userId: 'test_user_1',
          rating: 0
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        songId: 'test_song_1',
        thumbsUp: 0,
        thumbsDown: 1
      });
    });

    test('should reject rating with missing songId', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          userId: 'test_user_1',
          rating: 1
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Missing required fields'
      });
    });

    test('should reject rating with missing userId', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: 'test_song_1',
          rating: 1
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Missing required fields'
      });
    });

    test('should reject rating with missing rating value', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: 'test_song_1',
          userId: 'test_user_1'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Missing required fields'
      });
    });

    test('should reject invalid rating value (not 0 or 1)', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: 'test_song_1',
          userId: 'test_user_1',
          rating: 2
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Rating must be 0 (thumbs down) or 1 (thumbs up)'
      });
    });

    test('should reject negative rating value', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: 'test_song_1',
          userId: 'test_user_1',
          rating: -1
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Rating must be 0 (thumbs down) or 1 (thumbs up)'
      });
    });

    test('should prevent duplicate rating from same user for same song', async () => {
      // First rating
      await request(app)
        .post('/api/ratings')
        .send({
          songId: 'test_song_1',
          userId: 'test_user_1',
          rating: 1
        });

      // Duplicate rating
      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: 'test_song_1',
          userId: 'test_user_1',
          rating: 0
        });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: 'You have already rated this song'
      });
    });

    test('should allow multiple users to rate the same song', async () => {
      // User 1 rates
      await request(app)
        .post('/api/ratings')
        .send({
          songId: 'test_song_1',
          userId: 'test_user_1',
          rating: 1
        });

      // User 2 rates
      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: 'test_song_1',
          userId: 'test_user_2',
          rating: 0
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        songId: 'test_song_1',
        thumbsUp: 1,
        thumbsDown: 1
      });
    });

    test('should allow same user to rate multiple songs', async () => {
      // Rate song 1
      const response1 = await request(app)
        .post('/api/ratings')
        .send({
          songId: 'test_song_1',
          userId: 'test_user_1',
          rating: 1
        });

      // Rate song 2
      const response2 = await request(app)
        .post('/api/ratings')
        .send({
          songId: 'test_song_2',
          userId: 'test_user_1',
          rating: 0
        });

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.songId).toBe('test_song_1');
      expect(response2.body.songId).toBe('test_song_2');
    });

    test('should correctly aggregate rating counts', async () => {
      // Add multiple ratings
      await request(app).post('/api/ratings').send({
        songId: 'test_song_1',
        userId: 'user_1',
        rating: 1
      });

      await request(app).post('/api/ratings').send({
        songId: 'test_song_1',
        userId: 'user_2',
        rating: 1
      });

      await request(app).post('/api/ratings').send({
        songId: 'test_song_1',
        userId: 'user_3',
        rating: 0
      });

      const response = await request(app).post('/api/ratings').send({
        songId: 'test_song_1',
        userId: 'user_4',
        rating: 1
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        songId: 'test_song_1',
        thumbsUp: 3,
        thumbsDown: 1
      });
    });
  });

  describe('GET /api/ratings/:songId', () => {
    test('should get rating counts for a song with no ratings', async () => {
      const response = await request(app)
        .get('/api/ratings/test_song_new');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        songId: 'test_song_new',
        thumbsUp: 0,
        thumbsDown: 0
      });
    });

    test('should get rating counts for a song with ratings', async () => {
      // Add some ratings
      await request(app).post('/api/ratings').send({
        songId: 'test_song_1',
        userId: 'user_1',
        rating: 1
      });

      await request(app).post('/api/ratings').send({
        songId: 'test_song_1',
        userId: 'user_2',
        rating: 1
      });

      await request(app).post('/api/ratings').send({
        songId: 'test_song_1',
        userId: 'user_3',
        rating: 0
      });

      const response = await request(app)
        .get('/api/ratings/test_song_1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        songId: 'test_song_1',
        thumbsUp: 2,
        thumbsDown: 1
      });
    });

    test('should handle URL-encoded song IDs', async () => {
      const songId = 'artist_name_song_title';

      await request(app).post('/api/ratings').send({
        songId: songId,
        userId: 'user_1',
        rating: 1
      });

      const response = await request(app)
        .get(`/api/ratings/${encodeURIComponent(songId)}`);

      expect(response.status).toBe(200);
      expect(response.body.songId).toBe(songId);
    });
  });

  describe('GET /api/ratings/:songId/user/:userId', () => {
    test('should return hasRated=false for user who has not rated', async () => {
      const response = await request(app)
        .get('/api/ratings/test_song_1/user/test_user_1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        hasRated: false,
        rating: null
      });
    });

    test('should return hasRated=true with rating=1 for thumbs up', async () => {
      // Submit rating
      await request(app).post('/api/ratings').send({
        songId: 'test_song_1',
        userId: 'test_user_1',
        rating: 1
      });

      const response = await request(app)
        .get('/api/ratings/test_song_1/user/test_user_1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        hasRated: true,
        rating: 1
      });
    });

    test('should return hasRated=true with rating=0 for thumbs down', async () => {
      // Submit rating
      await request(app).post('/api/ratings').send({
        songId: 'test_song_1',
        userId: 'test_user_1',
        rating: 0
      });

      const response = await request(app)
        .get('/api/ratings/test_song_1/user/test_user_1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        hasRated: true,
        rating: 0
      });
    });

    test('should handle URL-encoded songId and userId', async () => {
      const songId = 'artist_song_title';
      const userId = 'user@domain.com';

      await request(app).post('/api/ratings').send({
        songId: songId,
        userId: userId,
        rating: 1
      });

      const response = await request(app)
        .get(`/api/ratings/${encodeURIComponent(songId)}/user/${encodeURIComponent(userId)}`);

      expect(response.status).toBe(200);
      expect(response.body.hasRated).toBe(true);
      expect(response.body.rating).toBe(1);
    });
  });
});
