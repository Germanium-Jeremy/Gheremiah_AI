import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as http from 'http';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });


// Get API key from environment variables or configuration
const getApiKey = (context: vscode.ExtensionContext): string => {
    // 1. First priority: environment variable from .env
    if (process.env.GEMINI_API_KEY) {
        return process.env.GEMINI_API_KEY;
    }
    
    // 2. Second priority: VS Code settings
    const config = vscode.workspace.getConfiguration('gheremiahaiextension');
    const configApiKey = config.get<string>('gemini.apiKey');
    if (configApiKey) {
        return configApiKey;
    }
    
    // 3. Fallback: return empty (will show error to user)
    return '';
};

let GEMINI_API_KEY = '';
let GEMINI_API_URL = '';
let ACCESS_TOKEN = '';
const BACKEND_API_URL = process.env.BACKEND_URL;
let localServer: http.Server | null = null;
let authCallbackPort = 0;

async function deleteOldToken(context: vscode.ExtensionContext): Promise<void> {
    await context.secrets.delete('accessToken');
    ACCESS_TOKEN = '';
    console.log('Access token deleted');
}

// Start local server to receive auth callback
async function startAuthCallbackServer(context: vscode.ExtensionContext): Promise<number> {
    if (localServer) {
        return authCallbackPort;
    }

    const server = http.createServer((req, res) => {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Parse URL to handle query parameters
        const url = new URL(req.url || '', `http://localhost:${authCallbackPort}`);
        const { pathname } = url;

        if (req.method === 'GET' && pathname === '/callback') {
            const token = url.searchParams.get('token');
            console.log("OAuth callback token: ", token, url.toString());

            if (token) {
                // Store the token
                context.secrets.store('accessToken', token);
                ACCESS_TOKEN = token;
                console.log('Token received and stored successfully');

                // Send success response
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <body>
                            <h1>Authentication Successful!</h1>
                            <p>You can close this window and return to VS Code.</p>
                            <script>
                                setTimeout(() => window.close(), 2000);
                            </script>
                        </body>
                    </html>
                `);

                // Notify webview if open
                vscode.commands.executeCommand('gheremiahai.checkAuth');
            } else {
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.end('<html><body><h1>Error: No token received</h1></body></html>');
            }
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
    });

    // Find an available port
    const startServer = (port: number): Promise<number> => {
        return new Promise((resolve, reject) => {
            server.listen(port, () => {
                console.log(`Auth callback server listening on port ${port}`);
                resolve(port);
            });
            server.on('error', (err: any) => {
                if (err.code === 'EADDRINUSE') {
                    server.close();
                    startServer(port + 1).then(resolve).catch(reject);
                } else {
                    reject(err);
                }
            });
        });
    };

    localServer = server;
    authCallbackPort = await startServer(34215); // Start from port 34215
    return authCallbackPort;
}

// Stop local server
function stopAuthCallbackServer(): void {
    if (localServer) {
        localServer.close();
        localServer = null;
        console.log('Auth callback server stopped');
    }
}

// Check if user is authenticated
async function checkAuthentication(context: vscode.ExtensionContext): Promise<void> {
    // vscode.commands.executeCommand('gheremiahai.deleteAccessToken');

    try {
        const token = await context.secrets.get('accessToken');
        if (!token) {
            ACCESS_TOKEN = '';
        } else {
            ACCESS_TOKEN = token;
        }
        console.log('Checking authentication, retrieved token from secrets: ', token);
        console.log('Authentication check:', ACCESS_TOKEN ? 'Authenticated' : 'Not authenticated', ACCESS_TOKEN, token);
    } catch (error) {
        console.error('Error checking authentication:', error);
        ACCESS_TOKEN = '';
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Gheremiah AI extension is now active!');
    
    // Start local server for auth callback
    startAuthCallbackServer(context).then(port => {
        console.log(`Auth callback server started on port ${port}`);
    }).catch(err => {
        console.error('Failed to start auth callback server:', err);
    });

    // Initialize API key and URL
    GEMINI_API_KEY = getApiKey(context);
    GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // Check if user is authenticated
    checkAuthentication(context);

    // Register command to manually set access token
    const setTokenCommand = vscode.commands.registerCommand('gheremiahai.setAccessToken', async () => {
        const token = await vscode.window.showInputBox({
            prompt: 'Enter your Gheremiah AI access token',
            password: true,
        });

        if (token) {
            await context.secrets.store('accessToken', token);
            ACCESS_TOKEN = token;
            vscode.window.showInformationMessage('Access token saved successfully!');
        }
    });

    // Register command to check authentication (called by local server)
    const checkAuthCommand = vscode.commands.registerCommand('gheremiahai.checkAuth', async () => {
        await checkAuthentication(context);
        vscode.window.showInformationMessage('Authentication successful! You can now use the chat.');
    });

    // Register command to delete access token (for testing)
    const deleteTokenCommand = vscode.commands.registerCommand('gheremiahai.deleteAccessToken', async () => {
        deleteOldToken(context);
        vscode.window.showInformationMessage('Access token deleted. You will need to sign in again.');
    });

    const disposable = vscode.commands.registerCommand('gheremiahai.start', () => {
        const panel = vscode.window.createWebviewPanel(
            'gheremiahai',
            'Gheremiah AI Assistant',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'src')),
                    vscode.Uri.file(path.join(context.extensionPath, 'out'))
                ]
            }
        );

        // Get the path to your HTML file
        const htmlPath = path.join(context.extensionPath, 'src', 'index.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        // Convert CSS file path to webview URI
        const cssPath = path.join(context.extensionPath, 'src', 'output.css');
        const cssUri = panel.webview.asWebviewUri(vscode.Uri.file(cssPath));

        const packageCssPath = path.join(context.extensionPath, 'out', 'src', 'styles.packages', 'style.css');
        const packageCssUri = panel.webview.asWebviewUri(vscode.Uri.file(packageCssPath));

        htmlContent = htmlContent.replace(
            'href="./output.css"',
            `href="${cssUri.toString()}"`
        ).replace(
            'href="package-style.css"',
            `href="${packageCssUri.toString()}"`
        );
        
        // Convert script file path to webview URI
        const scriptPath = path.join(context.extensionPath, 'out', 'src', 'scripts', 'chat.js');
        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(scriptPath));

        const markedPath = path.join(context.extensionPath, 'out', 'src', 'scripts', 'markdown.package.js');
        const markedUri = panel.webview.asWebviewUri(vscode.Uri.file(markedPath));

        const highlightPath = path.join(context.extensionPath, 'out', 'src', 'scripts', 'highlight.package.js');
        const highlightUri = panel.webview.asWebviewUri(vscode.Uri.file(highlightPath));

        const purifyPath = path.join(context.extensionPath, 'out', 'src', 'scripts', 'purify.package.js');
        const purifyUri = panel.webview.asWebviewUri(vscode.Uri.file(purifyPath));

        htmlContent = htmlContent.replace(
            'src="./scripts/chat.js"',
            `src="${scriptUri.toString()}"`
        ).replace(
            'src="marked"',
            `src="${markedUri.toString()}"`
        ).replace(
            'src="highlight"',
            `src="${highlightUri.toString()}"`
        ).replace(
            'src="purify"',
            `src="${purifyUri.toString()}"`
        );

        panel.webview.html = htmlContent;

        // Send authentication state to webview
        panel.webview.postMessage({ command: 'authState', isAuthenticated: !!ACCESS_TOKEN });

        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'openSignin') {
                // Open browser to extension authorization page with callback port
                const authUrl = `${process.env.FRONTEND_URL}/extension-auth?vscode=true&callbackPort=${authCallbackPort}`;
                vscode.env.openExternal(vscode.Uri.parse(authUrl));
            } else if (message.command === 'checkAuth') {
                // Re-check authentication and send state
                await checkAuthentication(context);
                panel.webview.postMessage({ command: 'authState', isAuthenticated: !!ACCESS_TOKEN });
            } else if (message.command === 'askGemini') {
                // Check if user is authenticated
                if (!ACCESS_TOKEN) {
                    panel.webview.postMessage({ command: 'gheremiahResponse', text: 'Please sign in to Gheremiah AI to use the chat feature.' });
                    return;
                }

                const userPrompt = message.text;
                vscode.window.showInformationMessage(`🤔 Asking Gheremiah AI...`);

                try {
                    const response = await axios.post(`${BACKEND_API_URL}/api/chat`, {
                        messages: [{ role: 'user', content: userPrompt }],
                        model: 'gemini-2.5-flash',
                    }, {
                        headers: {
                            'Authorization': `Bearer ${ACCESS_TOKEN}`,
                        },
                    });

                    if (response.data.success) {
                        const reply = response.data.data.content;
                        panel.webview.postMessage({ command: 'gheremiahResponse', text: reply });
                    } else {
                        panel.webview.postMessage({ command: 'gheremiahResponse', text: `Error: ${response.data.error?.message || 'Failed to get response'}` });
                    }

                } catch (error) {
                    console.error('API Error:', error);
                    let errorMessage = 'Sorry, I encountered an error. ';
                    
                    if (axios.isAxiosError(error) && error.response) {
                        const { status } = error.response;
                        const apiErrorMessage = (error.response.data.error as any)?.message;
                        
                        if (status === 401) {
                            errorMessage = 'Authentication failed. Please sign in again.';
                        } else if (status === 429) {
                            errorMessage += 'Rate limit exceeded. Please try again in a moment.';
                        } else if (status === 503) {
                            if (apiErrorMessage) {
                                errorMessage = apiErrorMessage;
                            } else {
                                errorMessage += 'The service is currently unavailable. Please try again later.';
                            }
                        } else if (apiErrorMessage) {
                            errorMessage = apiErrorMessage;
                        } else {
                            errorMessage += `API Error (${status}). Please try again.`;
                        }
                    } else {
                        errorMessage += 'Please check your connection and try again.';
                    }
                    
                    panel.webview.postMessage({ command: 'gheremiahResponse', text: errorMessage });
                    console.warn("Gheremiah AI: API request failed. Check console for details.", error);
                }
            }
        });
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(setTokenCommand);
    context.subscriptions.push(checkAuthCommand);
    context.subscriptions.push(deleteTokenCommand);
}

export function deactivate() {
    stopAuthCallbackServer();
}