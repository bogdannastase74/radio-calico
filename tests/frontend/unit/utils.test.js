/**
 * Unit tests for utility functions from script.js
 * Note: These functions are extracted from the frontend code for testing
 */

describe('Utility Functions', () => {
  describe('getSongId', () => {
    // Function extracted from script.js for testing
    function getSongId(artist, title) {
      return `${artist}_${title}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    }

    test('should generate song ID from artist and title', () => {
      const songId = getSongId('The Beatles', 'Hey Jude');
      expect(songId).toBe('the_beatles_hey_jude');
    });

    test('should convert to lowercase', () => {
      const songId = getSongId('ARTIST', 'TITLE');
      expect(songId).toBe('artist_title');
    });

    test('should replace special characters with underscores', () => {
      const songId = getSongId('Artist & Friends', 'Song (2023)');
      expect(songId).toBe('artist___friends_song__2023_');
    });

    test('should handle apostrophes and quotes', () => {
      const songId = getSongId("Don't Stop", "Believe'in");
      expect(songId).toBe('don_t_stop_believe_in');
    });

    test('should handle spaces', () => {
      const songId = getSongId('Artist Name', 'Song Title');
      expect(songId).toBe('artist_name_song_title');
    });

    test('should handle empty strings', () => {
      const songId = getSongId('', '');
      expect(songId).toBe('_');
    });

    test('should handle numbers', () => {
      const songId = getSongId('Artist 123', 'Song 456');
      expect(songId).toBe('artist_123_song_456');
    });

    test('should handle unicode characters', () => {
      const songId = getSongId('Café', 'Naïve');
      expect(songId).toBe('caf__na_ve');
    });
  });

  describe('formatTime', () => {
    // Function extracted from script.js for testing
    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    test('should format seconds into MM:SS format', () => {
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(90)).toBe('1:30');
    });

    test('should pad single digit seconds with zero', () => {
      expect(formatTime(5)).toBe('0:05');
      expect(formatTime(65)).toBe('1:05');
      expect(formatTime(125)).toBe('2:05');
    });

    test('should handle large time values', () => {
      expect(formatTime(3600)).toBe('60:00');
      expect(formatTime(3665)).toBe('61:05');
    });

    test('should handle decimal seconds by flooring', () => {
      expect(formatTime(30.5)).toBe('0:30');
      expect(formatTime(90.9)).toBe('1:30');
    });

    test('should handle negative values (edge case)', () => {
      // Note: This is an edge case, the actual implementation might not handle negatives well
      expect(formatTime(-30)).toBe('-1:-30'); // Unusual but follows the logic
    });
  });
});
