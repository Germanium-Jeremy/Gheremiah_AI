// ============================================
// SHARED TYPES FOR GHEREMIAH AI
// ============================================

// ============ MODELS ============
export type AvailableModel = 'gemini-2.5-flash' | 'gemini-2.0-pro';
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type MessageRole = 'user' | 'assistant' | 'system';
export type UsageAction = 'chat' | 'code_analysis' | 'debugging' | 'image_generation';

// ============ USER & AUTH ============
export interface User {
    id: string;
    email: string;
    passwordHash: string;
    subscriptionTier: SubscriptionTier;
    role: 'user' | 'admin';
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ApiKey {
    id: string;
    key: string;
    name: string;
    userId: string;
    lastUsedAt?: Date;
    createdAt: Date;
}

export interface AuthRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: Omit<User, 'passwordHash'>;
}

export interface TokenPayload {
    userId: string;
    email: string;
    subscriptionTier: SubscriptionTier;
    iat?: number;
    exp?: number;
}

// ============ CHAT MESSAGES ============
export interface ChatMessage {
    role: MessageRole;
    content: string;
    timestamp?: Date;
}

export interface ChatRequest {
    messages: ChatMessage[];
    stream?: boolean;
    model?: AvailableModel;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
}

export interface ChatResponse {
    id: string;
    content: string;
    model: AvailableModel;
    timestamp: Date;
    usage?: TokenUsage;
}

export interface StreamChunk {
    type: 'content' | 'usage' | 'error';
    content?: string;
    usage?: TokenUsage;
    error?: string;
}

// ============ TOKEN USAGE ============
export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface UsageLog {
    id: string;
    userId: string;
    action: UsageAction;
    tokensUsed: number;
    timestamp: Date;
    metadata?: Record<string, any>;
}

// ============ API RESPONSES ============
export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    timestamp: Date;
}

export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, any>;
    };
    timestamp: Date;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============ ERROR TYPES ============
export enum ErrorCode {
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    INVALID_API_KEY = 'INVALID_API_KEY',
    INSUFFICIENT_QUOTA = 'INSUFFICIENT_QUOTA',
    MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
}

export interface ApiError {
    code: ErrorCode;
    message: string;
    details?: Record<string, any>;
    statusCode: number;
}

// ============ VALIDATION ============
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}

// ============ REQUEST CONTEXTS ============
export interface AuthenticatedRequest {
    userId: string;
    user: Omit<User, 'passwordHash'>;
    apiKey?: ApiKey;
}

// ============ INTEGRATION TYPES ============
export interface SlackMessage {
    userId: string;
    channelId: string;
    text: string;
    timestamp: string;
}

export interface VsCodeMessage {
    type: 'chat' | 'analysis' | 'debug';
    content: string;
    context?: {
        language?: string;
        code?: string;
        filename?: string;
    };
}

export interface WebSocketMessage {
    type: 'chat' | 'ping' | 'pong' | 'error';
    data: any;
    requestId?: string;
}

// ============ EXTENSION AUTHORIZATION ============
export interface ExtensionAuthRequest {
    userId: string;
    extensionId: string;
    permissions: string[];
}

export interface ExtensionAuthResponse {
    success: boolean;
    authCode?: string;
    error?: string;
}

export interface ExtensionAuthCallback {
    code: string;
    state?: string;
}

export interface ExtensionAuthToken {
    id: string;
    userId: string;
    extensionId: string;
    token: string;
    permissions: string[];
    expiresAt: Date;
    createdAt: Date;
}