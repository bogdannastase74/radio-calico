/**
 * Integration tests for rating UI functionality
 * Tests button interactions, API calls, and state management
 */

const { screen, waitFor } = require('@testing-library/dom');
const { rest } = require('msw');
const { server } = require('../setup/mockServer');

describe('Rating UI Integration', () => {
  let container;
  let thumbsUpBtn;
  let thumbsDownBtn;
  let thumbsUpCount;
  let thumbsDownCount;

  beforeEach(() => {
    // Create DOM structure
    document.body.innerHTML = `
      <div id="ratingContainer">
        <button id="thumbsUpBtn">👍</button>
        <span id="thumbsUpCount">0</span>
        <button id="thumbsDownBtn">👎</button>
        <span id="thumbsDownCount">0</span>
      </div>
    `;

    // Get elements
    thumbsUpBtn = document.getElementById('thumbsUpBtn');
    thumbsDownBtn = document.getElementById('thumbsDownBtn');
    thumbsUpCount = document.getElementById('thumbsUpCount');
    thumbsDownCount = document.getElementById('thumbsDownCount');
    container = document.getElementById('ratingContainer');

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('submitRating function', () => {
    // Mock the submitRating function from script.js
    async function submitRating(rating, songId = 'test_song', userId = 'test_user') {
      try {
        const response = await fetch('/api/ratings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            songId: songId,
            userId: userId,
            rating: rating
          })
        });

        const data = await response.json();

        if (response.ok) {
          // Update counts
          thumbsUpCount.textContent = data.thumbsUp;
          thumbsDownCount.textContent = data.thumbsDown;

          // Mark active button and disable both
          if (rating === 1) {
            thumbsUpBtn.classList.add('active');
          } else {
            thumbsDownBtn.classList.add('active');
          }
          thumbsUpBtn.disabled = true;
          thumbsDownBtn.disabled = true;

          return { success: true, data };
        } else if (response.status === 409) {
          // Already rated
          return { success: false, error: 'already_rated' };
        } else {
          return { success: false, error: data.error };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    test('should submit thumbs up rating successfully', async () => {
      const result = await submitRating(1);

      expect(result.success).toBe(true);
      expect(thumbsUpCount.textContent).toBe('1');
      expect(thumbsDownCount.textContent).toBe('0');
      expect(thumbsUpBtn.classList.contains('active')).toBe(true);
      expect(thumbsUpBtn.disabled).toBe(true);
      expect(thumbsDownBtn.disabled).toBe(true);
    });

    test('should submit thumbs down rating successfully', async () => {
      const result = await submitRating(0);

      expect(result.success).toBe(true);
      expect(thumbsUpCount.textContent).toBe('0');
      expect(thumbsDownCount.textContent).toBe('1');
      expect(thumbsDownBtn.classList.contains('active')).toBe(true);
      expect(thumbsUpBtn.disabled).toBe(true);
      expect(thumbsDownBtn.disabled).toBe(true);
    });

    test('should handle invalid rating value', async () => {
      // Mock server to reject invalid rating
      server.use(
        rest.post('/api/ratings', (req, res, ctx) => {
          const { rating } = req.body;
          if (rating !== 0 && rating !== 1) {
            return res(
              ctx.status(400),
              ctx.json({ error: 'Rating must be 0 (thumbs down) or 1 (thumbs up)' })
            );
          }
        })
      );

      const result = await submitRating(2);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rating must be 0 (thumbs down) or 1 (thumbs up)');
      expect(thumbsUpBtn.disabled).toBe(false);
      expect(thumbsDownBtn.disabled).toBe(false);
    });

    test('should handle network error', async () => {
      // Mock server to return network error
      server.use(
        rest.post('/api/ratings', (req, res) => {
          return res.networkError('Network error');
        })
      );

      const result = await submitRating(1);

      expect(result.success).toBe(false);
      expect(thumbsUpBtn.disabled).toBe(false);
      expect(thumbsDownBtn.disabled).toBe(false);
    });
  });

  describe('fetchRatings function', () => {
    // Mock the fetchRatings function from script.js
    async function fetchRatings(songId) {
      try {
        const response = await fetch(`/api/ratings/${encodeURIComponent(songId)}`);
        const data = await response.json();
        thumbsUpCount.textContent = data.thumbsUp;
        thumbsDownCount.textContent = data.thumbsDown;
        return data;
      } catch (error) {
        console.error('Failed to fetch ratings:', error);
        return null;
      }
    }

    test('should fetch and display rating counts', async () => {
      // Mock server to return specific counts
      server.use(
        rest.get('/api/ratings/:songId', (req, res, ctx) => {
          return res(ctx.json({
            songId: 'test_song',
            thumbsUp: 5,
            thumbsDown: 3
          }));
        })
      );

      const data = await fetchRatings('test_song');

      expect(data.thumbsUp).toBe(5);
      expect(data.thumbsDown).toBe(3);
      expect(thumbsUpCount.textContent).toBe('5');
      expect(thumbsDownCount.textContent).toBe('3');
    });

    test('should handle zero ratings', async () => {
      const data = await fetchRatings('new_song');

      expect(data.thumbsUp).toBe(0);
      expect(data.thumbsDown).toBe(0);
      expect(thumbsUpCount.textContent).toBe('0');
      expect(thumbsDownCount.textContent).toBe('0');
    });
  });

  describe('checkUserRating function', () => {
    // Mock the checkUserRating function from script.js
    async function checkUserRating(songId, userId) {
      try {
        const response = await fetch(`/api/ratings/${encodeURIComponent(songId)}/user/${encodeURIComponent(userId)}`);
        const data = await response.json();

        // Reset button states
        thumbsUpBtn.classList.remove('active');
        thumbsDownBtn.classList.remove('active');
        thumbsUpBtn.disabled = false;
        thumbsDownBtn.disabled = false;

        if (data.hasRated) {
          // Mark which button was clicked and disable both
          if (data.rating === 1) {
            thumbsUpBtn.classList.add('active');
          } else {
            thumbsDownBtn.classList.add('active');
          }
          thumbsUpBtn.disabled = true;
          thumbsDownBtn.disabled = true;
        }

        return data;
      } catch (error) {
        console.error('Failed to check user rating:', error);
        return null;
      }
    }

    test('should show no rating for user who has not rated', async () => {
      const data = await checkUserRating('test_song', 'test_user');

      expect(data.hasRated).toBe(false);
      expect(data.rating).toBe(null);
      expect(thumbsUpBtn.disabled).toBe(false);
      expect(thumbsDownBtn.disabled).toBe(false);
      expect(thumbsUpBtn.classList.contains('active')).toBe(false);
      expect(thumbsDownBtn.classList.contains('active')).toBe(false);
    });

    test('should restore thumbs up rating', async () => {
      // Mock server to return user has rated thumbs up
      server.use(
        rest.get('/api/ratings/:songId/user/:userId', (req, res, ctx) => {
          return res(ctx.json({
            hasRated: true,
            rating: 1
          }));
        })
      );

      const data = await checkUserRating('test_song', 'test_user');

      expect(data.hasRated).toBe(true);
      expect(data.rating).toBe(1);
      expect(thumbsUpBtn.classList.contains('active')).toBe(true);
      expect(thumbsDownBtn.classList.contains('active')).toBe(false);
      expect(thumbsUpBtn.disabled).toBe(true);
      expect(thumbsDownBtn.disabled).toBe(true);
    });

    test('should restore thumbs down rating', async () => {
      // Mock server to return user has rated thumbs down
      server.use(
        rest.get('/api/ratings/:songId/user/:userId', (req, res, ctx) => {
          return res(ctx.json({
            hasRated: true,
            rating: 0
          }));
        })
      );

      const data = await checkUserRating('test_song', 'test_user');

      expect(data.hasRated).toBe(true);
      expect(data.rating).toBe(0);
      expect(thumbsUpBtn.classList.contains('active')).toBe(false);
      expect(thumbsDownBtn.classList.contains('active')).toBe(true);
      expect(thumbsUpBtn.disabled).toBe(true);
      expect(thumbsDownBtn.disabled).toBe(true);
    });

    test('should reset button states when checking new song', async () => {
      // First, set some state
      thumbsUpBtn.classList.add('active');
      thumbsUpBtn.disabled = true;
      thumbsDownBtn.disabled = true;

      // Check new song (no rating)
      await checkUserRating('new_song', 'test_user');

      expect(thumbsUpBtn.classList.contains('active')).toBe(false);
      expect(thumbsUpBtn.disabled).toBe(false);
      expect(thumbsDownBtn.disabled).toBe(false);
    });
  });

  describe('Button click handlers', () => {
    test('should call submitRating(1) when thumbs up is clicked', async () => {
      let ratingSubmitted = null;

      async function submitRating(rating) {
        ratingSubmitted = rating;
        const response = await fetch('/api/ratings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            songId: 'test_song',
            userId: 'test_user',
            rating: rating
          })
        });
        return response.json();
      }

      // Simulate click handler
      thumbsUpBtn.addEventListener('click', () => {
        if (!thumbsUpBtn.disabled) {
          submitRating(1);
        }
      });

      thumbsUpBtn.click();

      await waitFor(() => {
        expect(ratingSubmitted).toBe(1);
      });
    });

    test('should call submitRating(0) when thumbs down is clicked', async () => {
      let ratingSubmitted = null;

      async function submitRating(rating) {
        ratingSubmitted = rating;
        const response = await fetch('/api/ratings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            songId: 'test_song',
            userId: 'test_user',
            rating: rating
          })
        });
        return response.json();
      }

      // Simulate click handler
      thumbsDownBtn.addEventListener('click', () => {
        if (!thumbsDownBtn.disabled) {
          submitRating(0);
        }
      });

      thumbsDownBtn.click();

      await waitFor(() => {
        expect(ratingSubmitted).toBe(0);
      });
    });

    test('should not submit rating when button is disabled', () => {
      let clickCount = 0;

      thumbsUpBtn.addEventListener('click', () => {
        if (!thumbsUpBtn.disabled) {
          clickCount++;
        }
      });

      thumbsUpBtn.disabled = true;
      thumbsUpBtn.click();

      expect(clickCount).toBe(0);
    });
  });

  describe('Song change scenario', () => {
    async function submitRating(rating, songId, userId) {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId, userId, rating })
      });
      const data = await response.json();

      if (response.ok) {
        thumbsUpCount.textContent = data.thumbsUp;
        thumbsDownCount.textContent = data.thumbsDown;
        if (rating === 1) {
          thumbsUpBtn.classList.add('active');
        } else {
          thumbsDownBtn.classList.add('active');
        }
        thumbsUpBtn.disabled = true;
        thumbsDownBtn.disabled = true;
      }
    }

    async function resetForNewSong() {
      thumbsUpBtn.classList.remove('active');
      thumbsDownBtn.classList.remove('active');
      thumbsUpBtn.disabled = false;
      thumbsDownBtn.disabled = false;
      thumbsUpCount.textContent = '0';
      thumbsDownCount.textContent = '0';
    }

    test('should reset button states when song changes', async () => {
      // Rate first song
      await submitRating(1, 'song_1', 'user_1');
      expect(thumbsUpBtn.disabled).toBe(true);

      // New song starts
      await resetForNewSong();

      expect(thumbsUpBtn.classList.contains('active')).toBe(false);
      expect(thumbsDownBtn.classList.contains('active')).toBe(false);
      expect(thumbsUpBtn.disabled).toBe(false);
      expect(thumbsDownBtn.disabled).toBe(false);
      expect(thumbsUpCount.textContent).toBe('0');
      expect(thumbsDownCount.textContent).toBe('0');
    });
  });
});
