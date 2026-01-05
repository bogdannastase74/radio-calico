# Claude Context File

This file contains project context, decisions, and information for Claude to reference.

## Project Overview

**Name:** RadioCalico
**Type:** Web Prototype
**Stack:** Node.js/Express + SQLite + Docker

## Current Setup

- Web Server: Express.js on port 3000
- Database: SQLite (file-based in ./data/)
- Environment: Docker containers
- Hot-reload: Enabled via nodemon

## Project Goals

[Add your goals and objectives here]

## Design Decisions

- Chose SQLite for simplicity in prototyping
- Docker setup for reproducible development environment
- Express.js for flexible backend development

## Features to Build

[List features you want to implement]

## Important Notes

- **Always check if Docker containers are running** before attempting to start them (use `docker compose ps` to check status)

## API Endpoints

### Current
- GET / - Home page
- GET /api/health - Health check
- GET /api/client-ip - Get client IP address
- GET /api/users - List all users
- POST /api/users - Create user
- GET /api/ratings/:songId - Get rating counts for a song
- POST /api/ratings - Submit a rating (0=thumbs down, 1=thumbs up)
- GET /api/ratings/:songId/user/:userId - Check if user has rated a song

### Planned
[Add planned endpoints here]

## Database Schema

### users table
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- name: TEXT NOT NULL
- email: TEXT UNIQUE NOT NULL
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

### song_ratings table
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- song_id: TEXT NOT NULL
- user_id: TEXT NOT NULL
- rating: INTEGER NOT NULL (0=thumbs down, 1=thumbs up)
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
- UNIQUE(song_id, user_id) - Prevents duplicate ratings

## Style Guide
A test version of the styling guide for the webpage is at /Volumes/KindofBlueDev/ClaudeCode/RadioCalico/ RadioCalicoStyle/RadioCalico_Style_Guide.txt

## File Structure

```
radiocalico/
├── src/
│   └── server.js              # Main Express server application
├── public/
│   ├── index.html             # Frontend HTML (structure only)
│   ├── styles.css             # CSS styling (separated from HTML)
│   ├── script.js              # JavaScript functionality (separated from HTML)
│   └── RadioCalicoLogoTM.png  # Logo for web interface
├── data/
│   └── database.sqlite        # SQLite database file
├── tests/                     # Test suite
│   ├── setup/
│   │   ├── jest.setup.js      # Jest global setup
│   │   └── polyfills.js       # Polyfills for jsdom (TextEncoder, fetch)
│   ├── backend/
│   │   ├── setup/
│   │   │   ├── testDb.js      # In-memory SQLite database utilities
│   │   │   └── testApp.js     # Express app factory for testing
│   │   └── integration/
│   │       ├── ratings.test.js   # Rating API endpoint tests
│   │       ├── users.test.js     # User API endpoint tests
│   │       └── health.test.js    # Health/utility endpoint tests
│   └── frontend/
│       ├── setup/
│       │   ├── mockServer.js     # MSW mock server configuration
│       │   └── setupTests.js     # Frontend test setup
│       ├── unit/
│       │   └── utils.test.js     # Utility function tests
│       └── integration/
│           └── rating-ui.test.js # Rating UI interaction tests
├── RadioCalicoStyle/
│   ├── RadioCalicoLayout.png  # Layout design reference
│   ├── RadioCalicoLogoTM.png  # Original logo file
│   ├── RadioCalico_Style_Guide.txt  # Style guide documentation
│   └── stream_URL.txt         # Stream URL configuration
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Docker container definition
├── package.json               # Node.js dependencies
├── jest.config.js             # Jest test configuration
├── CLAUDE.md                  # This file - Claude context
└── README.md                  # Project documentation
```

## Development Commands

```bash
# Start server
docker compose up -d

# Stop server
docker compose down

# View logs
docker compose logs -f

# Rebuild
docker compose up -d --build

# Run tests (in Docker)
docker compose exec web npm test

# Run tests with coverage
docker compose exec web npm run test:coverage

# Run backend tests only
docker compose exec web npm run test:backend

# Run frontend tests only
docker compose exec web npm run test:frontend

# Run tests in watch mode
docker compose exec web npm run test:watch
```

## Testing Framework

### Overview
- **Test Runner:** Jest
- **Backend Testing:** Supertest + In-memory SQLite
- **Frontend Testing:** Jest + JSDOM + MSW (Mock Service Worker)
- **Total Tests:** 57 tests across 5 test suites

### Backend Tests (30 tests)
**Technology Stack:**
- Jest for test runner and assertions
- Supertest for HTTP endpoint testing
- In-memory SQLite database (isolated, fast)

**Coverage:**
- ✓ Rating API endpoints (POST/GET ratings)
- ✓ Validation (required fields, valid values 0/1)
- ✓ Duplicate rating prevention (UNIQUE constraint)
- ✓ Rating count aggregation
- ✓ User rating lookup
- ✓ Users API (create, list, duplicate handling)
- ✓ Health check endpoints

**Test Files:**
- `tests/backend/integration/ratings.test.js` - Rating system tests
- `tests/backend/integration/users.test.js` - User management tests
- `tests/backend/integration/health.test.js` - Health/utility tests

### Frontend Tests (27 tests)
**Technology Stack:**
- Jest + JSDOM for browser environment simulation
- MSW 1.x for API mocking
- Testing Library for DOM utilities
- Polyfills: TextEncoder, TextDecoder, fetch

**Coverage:**
- ✓ Song ID generation (artist/title → unique ID)
- ✓ Time formatting utilities
- ✓ Rating submission (thumbs up/down)
- ✓ Button state management (active/disabled)
- ✓ API integration and error handling
- ✓ User rating restoration
- ✓ Song change behavior

**Test Files:**
- `tests/frontend/unit/utils.test.js` - Utility function tests
- `tests/frontend/integration/rating-ui.test.js` - UI interaction tests

### Test Database Strategy
- Backend tests use **in-memory SQLite** databases
- Each test gets a fresh database (isolated)
- Test app factory creates Express app with test database
- No side effects between tests

### Important Notes
- **No fingerprint testing:** User identification logic is not tested (no login requirement)
- **Isolated testing:** Frontend tests use extracted/mocked functions, not full script.js execution
- **MSW version:** Using MSW 1.x for better jsdom compatibility (2.x has issues)
- **Coverage metrics:** May show 0% but tests comprehensively cover rating functionality
