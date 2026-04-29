# Gheremiah AI Web Platform

A modern, responsive web application for interacting with Gheremiah AI, built with Next.js, TypeScript, and Tailwind CSS. This platform provides a clean interface for chatting with the AI assistant powered by Google's Gemini models.

## About This Project

This web platform was created as a study project to learn modern web development with Next.js 14 (App Router), TypeScript, and integrating with AI APIs. It demonstrates building a production-ready frontend with authentication, real-time chat, and a polished user experience.

## Features

- **Modern UI/UX**: Clean, responsive design with Tailwind CSS
- **Real-time Chat**: Streaming responses from AI for instant feedback
- **User Authentication**: Secure login and registration with JWT tokens
- **Subscription Management**: Free and premium tier support
- **Markdown Rendering**: Rich text formatting with syntax highlighting for code
- **Dark Mode Support**: VS Code-inspired dark theme
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Vercel AI SDK** - AI integration with streaming support
- **Axios** - HTTP client
- **Zod** - Schema validation

## Proof of Concept

![Web Platform Demo](../ProofOfConcepts/web_platform.png)

## Installation & Setup

### Prerequisites
- Node.js >= 18
- npm, yarn, pnpm, or bun

### Clone and Install

```bash
# Navigate to the frontend directory
cd gheremiahaifrontend

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the `gheremiahaifrontend` directory:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
# or for production:
# NEXT_PUBLIC_BACKEND_URL=https://gheremiah-ai-backend.onrender.com
```

### Run

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

### Registration

1. Navigate to the home page
2. Click "Sign Up" to create an account
3. Enter your email and password
4. After registration, you'll receive an activation link via your email
5. Check your email and enter click on the link. After that, you are authenticated

### Chatting with AI

1. Once logged in, you'll see the chat interface
2. You should create an API key before starting your chat. Click on create API key in the nav section
3. Name your API key and click create
4. Type your message in the input field
5. Press Enter or click "Send" to submit
6. The AI will respond with streaming text in real-time
7. Code blocks are highlighted with syntax highlighting

### Subscription Tiers

- **Free Tier**: 2000 tokens per request
- **Premium Tier**: 8000 tokens per request

## Project Structure

```
gheremiahaifrontend/
├── app/
│   ├── auth/          # Authentication pages (login, register)
│   ├── chat/          # Chat interface
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Home page
├── components/        # Reusable components
├── lib/              # Utility functions
└── public/           # Static assets
```

## Key Lessons Learned

During the development of this web platform, several important lessons were learned:

1. **Next.js App Router**: Understanding the new App Router architecture in Next.js 14, including server components, client components, and the differences from the Pages Router.

2. **Streaming with AI SDK**: Implementing real-time streaming responses using the Vercel AI SDK, which provides a much better user experience compared to waiting for complete responses.

3. **Type Safety with TypeScript**: Leveraging TypeScript for type safety across the application, including API response types and component props.

4. **Tailwind CSS Best Practices**: Learning to use Tailwind CSS effectively for responsive design, including custom configurations and utility-first styling.

5. **Authentication Flow**: Implementing a complete authentication flow with JWT tokens, including protected routes and token management.

6. **Error Handling**: Proper error handling for API failures, network issues, and user input validation.

## Deployment

This web platform is deployed on [Vercel](https://vercel.com). The deployment configuration includes:

- Automatic builds from the main branch
- Environment variables configured in Vercel dashboard
- Optimized builds with Next.js production optimizations
- Automatic HTTPS and CDN

## Troubleshooting

### Build Errors

If you encounter build errors related to missing dependencies:

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### API Connection Issues

If the frontend cannot connect to the backend:

1. Verify the `NEXT_PUBLIC_BACKEND_URL` in `.env.local`
2. Ensure the backend server is running
3. Check CORS settings on the backend

### Streaming Not Working

If streaming responses don't work:

1. Verify the backend supports streaming
2. Check network connectivity
3. Ensure the Vercel AI SDK is properly installed

## License

ISC

## Author

NKUNDABAGENZI Jeremie
