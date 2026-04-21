import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import * as dotenv from 'dotenv';

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

export function activate(context: vscode.ExtensionContext) {
    console.log('Gheremiah AI extension is now active!');
    
    // Initialize API key and URL
    GEMINI_API_KEY = getApiKey(context);
    GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // Check if API key is configured
    if (!GEMINI_API_KEY) {
        vscode.window.showErrorMessage(
            'Gheremiah AI: API key not configured. Please set GEMINI_API_KEY in .env file or configure it in settings.'
        );
        return;
    }

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

        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'askGemini') {
                const userPrompt = message.text;
                vscode.window.showInformationMessage(`🤔 Asking Gheremiah AfffdI...`);

                try {
                    const response = await axios.post(GEMINI_API_URL, {
                        contents: [{
                            parts: [{ text: userPrompt }]
                        }]
                    });

                    const geminiReply = response.data.candidates[0].content.parts[0].text;
                    panel.webview.postMessage({ command: 'gheremiahResponse', text: geminiReply });

                } catch (error) {
                    console.error('API Error:', error);
                    let errorMessage = 'Sorry, I encountered an error. ';
                    
                    if (axios.isAxiosError(error) && error.response) {
                        const { status } = error.response;
                        const apiErrorMessage = (error.response.data.error as any)?.message;
                        
                        if (status === 429) {
                            errorMessage += 'Rate limit exceeded. Please try again in a moment.';
                        } else if (status === 403) {
                            errorMessage += 'Invalid API key. Please check your configuration.';
                        } else if (status === 503) {
                            // Handle 503 Service Unavailable with API's specific message
                            if (apiErrorMessage) {
                                errorMessage = apiErrorMessage;
                            } else {
                                errorMessage += 'The Gemini API is currently unavailable. Please try again later.';
                            }
                        } else if (apiErrorMessage) {
                            // Use API's error message if available for other errors
                            errorMessage = apiErrorMessage;
                        } else {
                            errorMessage += `API Error (${status}). Please check your API key and try again.`;
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
}

export function deactivate() {}