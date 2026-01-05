// Polyfills that need to be loaded before any modules
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Add fetch polyfill for jsdom
require('whatwg-fetch');
