module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    'public/**/*.js',
    '!src/server.js', // Exclude main server file from coverage
  ],

  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js'
  ],

  // Setup files (run before modules are loaded)
  setupFiles: ['<rootDir>/tests/setup/polyfills.js'],

  // Setup files (run after test framework is installed)
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],

  // Projects for different test environments
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['**/tests/backend/**/*.test.js'],
      setupFiles: ['<rootDir>/tests/setup/polyfills.js'],
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: ['**/tests/frontend/**/*.test.js'],
      setupFiles: ['<rootDir>/tests/setup/polyfills.js'],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.js',
        '<rootDir>/tests/frontend/setup/setupTests.js'
      ],
    }
  ],

  // Module paths
  moduleDirectories: ['node_modules', 'src'],

  // Verbose output
  verbose: true,
};
