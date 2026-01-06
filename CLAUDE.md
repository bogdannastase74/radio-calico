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
├── scripts/                   # Deployment and maintenance scripts
│   ├── deploy.sh              # Production deployment script
│   ├── build.sh               # Docker image build script
│   ├── backup.sh              # Database backup script
│   └── README.md              # Scripts documentation
├── RadioCalicoStyle/
│   ├── RadioCalicoLayout.png  # Layout design reference
│   ├── RadioCalicoLogoTM.png  # Original logo file
│   ├── RadioCalico_Style_Guide.txt  # Style guide documentation
│   └── stream_URL.txt         # Stream URL configuration
├── docker-compose.yml         # Development Docker Compose configuration
├── docker-compose.production.yml  # Production Docker Compose configuration
├── Dockerfile                 # Development Docker container definition
├── Dockerfile.production      # Production Docker container definition (multi-stage)
├── .dockerignore              # Docker build exclusions
├── package.json               # Node.js dependencies
├── CLAUDE.md                  # This file - Claude context
├── DEPLOYMENT.md              # Production deployment guide
└── README.md                  # Project documentation
```

## Development Commands

```bash
# Start development server
docker compose up -d

# Stop development server
docker compose down

# View logs
docker compose logs -f

# Rebuild development container
docker compose up -d --build
```

## Production Deployment

### Quick Deploy
```bash
# Deploy to production (builds and starts)
./scripts/deploy.sh

# Or manually with docker-compose
docker compose -f docker-compose.production.yml up -d --build
```

### Production Commands
```bash
# Build production image
./scripts/build.sh

# Deploy to production
./scripts/deploy.sh

# Create database backup
./scripts/backup.sh

# View production logs
docker compose -f docker-compose.production.yml logs -f

# Stop production
docker compose -f docker-compose.production.yml down

# Restart production
docker compose -f docker-compose.production.yml restart
```

### Production Features
- **Multi-stage Docker build** - Optimized image size (~150-200MB)
- **Non-root user** - Runs as nodejs user (uid 1001) for security
- **Health checks** - Built-in health monitoring
- **Resource limits** - CPU and memory constraints
- **Persistent data** - Volume-mounted SQLite database
- **Automated backups** - Backup script with retention policy
- **Production-ready** - No dev dependencies, optimized for deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment guide.
