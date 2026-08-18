import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { VerificationToken } from '../models/VerificationToken';
import { hashPassword, comparePasswords } from '../utils/crypto';
import { generateTokens } from '../utils/jwt';
import { sendVerificationEmail } from '../utils/email';
import { HttpException } from '../middleware/error-handler';
import { authRateLimiter } from '../middleware/rate-limit';
import { ErrorCode } from '@gheremiah-ai/shared';
import { v4 as uuidv4 } from 'uuid';

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
            role: 'user',
            isVerified: false,
        });

        // Generate verification token
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await VerificationToken.create({
            userId: user._id,
            token,
            expiresAt,
        });

        // Send verification email
        try {
            await sendVerificationEmail(email, token);
            console.log("EMail sent")
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Continue with registration even if email fails
        }

        console.log("Continued")
        const userObj = {
            id: (user._id as any).toString(),
            email: user.email,
            subscriptionTier: user.subscriptionTier,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        const { accessToken, refreshToken } = generateTokens(userObj);

        // Set refreshToken in httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        res.status(201).json({
            success: true,
            data: { accessToken, user: userObj },
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
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        const { accessToken, refreshToken } = generateTokens(userObj);

        // Set refreshToken in httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        res.json({
            success: true,
            data: { accessToken, user: userObj },
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

// GET /api/auth/verify-email - Verify email with token
router.get('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            return next(new HttpException(400, ErrorCode.VALIDATION_ERROR, 'Invalid verification token'));
        }

        const verificationToken = await VerificationToken.findOne({ token });

        if (!verificationToken) {
            return next(new HttpException(400, ErrorCode.VALIDATION_ERROR, 'Invalid or expired verification token'));
        }

        if (new Date() > verificationToken.expiresAt) {
            await VerificationToken.deleteOne({ token });
            return next(new HttpException(400, ErrorCode.VALIDATION_ERROR, 'Verification token has expired'));
        }

        // Find user and mark as verified
        const user = await User.findById(verificationToken.userId);
        if (!user) {
            return next(new HttpException(404, ErrorCode.NOT_FOUND, 'User not found'));
        }

        user.isVerified = true;
        await user.save();

        // Delete the verification token
        await VerificationToken.deleteOne({ token });

        // Generate tokens for the verified user
        const userObj = {
            id: (user._id as any).toString(),
            email: user.email,
            subscriptionTier: user.subscriptionTier,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        const { accessToken, refreshToken } = generateTokens(userObj);

        // Set refreshToken in httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        // Redirect to frontend with accessToken as query param
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'; // change this
        res.redirect(`${frontendUrl}/chat?verified=true&token=${accessToken}`);
    } catch (error) {
        if (error instanceof HttpException) return next(error);
        return next(new HttpException(500, ErrorCode.INTERNAL_SERVER_ERROR, 'Email verification failed'));
    }
});

// POST /api/auth/logout - Clear cookies
router.post('/logout', (req: Request, res: Response) => {
    res.clearCookie('refreshToken');
    res.json({
        success: true,
        data: { message: 'Logged out successfully' },
        timestamp: new Date(),
    });
});

export default router;
