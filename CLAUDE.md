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
- GET /api/users - List all users
- POST /api/users - Create user

### Planned
[Add planned endpoints here]

## Database Schema

### users table
- id: INTEGER PRIMARY KEY
- name: TEXT
- email: TEXT UNIQUE
- created_at: DATETIME

[Add additional tables as they're created]

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
├── RadioCalicoStyle/
│   ├── RadioCalicoLayout.png  # Layout design reference
│   ├── RadioCalicoLogoTM.png  # Original logo file
│   ├── RadioCalico_Style_Guide.txt  # Style guide documentation
│   └── stream_URL.txt         # Stream URL configuration
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Docker container definition
├── package.json               # Node.js dependencies
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
```
