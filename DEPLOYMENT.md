# RadioCalico Production Deployment Guide

This guide covers deploying RadioCalico in a production environment using Docker.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Deployment Options](#deployment-options)
- [Configuration](#configuration)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker Engine 20.10+ (or Docker Desktop)
- Docker Compose 2.0+
- At least 512MB RAM available
- Port 3000 available (or configure alternate port)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and start the production container
docker compose -f docker-compose.production.yml up -d

# View logs
docker compose -f docker-compose.production.yml logs -f

# Check status
docker compose -f docker-compose.production.yml ps

# Stop the container
docker compose -f docker-compose.production.yml down
```

### Option 2: Using Standalone Docker

```bash
# Build the production image
docker build -f Dockerfile.production -t radiocalico:latest .

# Run the container
docker run -d \
  --name radiocalico \
  -p 3000:3000 \
  -v radiocalico-data:/app/data \
  -e NODE_ENV=production \
  --restart always \
  radiocalico:latest

# View logs
docker logs -f radiocalico

# Stop the container
docker stop radiocalico
docker rm radiocalico
```

### Option 3: Using Build Script

```bash
# Make the script executable (first time only)
chmod +x scripts/deploy.sh

# Deploy
./scripts/deploy.sh
```

## Deployment Options

### Local/Self-Hosted Server

1. Clone the repository to your server
2. Follow Quick Start instructions above
3. Access at `http://your-server-ip:3000`

### Behind a Reverse Proxy (Nginx/Apache)

If deploying behind a reverse proxy:

**Nginx Example:**
```nginx
server {
    listen 80;
    server_name radio.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Custom Port

To run on a different port, modify the port mapping:

```bash
# Using docker-compose
# Edit docker-compose.production.yml and change:
ports:
  - "8080:3000"  # External:Internal

# Using docker run
docker run -d -p 8080:3000 ... radiocalico:latest
```

## Configuration

### Environment Variables

Create a `.env.production` file for production configuration:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Database (using SQLite, no additional config needed)
# Data persisted in /app/data volume

# Add any custom environment variables here
```

Load environment variables:
```bash
docker compose -f docker-compose.production.yml --env-file .env.production up -d
```

### Resource Limits

Adjust resource limits in `docker-compose.production.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'      # Increase for better performance
      memory: 1G     # Increase if needed
    reservations:
      cpus: '1'
      memory: 512M
```

## Monitoring & Maintenance

### Health Checks

The container includes built-in health checks:

```bash
# Check container health status
docker inspect --format='{{.State.Health.Status}}' radiocalico-production

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' radiocalico-production
```

### Viewing Logs

```bash
# Follow logs in real-time
docker compose -f docker-compose.production.yml logs -f

# View last 100 lines
docker compose -f docker-compose.production.yml logs --tail=100

# View logs for specific timeframe
docker compose -f docker-compose.production.yml logs --since 30m
```

### Updating the Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose -f docker-compose.production.yml up -d --build

# Or use the deploy script
./scripts/deploy.sh
```

### Container Management

```bash
# Restart container
docker compose -f docker-compose.production.yml restart

# Stop container
docker compose -f docker-compose.production.yml stop

# Start container
docker compose -f docker-compose.production.yml start

# Remove container and volumes (CAUTION: deletes data!)
docker compose -f docker-compose.production.yml down -v
```

## Backup & Recovery

### Backing Up Database

The SQLite database is stored in the `radiocalico-data` volume.

**Option 1: Volume Backup**
```bash
# Create backup directory
mkdir -p backups

# Backup the data volume
docker run --rm \
  -v radiocalico-data:/source:ro \
  -v $(pwd)/backups:/backup \
  alpine \
  tar czf /backup/radiocalico-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /source .
```

**Option 2: Direct Database Copy**
```bash
# Copy database file from running container
docker cp radiocalico-production:/app/data/database.sqlite ./backups/database-$(date +%Y%m%d-%H%M%S).sqlite
```

### Restoring from Backup

**Restore Volume:**
```bash
# Stop the application
docker compose -f docker-compose.production.yml down

# Restore from backup
docker run --rm \
  -v radiocalico-data:/target \
  -v $(pwd)/backups:/backup \
  alpine \
  sh -c "rm -rf /target/* && tar xzf /backup/radiocalico-backup-YYYYMMDD-HHMMSS.tar.gz -C /target"

# Restart application
docker compose -f docker-compose.production.yml up -d
```

**Restore Database File:**
```bash
# Copy database back to container
docker cp ./backups/database-YYYYMMDD-HHMMSS.sqlite radiocalico-production:/app/data/database.sqlite

# Restart to ensure changes take effect
docker compose -f docker-compose.production.yml restart
```

### Automated Backups

Set up a cron job for automated backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/radiocalico/scripts/backup.sh
```

## Troubleshooting

### Container Won't Start

```bash
# Check container status
docker compose -f docker-compose.production.yml ps

# View error logs
docker compose -f docker-compose.production.yml logs

# Check if port 3000 is in use
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

### Database Issues

```bash
# Check database file permissions
docker exec radiocalico-production ls -la /app/data/

# Verify database integrity
docker exec radiocalico-production sqlite3 /app/data/database.sqlite "PRAGMA integrity_check;"
```

### Performance Issues

```bash
# Check resource usage
docker stats radiocalico-production

# Increase resource limits in docker-compose.production.yml
# See Configuration > Resource Limits section
```

### Image Size Too Large

```bash
# Check image size
docker images radiocalico

# The multi-stage build should keep it under 200MB
# If larger, ensure .dockerignore is properly configured
```

### Reset Everything (CAUTION: Deletes all data!)

```bash
# Stop and remove containers, networks, and volumes
docker compose -f docker-compose.production.yml down -v

# Remove image
docker rmi radiocalico:latest

# Start fresh
docker compose -f docker-compose.production.yml up -d --build
```

## Security Considerations

1. **Run as Non-Root**: The container runs as user `nodejs` (uid 1001)
2. **Read-Only Filesystem**: Consider adding `read_only: true` with tmpfs mounts if needed
3. **Network Isolation**: Use Docker networks to isolate containers
4. **Secrets Management**: Never commit `.env` files; use Docker secrets or environment variables
5. **Regular Updates**: Keep Docker and base images updated

## Production Checklist

- [ ] Database backups configured
- [ ] Health monitoring set up
- [ ] Logs aggregation configured
- [ ] SSL/TLS certificate installed (if using HTTPS)
- [ ] Firewall rules configured
- [ ] Resource limits set appropriately
- [ ] Restart policy configured (`restart: always`)
- [ ] Reverse proxy configured (if applicable)
- [ ] Domain name pointed to server (if applicable)
- [ ] Environment variables secured

## Support

For issues or questions:
- Check logs: `docker compose -f docker-compose.production.yml logs`
- Review health status: `docker ps`
- Consult Docker documentation: https://docs.docker.com/

## License

[Your License Here]
