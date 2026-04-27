import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ApiKey } from '../models/ApiKey';
import type { TokenPayload, AuthenticatedRequest } from '@gheremiah-ai/shared';

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedRequest;
        }
    }
}

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

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

        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-secret-key'
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

export const authenticateApiKey = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
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

        const keyRecord = await ApiKey.findOne({ key: apiKey }).populate('user', '-passwordHash');

        if (!keyRecord || !(keyRecord.user as any).isVerified) {
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

        const populatedUser = keyRecord.user as any;
        req.user = {
            userId: populatedUser._id.toString(),
            user: {
                id: populatedUser._id.toString(),
                email: populatedUser.email,
                subscriptionTier: populatedUser.subscriptionTier,
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
