# RadioCalico Deployment Scripts

This directory contains scripts to help with building, deploying, and maintaining RadioCalico in production.

## Scripts

### deploy.sh
**Full production deployment script**

Builds the production Docker image and deploys it using docker-compose.

```bash
./scripts/deploy.sh
```

Features:
- Checks for Docker and Docker Compose
- Stops existing containers
- Builds fresh production image
- Starts containers with health checks
- Waits for application to be ready
- Displays status and useful commands

### build.sh
**Build production Docker image**

Builds the production-optimized Docker image without deploying.

```bash
# Build with default settings
./scripts/build.sh

# Build with custom tag
./scripts/build.sh --tag v1.0.0

# Build without cache
./scripts/build.sh --no-cache

# Build with custom tag and no cache
./scripts/build.sh --tag v1.0.0 --no-cache
```

Options:
- `--tag TAG`: Set custom image tag (default: latest)
- `--no-cache`: Build without using Docker cache
- `--help`: Show help message

### backup.sh
**Database backup script**

Creates a backup of the RadioCalico database.

```bash
./scripts/backup.sh
```

Features:
- Backs up SQLite database from running container
- Falls back to volume backup if container is stopped
- Creates timestamped backup files in `backups/` directory
- Automatically cleans up backups older than 7 days
- Works with or without running container

## Automated Backups

To set up automated daily backups, add to crontab:

```bash
# Edit crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /path/to/radiocalico/scripts/backup.sh >> /path/to/radiocalico/logs/backup.log 2>&1
```

## Restoring from Backup

### Restore Database File

```bash
# Stop the application
docker compose -f docker-compose.production.yml down

# Restore database (replace TIMESTAMP with actual backup timestamp)
docker cp backups/database-TIMESTAMP.sqlite radiocalico-production:/app/data/database.sqlite

# Or copy to volume
docker run --rm \
  -v radiocalico-data:/data \
  -v $(pwd)/backups:/backups \
  alpine cp /backups/database-TIMESTAMP.sqlite /data/database.sqlite

# Restart application
docker compose -f docker-compose.production.yml up -d
```

### Restore Volume Backup

```bash
# Stop the application
docker compose -f docker-compose.production.yml down

# Restore from volume backup (replace TIMESTAMP)
docker run --rm \
  -v radiocalico-data:/target \
  -v $(pwd)/backups:/backup \
  alpine \
  sh -c "rm -rf /target/* && tar xzf /backup/radiocalico-volume-backup-TIMESTAMP.tar.gz -C /target"

# Restart application
docker compose -f docker-compose.production.yml up -d
```

## Quick Reference

| Task | Command |
|------|---------|
| Deploy to production | `./scripts/deploy.sh` |
| Build image only | `./scripts/build.sh` |
| Create backup | `./scripts/backup.sh` |
| View logs | `docker compose -f docker-compose.production.yml logs -f` |
| Check status | `docker compose -f docker-compose.production.yml ps` |
| Stop application | `docker compose -f docker-compose.production.yml down` |
| Restart application | `docker compose -f docker-compose.production.yml restart` |

## Troubleshooting

### Scripts won't run (Permission denied)

```bash
chmod +x scripts/*.sh
```

### Docker not found

Install Docker: https://docs.docker.com/get-docker/

### Container won't start

```bash
# Check logs
docker compose -f docker-compose.production.yml logs

# Check if port 3000 is in use
lsof -i :3000  # macOS/Linux
```

### Backup fails

Ensure the container name is correct:
```bash
docker ps --format '{{.Names}}'
```

If the name is different, edit `backup.sh` and update the `CONTAINER_NAME` variable.

## Additional Resources

- [Full Deployment Guide](../DEPLOYMENT.md)
- [Main README](../README.md)
- [Docker Documentation](https://docs.docker.com/)
