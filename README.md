# RadioCalico - Web Prototype

A Docker-based web development environment with Node.js/Express and SQLite.

## Quick Start

Start the server:
```bash
docker compose up -d
```

Stop the server:
```bash
docker compose down
```

View logs:
```bash
docker compose logs -f
```

## Project Structure

```
radiocalico/
├── src/
│   └── server.js       # Express server with SQLite
├── public/             # Static HTML/CSS/JS files
├── data/               # SQLite database storage
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## API Endpoints

- `GET /` - Home page with server info
- `GET /api/health` - Health check
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user (JSON body: `{name, email}`)

## Testing

Health check:
```bash
curl http://localhost:3000/api/health
```

Create a user:
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

Get all users:
```bash
curl http://localhost:3000/api/users
```

## Development

The server uses nodemon for hot-reloading. Any changes to files in `src/` or `public/` will automatically restart the server.

Visit http://localhost:3000 in your browser to see the server running.
