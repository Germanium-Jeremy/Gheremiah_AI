import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, type IUserDocument } from '../models/User';
import { ApiKey } from '../models/ApiKey';
import type { TokenPayload, AuthenticatedRequest } from '@gheremiah-ai/shared';

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedRequest;
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Check cookies first, then fallback to Authorization header
        const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'No authentication token provided',
                },
                timestamp: new Date(),
            });
            return;
        }

        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const payload = jwt.verify(
            token,
            jwtSecret
        ) as TokenPayload;
        
        const user = await User.findById(payload.userId).select('-passwordHash');

        if (!user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User not found',
                },
                timestamp: new Date(),
            });
            return;
        }

        req.user = {
            userId: (user._id as any).toString(),
            user: {
                id: (user._id as any).toString(),
                email: user.email,
                subscriptionTier: user.subscriptionTier,
                role: user.role,
                isVerified: user.isVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        };

        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid or expired token',
            },
            timestamp: new Date(),
        });
    }
};

export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const apiKey = req.headers['x-api-key'] as string;

        if (!apiKey) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_API_KEY',
                    message: 'No API key provided',
                },
                timestamp: new Date(),
            });
            return;
        }

        const keyRecord = await ApiKey.findOne({ key: apiKey }).populate<{ userId: IUserDocument }>('userId', '-passwordHash');

        if (!keyRecord || !keyRecord.userId || !keyRecord.userId.isVerified) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_API_KEY',
                    message: 'Invalid API key',
                },
                timestamp: new Date(),
            });
            return;
        }

        // Update last used
        keyRecord.lastUsedAt = new Date();
        await keyRecord.save();

        const populatedUser = keyRecord.userId;
        req.user = {
            userId: populatedUser._id.toString(),
            user: {
                id: populatedUser._id.toString(),
                email: populatedUser.email,
                subscriptionTier: populatedUser.subscriptionTier,
                role: populatedUser.role,
                isVerified: populatedUser.isVerified,
                createdAt: populatedUser.createdAt,
                updatedAt: populatedUser.updatedAt,
            },
            apiKey: {
                id: (keyRecord._id as any).toString(),
                key: keyRecord.key,
                name: keyRecord.name,
                userId: populatedUser._id.toString(),
                lastUsedAt: keyRecord.lastUsedAt,
                createdAt: keyRecord.createdAt,
            },
        };

        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_API_KEY',
                message: 'API key validation failed',
            },
            timestamp: new Date(),
        });
    }
};

// Extension access token validation (in-memory for now, should use Redis/DB in production)
const extensionAuthTokens = new Map<string, {
    userId: string;
    extensionId: string;
    permissions: string[];
    expiresAt: Date;
}>();

// Export function to add extension tokens (called by extension-auth routes)
export const addExtensionToken = (token: string, data: { userId: string; extensionId: string; permissions: string[]; expiresAt: Date }) => {
    extensionAuthTokens.set(token, data);
};

export const authenticateExtensionToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'No authorization token provided',
                },
                timestamp: new Date(),
            });
            return;
        }

        const token = authHeader.replace('Bearer ', '');
        const tokenData = extensionAuthTokens.get(token);

        if (!tokenData) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_EXTENSION_TOKEN',
                    message: 'Invalid extension access token',
                },
                timestamp: new Date(),
            });
            return;
        }

        if (new Date() > tokenData.expiresAt) {
            extensionAuthTokens.delete(token);
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_EXTENSION_TOKEN',
                    message: 'Extension access token has expired',
                },
                timestamp: new Date(),
            });
            return;
        }

        const user = await User.findById(tokenData.userId).select('-passwordHash');
        if (!user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User not found',
                },
                timestamp: new Date(),
            });
            return;
        }

        req.user = {
            userId: user._id.toString(),
            user: {
                id: user._id.toString(),
                email: user.email,
                subscriptionTier: user.subscriptionTier,
                role: user.role,
                isVerified: user.isVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        };

        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_EXTENSION_TOKEN',
                message: 'Extension token validation failed',
            },
            timestamp: new Date(),
        });
    }
};

// Combined authentication: tries extension token, API key, or JWT
export const authenticateAny = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Try extension token first (Authorization: Bearer <extension-token>)
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'] as string;

    if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const tokenData = extensionAuthTokens.get(token);

        if (tokenData && new Date() <= tokenData.expiresAt) {
            const user = await User.findById(tokenData.userId).select('-passwordHash');
            if (user) {
                req.user = {
                    userId: user._id.toString(),
                    user: {
                        id: user._id.toString(),
                        email: user.email,
                        subscriptionTier: user.subscriptionTier,
                        role: user.role,
                        isVerified: user.isVerified,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt,
                    },
                };
                return next();
            }
        }
    }

    // Try API key
    if (apiKey) {
        const keyRecord = await ApiKey.findOne({ key: apiKey }).populate<{ userId: IUserDocument }>('userId', '-passwordHash');
        if (keyRecord && keyRecord.userId && keyRecord.userId.isVerified) {
            keyRecord.lastUsedAt = new Date();
            await keyRecord.save();

            const populatedUser = keyRecord.userId;
            req.user = {
                userId: populatedUser._id.toString(),
                user: {
                    id: populatedUser._id.toString(),
                    email: populatedUser.email,
                    subscriptionTier: populatedUser.subscriptionTier,
                    role: populatedUser.role,
                    isVerified: populatedUser.isVerified,
                    createdAt: populatedUser.createdAt,
                    updatedAt: populatedUser.updatedAt,
                },
                apiKey: {
                    id: (keyRecord._id as any).toString(),
                    key: keyRecord.key,
                    name: keyRecord.name,
                    userId: populatedUser._id.toString(),
                    lastUsedAt: keyRecord.lastUsedAt,
                    createdAt: keyRecord.createdAt,
                },
            };
            return next();
        }
    }

    // Try JWT
    if (authHeader) {
        try {
            const token = authHeader.replace('Bearer ', '');
            const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
            const payload = jwt.verify(token, jwtSecret) as TokenPayload;
            const user = await User.findById(payload.userId).select('-passwordHash');

            if (user) {
                req.user = {
                    userId: (user._id as any).toString(),
                    user: {
                        id: (user._id as any).toString(),
                        email: user.email,
                        subscriptionTier: user.subscriptionTier,
                        role: user.role,
                        isVerified: user.isVerified,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt,
                    },
                };
                return next();
            }
        } catch (error) {
            // JWT failed, continue to error
        }
    }

    // All authentication methods failed
    res.status(401).json({
        success: false,
        error: {
            code: 'UNAUTHORIZED',
            message: 'No valid authentication provided',
        },
        timestamp: new Date(),
    });
};
