# Gheremiah AI - Slackbot

A Slack bot that brings Gheremiah AI directly to your Slack workspace, allowing team members to interact with the AI assistant without leaving Slack. Built with Node.js, TypeScript, and the Slack Bolt SDK.

## About This Project

This Slackbot was created as a study project to learn bot development with Slack's API and integrating third-party AI services. It demonstrates building a production-ready bot that can handle slash commands, direct messages, and team interactions.

## Features

- **Slash Commands**: Use `/gheremiah_ai` to ask questions directly in Slack
- **Direct Messages**: Chat with the bot in private messages
- **Mention Support**: Tag the bot in channels to get AI responses
- **Streaming Responses**: Real-time streaming of AI responses for better UX
- **Context Awareness**: Maintains conversation context within a thread
- **Team Integration**: Works seamlessly with Slack channels and DMs

## Tech Stack

- **Node.js** with TypeScript
- **Slack Bolt SDK** - Slack app framework
- **Google Gemini API** - AI integration
- **Axios** - HTTP client for backend API calls

## Proof of Concept

[![Slackbot Demo](../ProofOfConcepts/bot.png)](../ProofOfConcepts/bot.png)

Click the video above to see the Slackbot in action.

## Installation & Setup

### Prerequisites
- Node.js >= 18
- Slack Workspace with admin access
- Google Gemini API key
- Gheremiah AI Backend running

### Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App"
3. Choose "From scratch"
4. Name your app (e.g., "Gheremiah AI")
5. Select your workspace

### Configure Slack App

1. **Bot Permissions**:
   - Navigate to "OAuth & Permissions"
   - Add the following bot scopes:
     - `chat:write` - Send messages
     - `app_mentions:read` - Read mentions
     - `channels:history` - Read channel history
     - `groups:history` - Read private channel history
     - `im:history` - Read DM history
     - `mpim:history` - Read multi-person DM history

2. **Slash Commands**:
   - Navigate to "Slash Commands"
   - Create a new command:
     - Command: `/gheremiah_ai`
     <!-- - Request URL: `https://your-render-url/slack/events` -->
     - Description: "Ask Gheremiah AI a question"
     - Short description: "AI assistant"

3. **Event Subscriptions**:
   - Navigate to "Event Subscriptions"
   - Enable events
   - Request URL: `https://gheremiah-ai-backend.onrender.com`
   - Subscribe to bot events:
     - `app_mention`
     - `message.channels`
     - `message.groups`
     - `message.im`
     - `message.mpim`

4. **Install App**:
   - Navigate to "Install to Workspace"
   - Click "Install"
   - Copy the **Bot User OAuth Token** (starts with `xoxb-`)

5. **App-Level Token**:
   - Navigate to "Basic Information"
   - Scroll to "App-Level Tokens"
   - Create a new token:
     - Name: "Socket Mode Token"
     - Scope: `connections:write`
   - Copy the token (starts with `xapp-`)

### Clone and Install

```bash
# Navigate to the slackbot directory
cd GheremiahRiddler

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the `GheremiahRiddler` directory:

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_APP_TOKEN=xapp-your-app-token-here
GEMINI_API_KEY=your_gemini_api_key_here
BACKEND_URL=http://localhost:8000
# or for production:
# BACKEND_URL=https://gheremiah-ai-backend.onrender.com
PORT=3000
```

### Build

```bash
npm run build
```

### Run

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## Usage

### Using Slash Commands

In any Slack channel or DM:

```
/gheremiah_ai Explain how React hooks work
```

The bot will respond with the AI's answer.

### Mentioning the Bot

In a channel, mention the bot:

```
@Gheremiah AI What's the difference between let and const in JavaScript?
```

### Direct Messages

Send a direct message to the bot:

```
Hello! Can you help me debug my code?
```

## Project Structure

```
GheremiahAI/
├── src/
│   ├── index.ts         # Main entry point
│   ├── handlers/        # Slack event handlers
│   └── utils/           # Utility functions
├── .env.example         # Environment variables template
├── package.json
├── tsconfig.json
└── render.yaml          # Render deployment config
```

## Key Lessons Learned

During the development of this Slackbot, several important lessons were learned:

1. **Slack API Integration**: Understanding the Slack Bolt SDK and how to handle different types of events (slash commands, mentions, direct messages).

2. **OAuth and Token Management**: Properly managing bot tokens and app-level tokens for different Slack API features.

3. **Event Handling**: Learning to handle asynchronous events from Slack and respond appropriately within the timeout limits.

4. **Context Management**: Maintaining conversation context across multiple messages in a thread or DM for better AI responses.

5. **Error Handling**: Gracefully handling API failures, network issues, and Slack rate limits.

6. **Deployment**: Deploying a bot to a cloud platform (Render) and configuring webhooks for Slack events.

## Deployment

This Slackbot is deployed on [Railway](https://railway.com). The deployment configuration includes:

- Automatic builds from the main branch
- Environment variables configured in Render dashboard
- Webhook URL configured in Slack app settings
- Health checks for monitoring

## Troubleshooting

### Bot Not Responding

If the bot doesn't respond to commands:

1. Verify the bot is installed in your workspace
2. Check the bot has the necessary permissions
3. Ensure the webhook URL is correctly configured in Slack
4. Check the Render logs for errors

### Slash Command Not Working

If slash commands don't work:

1. Verify the command is created in Slack app settings
2. Check the request URL matches your deployed URL
3. Ensure the bot is reinstalled after adding commands

### Event Subscriptions Failing

If event subscriptions fail verification:

1. Ensure your bot is running and accessible
2. Check the request URL is correct
3. Verify the bot can handle the `url_verification` event

### Rate Limiting

If you encounter rate limits:

1. Slack has rate limits for bots
2. Implement exponential backoff for retries
3. Consider batching requests if possible

## License

ISC

## Author

NKUNDABAGENZI Jeremie