// ============================================
// SHARED UTILITIES FOR GHEREMIAH AI
// ============================================

import type { ValidationError, ChatMessage } from '../types/index';

// ============ VALIDATION HELPERS ============

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
    // At least 8 chars, 1 uppercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

export function validateApiKey(key: string): boolean {
    return key.length > 20 && key.length < 500;
}

export function validateChatMessages(messages: ChatMessage[]): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!Array.isArray(messages) || messages.length === 0) {
        errors.push({
            field: 'messages',
            message: 'Messages array must not be empty',
            value: messages,
        });
        return errors;
    }

    messages.forEach((msg, index) => {
        if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
            errors.push({
                field: `messages[${index}].role`,
                message: 'Invalid message role',
                value: msg.role,
            });
        }

        if (!msg.content || typeof msg.content !== 'string' || msg.content.trim().length === 0) {
            errors.push({
                field: `messages[${index}].content`,
                message: 'Message content must be a non-empty string',
                value: msg.content,
            });
        }
    });

    return errors;
}

// ============ STRING HELPERS ============

export function formatCodeBlock(code: string, language?: string): string {
    return `\`\`\`${language || 'javascript'}\n${code}\n\`\`\``;
}

export function truncateText(text: string, maxLength: number = 1000): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

export function generateApiKey(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'gai_';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

// ============ TIME HELPERS ============

export function getTokenLimitForTier(tier: 'free' | 'pro' | 'enterprise'): number {
    const limits = {
        free: 2000,
        pro: 8000,
        enterprise: 32000,
    };
    return limits[tier];
}

export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    }).format(date);
}

// ============ SAFE PARSING ============

export function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        return JSON.parse(json) as T;
    } catch {
        return fallback;
    }
}

export function safeJsonStringify(obj: any, fallback: string = '{}'): string {
    try {
        return JSON.stringify(obj);
    } catch {
        return fallback;
    }
}