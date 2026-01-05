const Database = require('better-sqlite3');

/**
 * Create an in-memory SQLite database for testing
 * @returns {Database} - SQLite database instance
 */
function createTestDb() {
  // Create in-memory database
  const db = new Database(':memory:');

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create song_ratings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS song_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(song_id, user_id)
    )
  `);

  return db;
}

/**
 * Seed test data into the database
 * @param {Database} db - SQLite database instance
 */
function seedTestData(db) {
  // Insert test users
  const insertUser = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
  insertUser.run('Test User 1', 'test1@example.com');
  insertUser.run('Test User 2', 'test2@example.com');

  // Insert test ratings
  const insertRating = db.prepare('INSERT INTO song_ratings (song_id, user_id, rating) VALUES (?, ?, ?)');
  insertRating.run('song_1', 'user_1', 1); // thumbs up
  insertRating.run('song_1', 'user_2', 0); // thumbs down
  insertRating.run('song_2', 'user_1', 1); // thumbs up
}

/**
 * Clean up database
 * @param {Database} db - SQLite database instance
 */
function cleanupDb(db) {
  if (db) {
    db.close();
  }
}

module.exports = {
  createTestDb,
  seedTestData,
  cleanupDb,
};
