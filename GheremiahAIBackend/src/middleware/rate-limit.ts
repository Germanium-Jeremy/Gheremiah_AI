import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Store for rate limit tracking (use Redis in production)
interface RateLimitStore {
    [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

const getRateLimitKey = (req: Request): string => {
    return req.user?.userId || req.ip || 'unknown';
};

// Get rate limit based on subscription tier
const getRateLimit = (tier: 'free' | 'pro' | 'enterprise'): number => {
    const limits = {
        free: 10, // 10 requests per minute
        pro: 60, // 60 requests per minute
        enterprise: 1000, // 1000 requests per minute
    };
    return limits[tier];
};

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
    const key = getRateLimitKey(req);
    const now = Date.now();
    const tier = req.user?.user.subscriptionTier || 'free';
    const limit = getRateLimit(tier);

    // Initialize or reset the counter
    if (!store[key] || store[key].resetTime < now) {
        store[key] = {
            count: 1,
            resetTime: now + 60 * 1000, // 1 minute
        };
        next();
        return;
    }

    // Increment counter
    store[key].count++;

    if (store[key].count > limit) {
        res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: `Rate limit exceeded. Max ${limit} requests per minute for ${tier} tier`,
                details: {
                    limit,
                    current: store[key].count,
                    resetTime: new Date(store[key].resetTime),
                },
            },
            timestamp: new Date(),
        });
        return;
    }

    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', (limit - store[key].count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());

    next();
};

// Express rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});
