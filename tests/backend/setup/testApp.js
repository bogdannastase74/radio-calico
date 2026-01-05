const express = require('express');
const cors = require('cors');
const path = require('path');

/**
 * Create an Express app for testing with a provided database
 * @param {Database} db - SQLite database instance
 * @returns {Express.Application} - Express app
 */
function createTestApp(db) {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../../../public')));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  });

  // Get client IP address
  app.get('/api/client-ip', (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
               req.headers['x-real-ip'] ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               '';
    res.json({ ip });
  });

  // Get all users
  app.get('/api/users', (req, res) => {
    try {
      const users = db.prepare('SELECT * FROM users').all();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new user
  app.post('/api/users', (req, res) => {
    try {
      const { name, email } = req.body;
      const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
      const result = stmt.run(name, email);
      res.status(201).json({ id: result.lastInsertRowid, name, email });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get ratings for a song
  app.get('/api/ratings/:songId', (req, res) => {
    try {
      const { songId } = req.params;
      const thumbsUp = db.prepare('SELECT COUNT(*) as count FROM song_ratings WHERE song_id = ? AND rating = 1').get(songId);
      const thumbsDown = db.prepare('SELECT COUNT(*) as count FROM song_ratings WHERE song_id = ? AND rating = 0').get(songId);

      res.json({
        songId,
        thumbsUp: thumbsUp.count,
        thumbsDown: thumbsDown.count
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Submit a rating
  app.post('/api/ratings', (req, res) => {
    try {
      const { songId, userId, rating } = req.body;

      if (!songId || !userId || rating === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (rating !== 0 && rating !== 1) {
        return res.status(400).json({ error: 'Rating must be 0 (thumbs down) or 1 (thumbs up)' });
      }

      // Try to insert the rating
      const stmt = db.prepare('INSERT INTO song_ratings (song_id, user_id, rating) VALUES (?, ?, ?)');
      try {
        const result = stmt.run(songId, userId, rating);

        // Get updated counts
        const thumbsUp = db.prepare('SELECT COUNT(*) as count FROM song_ratings WHERE song_id = ? AND rating = 1').get(songId);
        const thumbsDown = db.prepare('SELECT COUNT(*) as count FROM song_ratings WHERE song_id = ? AND rating = 0').get(songId);

        res.status(201).json({
          success: true,
          songId,
          thumbsUp: thumbsUp.count,
          thumbsDown: thumbsDown.count
        });
      } catch (dbError) {
        if (dbError.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'You have already rated this song' });
        }
        throw dbError;
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check if user has rated a song
  app.get('/api/ratings/:songId/user/:userId', (req, res) => {
    try {
      const { songId, userId } = req.params;
      const rating = db.prepare('SELECT rating FROM song_ratings WHERE song_id = ? AND user_id = ?').get(songId, userId);

      res.json({
        hasRated: !!rating,
        rating: rating ? rating.rating : null
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return app;
}

module.exports = { createTestApp };
