/**
 * Gheremiah AI Chat Handler
 * Manages chat UI interactions and communication with the VS Code extension
 * Supports markdown rendering with syntax highlighting
 */

// Import marked for markdown parsing
declare const marked: any;
declare const hljs: any;
declare const DOMPurify: any;

// Type declaration for VS Code webview API
declare function acquireVsCodeApi(): {
    postMessage(message: any): void;
};

const vscode = acquireVsCodeApi();
const appContainer = document.getElementById('app-container') as HTMLElement;
let messageHistory: HTMLElement | null = null;
let userInput: HTMLInputElement | null = null;
let sendButton: HTMLButtonElement | null = null;

let isWaitingForResponse = false;
let isAuthenticated = false;

/**
 * Show signin view
 */
function showSigninView(): void {
    const template = document.getElementById('signin-view') as HTMLTemplateElement;
    const clone = template.content.cloneNode(true) as DocumentFragment;
    appContainer.innerHTML = '';
    appContainer.appendChild(clone);

    const signinButton = document.getElementById('signin-button') as HTMLButtonElement;
    signinButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'openSignin' });
    });

    const refreshAuthButton = document.getElementById('refresh-auth-button') as HTMLButtonElement;
    refreshAuthButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'checkAuth' });
    });
}

/**
 * Show chat view
 */
function showChatView(): void {
    const template = document.getElementById('chat-view') as HTMLTemplateElement;
    const clone = template.content.cloneNode(true) as DocumentFragment;
    appContainer.innerHTML = '';
    appContainer.appendChild(clone);

    // Get references to chat elements
    messageHistory = document.getElementById('message-history') as HTMLElement;
    userInput = document.getElementById('user-input') as HTMLInputElement;
    sendButton = document.getElementById('send-button') as HTMLButtonElement;

    // Set up chat event listeners
    setupChatListeners();
}

/**
 * Configure marked for proper markdown rendering
 */
function configureMarked(): void {
    if (typeof marked === 'undefined') return;

    marked.setOptions({
        breaks: true,
        gfm: true,
        pedantic: false,
    });

    // Override code renderer to include syntax highlighting
    const renderer = new marked.Renderer();
    const originalCodeRenderer = renderer.code.bind(renderer);
    
    renderer.code = function (code: string, language: string) {
        let highlighted = code;
        if (language && typeof hljs !== 'undefined' && hljs.getLanguage(language)) {
            try {
                highlighted = hljs.highlight(code, { language }).value;
            } catch (error) {
                console.error('Highlight error:', error);
                highlighted = escapeHtml(code);
            }
        } else {
            highlighted = escapeHtml(code);
        }
        return `<pre><code class="hljs language-${language || 'plaintext'}">${highlighted}</code></pre>`;
    };

    marked.setOptions({ renderer });
}

/**
 * Parse markdown and render HTML
 */
function parseMarkdown(text: string): string {
    if (typeof marked === 'undefined') {
        // Fallback if marked is not loaded
        return escapeHtml(text);
    }

    try {
        const html = marked.parse(text);
        // Sanitize HTML to prevent XSS attacks
        return typeof DOMPurify !== 'undefined' 
            ? DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'hr'], ALLOWED_ATTR: ['class', 'href', 'target', 'rel'] })
            : html;
    } catch (error) {
        console.error('Markdown parsing error:', error);
        return escapeHtml(text);
    }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Add a message to the chat history
 */
function addMessage(
    text: string,
    sender: 'user' | 'bot',
    timestamp: Date = new Date()
): void {
    if (!messageHistory) return;

    const template = sender === 'user'
        ? document.getElementById('user-message-template') as HTMLTemplateElement
        : document.getElementById('bot-message-template') as HTMLTemplateElement;

    const clone = template.content.cloneNode(true) as DocumentFragment;
    const messageText = clone.querySelector('.message-text') as HTMLElement;
    const timeSpan = clone.querySelector('.text-xs') as HTMLElement;

    if (sender === 'bot') {
        // Parse markdown and render as HTML
        const markdownHtml = parseMarkdown(text);
        messageText.classList.add('markdown-content');
        messageText.innerHTML = markdownHtml;
    } else {
        // User messages are plain text
        messageText.textContent = text;
    }

    timeSpan.textContent = timestamp.toLocaleTimeString();
    messageHistory.appendChild(clone);
    messageHistory.scrollTop = messageHistory.scrollHeight;
}

/**
 * Show typing indicator while waiting for bot response
 */
function showTypingIndicator(): void {
    if (!messageHistory) return;
    const template = document.getElementById('typing-indicator') as HTMLTemplateElement;
    const clone = template.content.cloneNode(true) as DocumentFragment;
    (clone.firstElementChild as HTMLElement).id = 'typing-indicator';
    messageHistory.appendChild(clone);
    messageHistory.scrollTop = messageHistory.scrollHeight;
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator(): void {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Send message to the extension
 */
async function sendMessage(): Promise<void> {
    if (isWaitingForResponse || !userInput || !sendButton) return;

    const text = userInput.value.trim();
    if (!text) return;

    // Disable input while processing
    isWaitingForResponse = true;
    sendButton.disabled = true;
    userInput.disabled = true;

    // Add user message
    addMessage(text, 'user');
    userInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    // Send to extension
    vscode.postMessage({ command: 'askGemini', text: text });
}

/**
 * Set up chat event listeners
 */
function setupChatListeners(): void {
    if (!sendButton || !userInput) return;

    // Set up event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize input
    userInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });

    // Focus input on load
    userInput.focus();
}

/**
 * Initialize the chat
 */
function initializeChat(): void {
    // Configure marked for markdown rendering
    configureMarked();

    // Listen for messages from extension
    window.addEventListener('message', (event: MessageEvent) => {
        const message = event.data;
        if (message.command === 'authState') {
            isAuthenticated = message.isAuthenticated;
            if (isAuthenticated) {
                showChatView();
            } else {
                showSigninView();
            }
        } else if (message.command === 'gheremiahResponse') {
            removeTypingIndicator();
            addMessage(message.text, 'bot');

            // Re-enable input
            isWaitingForResponse = false;
            if (sendButton) sendButton.disabled = false;
            if (userInput) {
                userInput.disabled = false;
                userInput.focus();
            }
        }
    });

    // Request initial auth state
    vscode.postMessage({ command: 'checkAuth' });
}

// Initialize chat when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeChat);
} else {
    initializeChat();
}
