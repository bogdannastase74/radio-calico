// Jest setup file for both backend and frontend tests

// Extend Jest matchers for DOM testing (frontend tests)
if (typeof window !== 'undefined') {
  require('@testing-library/jest-dom');
}

// Set test timeout
jest.setTimeout(10000);

// Suppress console errors in tests (optional)
// global.console = {
//   ...console,
//   error: jest.fn(),
// };
