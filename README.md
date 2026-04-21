# Gheremiah AI

Gemini AI-powered assistant built with multiple interfaces — web app, backend API, VS Code extension, and Slackbot.

## Architecture

```
GheremiahAI/
├── GheremiahAIBackend/       # Express.js API server (MongoDB + Gemini)
├── gheremiahaifrontend/      # Next.js web app
├── GheremiahAIExtension/     # VS Code extension
├── GheremiahRiddler/         # Slackbot (Node.js)
└── shared/                   # Shared types & utilities
```

## Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB running locally or via Atlas
- Google Gemini API key

### Setup

```bash
# Install all dependencies
npm install

# Build shared package first
npm run build:shared

# Copy env files
cp GheremiahAIBackend/.env.example GheremiahAIBackend/.env
cp GheremiahRiddler/.env.example GheremiahRiddler/.env
```

### Environment Variables

**Backend** (`GheremiahAIBackend/.env`):
- `MONGODB_URI` — MongoDB connection string
- `GOOGLE_API_KEY` — Gemini API key
- `JWT_SECRET` — Secret for JWT tokens
- `PORT` — Server port (default: 8000)

**Slackbot** (`GheremiahRiddler/.env`):
- `SLACK_BOT_TOKEN` — Slack bot token (xoxb-...)
- `SLACK_APP_TOKEN` — Slack app token (xapp-...)
- `GEMINI_API_KEY` — Gemini API key

### Run

```bash
# Start backend + frontend concurrently
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Start Slackbot
npm run dev --workspace=@gheremiah-ai/riddler
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /health` | Health check |
| `POST /api/auth/register` | Register user |
| `POST /api/auth/login` | Login user |
| `POST /api/chat` | Chat with Gemini (supports streaming) |
| `GET /api/keys` | List API keys |
| `POST /api/keys` | Create API key |
| `DELETE /api/keys/:id` | Delete API key |

### Chat API Usage

```bash
# With JWT token
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# With API key
curl -X POST http://localhost:8000/api/chat \
  -H "x-api-key: gai_xxx" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

## Author

NKUNDABAGENZI Jeremie
