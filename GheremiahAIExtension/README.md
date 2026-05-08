# Gheremiah AI VS Code Extension

A VS Code extension that brings Gheremiah AI directly into your editor, allowing you to get AI assistance while coding without leaving your development environment. Built with TypeScript, VS Code API, and a custom webview interface.

## About This Project

This VS Code extension was created as a study project to learn VS Code extension development, webview panels, and integrating with external APIs. It demonstrates building a production-ready extension with authentication, custom UI, and seamless integration with the editor.

## Features

- **Inline AI Assistance**: Chat with Gheremiah AI directly in VS Code
- **OAuth Authentication**: Secure authentication via browser-based OAuth flow
- **Custom Webview UI**: Beautiful, responsive chat interface with VS Code styling
- **Markdown Rendering**: Rich text formatting with syntax highlighting for code
- **Streaming Responses**: Real-time streaming of AI responses
- **Token Management**: Secure token storage using VS Code's secret storage API
- **Context Awareness**: Ask questions about your code while editing

## Tech Stack

- **TypeScript** - Type safety
- **VS Code API** - Extension framework
- **Webview Panels** - Custom UI rendering
- **Axios** - HTTP client for backend API calls
- **Marked.js** - Markdown parsing
- **Highlight.js** - Syntax highlighting
- **DOMPurify** - HTML sanitization
- **Tailwind CSS** - Styling

## Proof of Concept

[![Extension Demo](../ProofOfConcepts/Extension.png)](../ProofOfConcepts/Extension.png)

Click the video above to see the VS Code extension in action.

## Installation & Setup

### Prerequisites
- VS Code (latest version)
- Node.js >= 18
- Gheremiah AI Backend running

### Clone and Install

```bash
# Navigate to the extension directory
cd GheremiahAIExtension

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the `GheremiahAIExtension` directory:

```env
BACKEND_URL=http://localhost:8000
# or for production:
# BACKEND_URL=https://gheremiah-ai-backend.onrender.com

FRONTEND_URL=http://localhost:3000
# or for production:
# FRONTEND_URL=https://gheremiahai.vercel.app

GEMINI_API_KEY=your_gemini_api_key_here
```

### Build

```bash
# Compile TypeScript
npm run compile

# Watch for changes during development
npm run watch
```

### Run in Development

1. Open VS Code
2. Press `F5` or go to Run and Debug
3. Select "Run Extension"
4. A new VS Code window will open with the extension loaded

### Package for Distribution

```bash
# Install vsce (VS Code Extension Manager)
npm install -g @vscode/vsce

# Package the extension
vsce package

# This creates a .vsix file that can be installed
```

### Install from VSIX

```bash
# Install the packaged extension
code --install-extension gheremiahai-extension-x.x.x.vsix
```

## Usage

### Starting the Extension

1. Open VS Code
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type "Gheremiah AI: Start" and select it
4. The chat panel will open in a new column

### Authentication

1. When you first open the extension, you'll see a sign-in view
2. Click "Sign in to Gheremiah AI"
3. A browser window will open for authentication
4. Complete the authentication flow
5. The extension will automatically detect the successful login

### Chatting with AI

1. Once authenticated, you'll see the chat interface
2. Type your question in the input field
3. Press Enter or click "Send"
4. The AI will respond with streaming text
5. Code blocks are highlighted with syntax highlighting

### Keyboard Shortcuts

- `Enter` - Send message
- `Shift + Enter` - Add new line in input

### Testing Authentication

To test the authentication flow, you can delete your stored token:

1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type "Gheremiah AI: Delete Access Token" and select it
3. The token will be deleted and you'll need to sign in again

## Project Structure

```
GheremiahAIExtension/
├── src/
│   ├── extension.ts          # Main extension entry point
│   ├── scripts/
│   │   └── chat.ts          # Chat webview logic
│   ├── index.html           # Webview HTML template
│   └── output.css           # Compiled Tailwind CSS
├── .vscodeignore            # Files to exclude from package
├── package.json             # Extension manifest
├── tsconfig.json            # TypeScript configuration
└── LICENSE                  # ISC License
```

## Key Lessons Learned

During the development of this VS Code extension, several important lessons were learned:

1. **VS Code Extension Architecture**: Understanding the extension lifecycle, activation events, and the VS Code API for commands, webviews, and secret storage.

2. **Webview Communication**: Learning how to communicate between the extension host and webview panels using the `postMessage` API and message listeners.

3. **OAuth Integration**: Implementing a browser-based OAuth flow with a local HTTP server to handle callbacks, including proper token storage and validation.

4. **Secret Storage**: Using VS Code's `context.secrets` API for secure storage of sensitive data like access tokens.

5. **Markdown and Syntax Highlighting**: Integrating Marked.js for markdown parsing and Highlight.js for code syntax highlighting in the webview.

6. **Extension Packaging**: Understanding the `.vscodeignore` file, packaging with `vsce`, and the extension manifest configuration in `package.json`.

7. **TypeScript Configuration**: Dealing with TypeScript compilation issues in the extension context, including module resolution and type definitions.

## Publishing to VS Code Marketplace

To publish the extension to the VS Code Marketplace:

1. Create a publisher account at [marketplace.visualstudio.com](https://marketplace.visualstudio.com)
2. Get your publisher ID
3. Update `package.json` with your publisher name:
   ```json
   {
     "publisher": "your-publisher-name"
   }
   ```
4. Login to vsce:
   ```bash
   vsce login your-publisher-name
   ```
5. Publish:
   ```bash
   vsce publish
   ```

## Troubleshooting

### Extension Not Activating

If the extension doesn't activate:

1. Check the VS Code developer console (Help > Toggle Developer Tools)
2. Look for errors in the console
3. Verify the extension is properly installed
4. Check that `package.json` has correct activation events

### Authentication Not Working

If authentication fails:

1. Verify the `FRONTEND_URL` and `BACKEND_URL` in `.env`
2. Check that the local auth server is running (port 34215)
3. Ensure the browser opens the correct auth URL
4. Check the callback port matches what's configured

### Webview Not Loading

If the webview doesn't load:

1. Check that the HTML file path is correct
2. Verify CSS and script files are compiled
3. Check the webview URI conversion logic
4. Look for CSP (Content Security Policy) errors

### Build Errors

If you encounter TypeScript compilation errors:

```bash
# Clean and rebuild
rm -rf out
npm run compile
```

### Token Storage Issues

If tokens aren't being stored or retrieved:

1. Verify the secret storage API is being used correctly
2. Check that the context is passed to functions that need it
3. Use the "Delete Access Token" command to reset and test again

## License

ISC

## Author

NKUNDABAGENZI Jeremie