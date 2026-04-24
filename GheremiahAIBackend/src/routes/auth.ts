import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { hashPassword, comparePasswords } from '../utils/crypto';
import { generateTokens } from '../utils/jwt';
import { HttpException } from '../middleware/error-handler';
import { authRateLimiter } from '../middleware/rate-limit';

const router = Router();

const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

router.post('/register', authRateLimiter, async (req: Request, res: Response) => {
    try {
        const { email, password } = registerSchema.parse(req.body);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new HttpException(409, 'VALIDATION_ERROR', 'Email already registered');
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
            throw new HttpException(400, 'VALIDATION_ERROR', 'Invalid input', {
                errors: error.errors,
            });
        }
        if (error instanceof HttpException) throw error;
        throw new HttpException(500, 'INTERNAL_SERVER_ERROR', 'Registration failed');
    }
});

router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await User.findOne({ email });
        if (!user) {
            throw new HttpException(401, 'UNAUTHORIZED', 'Invalid email or password');
        }

        const isValid = await comparePasswords(password, user.passwordHash);
        if (!isValid) {
            throw new HttpException(401, 'UNAUTHORIZED', 'Invalid email or password');
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
            throw new HttpException(400, 'VALIDATION_ERROR', 'Invalid input', {
                errors: error.errors,
            });
        }
        if (error instanceof HttpException) throw error;
        throw new HttpException(500, 'INTERNAL_SERVER_ERROR', 'Login failed');
    }
});

export default router;
