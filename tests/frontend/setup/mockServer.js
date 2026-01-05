const { rest } = require('msw');
const { setupServer } = require('msw/node');

// Mock handlers for API endpoints
const handlers = [
  // Get client IP
  rest.get('/api/client-ip', (req, res, ctx) => {
    return res(ctx.json({ ip: '127.0.0.1' }));
  }),

  // Get ratings for a song
  rest.get('/api/ratings/:songId', (req, res, ctx) => {
    return res(ctx.json({
      songId: req.params.songId,
      thumbsUp: 0,
      thumbsDown: 0
    }));
  }),

  // Submit a rating
  rest.post('/api/ratings', async (req, res, ctx) => {
    const { songId, userId, rating } = req.body;

    // Validate required fields
    if (!songId || !userId || rating === undefined) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Missing required fields' })
      );
    }

    // Validate rating value
    if (rating !== 0 && rating !== 1) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Rating must be 0 (thumbs down) or 1 (thumbs up)' })
      );
    }

    // Success response
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        songId,
        thumbsUp: rating === 1 ? 1 : 0,
        thumbsDown: rating === 0 ? 1 : 0
      })
    );
  }),

  // Check if user has rated a song
  rest.get('/api/ratings/:songId/user/:userId', (req, res, ctx) => {
    return res(ctx.json({
      hasRated: false,
      rating: null
    }));
  }),
];

// Create server instance
const server = setupServer(...handlers);

module.exports = { server, handlers };
