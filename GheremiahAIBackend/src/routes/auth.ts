import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { hashPassword, comparePasswords } from '../utils/crypto';
import { generateTokens } from '../utils/jwt';
import { HttpException } from '../middleware/error-handler';
import { authRateLimiter } from '../middleware/rate-limit';
import { ErrorCode } from '@gheremiah-ai/shared';

const router: Router = Router();

const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

router.post('/register', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = registerSchema.parse(req.body);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new HttpException(409, ErrorCode.VALIDATION_ERROR, 'Email already registered'));
        }

        const passwordHash = await hashPassword(password);
        const user = await User.create({
            email,
            passwordHash,
            subscriptionTier: 'free',
            isVerified: false,
        });

        const userObj = {
            id: (user._id as any).toString(),
            email: user.email,
            subscriptionTier: user.subscriptionTier,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        const { accessToken, refreshToken } = generateTokens(userObj);

        res.status(201).json({
            success: true,
            data: { accessToken, refreshToken, user: userObj },
            timestamp: new Date(),
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return next(new HttpException(400, ErrorCode.VALIDATION_ERROR, 'Invalid input', {
                errors: error.errors,
            }));
        }
        if (error instanceof HttpException) return next(error);
        return next(new HttpException(500, ErrorCode.INTERNAL_SERVER_ERROR, 'Registration failed'));
    }
});

router.post('/login', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await User.findOne({ email });
        if (!user) {
            return next(new HttpException(401, ErrorCode.UNAUTHORIZED, 'Invalid email or password'));
        }

        const isValid = await comparePasswords(password, user.passwordHash);
        if (!isValid) {
            return next(new HttpException(401, ErrorCode.UNAUTHORIZED, 'Invalid email or password'));
        }

        const userObj = {
            id: (user._id as any).toString(),
            email: user.email,
            subscriptionTier: user.subscriptionTier,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        const { accessToken, refreshToken } = generateTokens(userObj);

        res.json({
            success: true,
            data: {
                accessToken,
                refreshToken,
                user: userObj,
            },
            timestamp: new Date(),
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return next(new HttpException(400, ErrorCode.VALIDATION_ERROR, 'Invalid input', {
                errors: error.errors,
            }));
        }
        if (error instanceof HttpException) return next(error);
        return next(new HttpException(500, ErrorCode.INTERNAL_SERVER_ERROR, 'Login failed'));
    }
});

export default router;
