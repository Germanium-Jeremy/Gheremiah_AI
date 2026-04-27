import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { verifyToken } from '../utils/jwt';
import { HttpException } from '../middleware/error-handler';
import { authRateLimiter } from '../middleware/rate-limit';
import { ErrorCode } from '@gheremiah-ai/shared';
import { v4 as uuidv4 } from 'uuid';

const router: Router = Router();

// In-memory store for auth codes (in production, use Redis or database)
const authCodes = new Map<string, {
    userId: string;
    extensionId: string;
    permissions: string[];
    expiresAt: Date;
}>();

const authTokens = new Map<string, {
    userId: string;
    extensionId: string;
    permissions: string[];
    expiresAt: Date;
}>();

const authorizeSchema = z.object({
    extensionId: z.string().min(1, 'Extension ID is required'),
    permissions: z.array(z.string()).min(1, 'At least one permission is required'),
    redirectUri: z.string().url('Invalid redirect URI'),
});

const callbackSchema = z.object({
    code: z.string().min(1, 'Authorization code is required'),
});

// POST /api/extension-auth/authorize - Initiate authorization flow
router.post('/authorize', authRateLimiter, async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new HttpException(401, ErrorCode.UNAUTHORIZED, 'No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        const payload = verifyToken(token);
        if (!payload) {
            throw new HttpException(401, ErrorCode.UNAUTHORIZED, 'Invalid token');
        }

        const { extensionId, permissions, redirectUri } = authorizeSchema.parse(req.body);

        // Generate auth code
        const code = uuidv4();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        authCodes.set(code, {
            userId: payload.userId,
            extensionId,
            permissions,
            expiresAt,
        });

        // Return authorization URL
        const authUrl = `${redirectUri}?code=${code}&state=${payload.userId}`;

        res.json({
            success: true,
            data: {
                authUrl,
                code,
                expiresAt,
            },
            timestamp: new Date(),
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new HttpException(400, ErrorCode.VALIDATION_ERROR, 'Invalid input', {
                errors: error.errors,
            });
        }
        if (error instanceof HttpException) throw error;
        throw new HttpException(500, ErrorCode.INTERNAL_SERVER_ERROR, 'Authorization failed');
    }
});

// POST /api/extension-auth/callback - Exchange auth code for access token
router.post('/callback', async (req: Request, res: Response) => {
    try {
        const { code } = callbackSchema.parse(req.body);

        const authData = authCodes.get(code);
        if (!authData) {
            throw new HttpException(400, ErrorCode.VALIDATION_ERROR, 'Invalid or expired authorization code');
        }

        if (new Date() > authData.expiresAt) {
            authCodes.delete(code);
            throw new HttpException(400, ErrorCode.VALIDATION_ERROR, 'Authorization code has expired');
        }

        // Generate access token
        const accessToken = uuidv4();
        const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

        authTokens.set(accessToken, {
            userId: authData.userId,
            extensionId: authData.extensionId,
            permissions: authData.permissions,
            expiresAt,
        });

        // Remove used auth code
        authCodes.delete(code);

        res.json({
            success: true,
            data: {
                accessToken,
                expiresAt,
                permissions: authData.permissions,
            },
            timestamp: new Date(),
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new HttpException(400, ErrorCode.VALIDATION_ERROR, 'Invalid input', {
                errors: error.errors,
            });
        }
        if (error instanceof HttpException) throw error;
        throw new HttpException(500, ErrorCode.INTERNAL_SERVER_ERROR, 'Callback failed');
    }
});

// GET /api/extension-auth/verify - Verify access token
router.get('/verify', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new HttpException(401, ErrorCode.UNAUTHORIZED, 'No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        const tokenData = authTokens.get(token);

        if (!tokenData) {
            throw new HttpException(401, ErrorCode.UNAUTHORIZED, 'Invalid access token');
        }

        if (new Date() > tokenData.expiresAt) {
            authTokens.delete(token);
            throw new HttpException(401, ErrorCode.UNAUTHORIZED, 'Access token has expired');
        }

        const user = await User.findById(tokenData.userId);
        if (!user) {
            throw new HttpException(404, ErrorCode.NOT_FOUND, 'User not found');
        }

        res.json({
            success: true,
            data: {
                userId: tokenData.userId,
                extensionId: tokenData.extensionId,
                permissions: tokenData.permissions,
                email: user.email,
                subscriptionTier: user.subscriptionTier,
            },
            timestamp: new Date(),
        });
    } catch (error) {
        if (error instanceof HttpException) throw error;
        throw new HttpException(500, ErrorCode.INTERNAL_SERVER_ERROR, 'Verification failed');
    }
});

// POST /api/extension-auth/revoke - Revoke access token
router.post('/revoke', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new HttpException(401, ErrorCode.UNAUTHORIZED, 'No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        authTokens.delete(token);

        res.json({
            success: true,
            data: { message: 'Access token revoked' },
            timestamp: new Date(),
        });
    } catch (error) {
        if (error instanceof HttpException) throw error;
        throw new HttpException(500, ErrorCode.INTERNAL_SERVER_ERROR, 'Revoke failed');
    }
});

export default router;
