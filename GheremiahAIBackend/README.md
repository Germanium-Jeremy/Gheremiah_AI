# Gheremiah AI Backend

The backend API server for Gheremiah AI, built with Express.js, MongoDB, and Google's Gemini AI. This service handles user authentication, chat interactions with AI, and API key management.

## About This Project

This backend was created as a study project to learn and practice full-stack development with modern technologies. It demonstrates building a secure, scalable API that integrates with third-party AI services while implementing proper authentication and authorization patterns.

## Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **AI Chat Integration**: Seamless integration with Google Gemini 2.5 Flash and 2.0 Pro models
- **Streaming Support**: Real-time streaming responses for better user experience
- **API Key Management**: Users can create and manage API keys for programmatic access
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **Subscription Tiers**: Free and premium tiers with different token limits
- **Custom System Prompts**: Default AI personality with override capability

## Tech Stack

- **Node.js** with TypeScript
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **@ai-sdk/google** - AI integration
- **express-rate-limit** - Rate limiting
- **Zod** - Schema validation

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token

### Chat
- `POST /api/chat` - Send messages to AI (supports streaming)

### API Keys
- `GET /api/keys` - List user's API keys
- `POST /api/keys` - Create a new API key
- `DELETE /api/keys/:id` - Delete an API key

### Health
- `GET /health` - Health check endpoint

## Installation & Setup

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- Google Gemini API key

### Clone and Install

```bash
# Navigate to the backend directory
cd GheremiahAIBackend

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the `GheremiahAIBackend` directory:

```env
MONGODB_URI=mongodb://localhost:27017/gheremiah-ai
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/gheremiah-ai

GOOGLE_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_here
PORT=8000
```

### Build

```bash
# Build the shared package first (from root)
cd ..
npm run build:shared

# Then build the backend
cd GheremiahAIBackend
npm run build
```

### Run

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm start
```

## Usage Examples

### Register a User

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Chat with AI (using JWT)

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ],
    "model": "gemini-2.5-flash",
    "stream": false
  }'
```

### Chat with AI (using API Key)

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "x-api-key: gai_xxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Explain TypeScript"}
    ],
    "model": "gemini-2.0-pro",
    "stream": true
  }'
```

### Create an API Key

```bash
curl -X POST http://localhost:8000/api/keys \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My App Key"
  }'
```

## Key Lessons Learned

During the development of this backend, several important lessons were learned:

1. **TypeScript Configuration**: Understanding the relationship between `module` and `moduleResolution` settings in `tsconfig.json` and how they affect module resolution in Node.js environments.

2. **Monorepo Build Processes**: The importance of building shared packages before dependent packages in a monorepo setup. The build script was updated to ensure the `@gheremiah-ai/shared` package is built before the backend.

3. **Express Trust Proxy**: When deploying behind reverse proxies (like Render), the `trust proxy` setting must be configured correctly for rate limiting to work properly. Setting it to `1` (trust one hop) is more secure than `true` (trust all hops).

4. **AI SDK Integration**: Learning to use the Vercel AI SDK with streaming support, including proper error handling and response formatting.

5. **Security Best Practices**: Implementing proper password hashing with bcrypt, JWT token validation, and rate limiting to protect against common attacks.

6. **Environment-Specific Configuration**: Managing different configurations for development and production environments, especially when deploying to cloud platforms.

## Deployment

This backend is deployed on [Render](https://render.com). The deployment configuration includes:

- Automatic builds from the main branch
- Environment variables configured in Render dashboard
- MongoDB Atlas for production database
- Health check endpoint for monitoring

## Troubleshooting

### Build Errors

If you encounter TypeScript compilation errors related to the shared package:

```bash
# From the root directory, build the shared package first
cd shared
npm run build

# Then build the backend
cd ../GheremiahAIBackend
npm run build
```

### Module Resolution Issues

If you see errors about `moduleResolution` being deprecated, the `tsconfig.json` includes `"ignoreDeprecations": "6.0"` to silence these warnings while maintaining compatibility.

### Rate Limiting Errors

If you see validation errors about `X-Forwarded-For` headers, ensure the `trust proxy` setting is configured correctly in `src/server.ts`:

```typescript
app.set('trust proxy', 1); // Trust one hop (Render's reverse proxy)
```

## License

ISC

## Author

NKUNDABAGENZI Jeremie
