import jwt from 'jsonwebtoken';
import type { TokenPayload, User } from '@gheremiah-ai/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || '30d';

export const generateTokens = (user: Omit<User, 'passwordHash'>) => {
    const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
    const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRE });

    return { accessToken, refreshToken };
};

export const verifyToken = (token: string): TokenPayload | null => {
    try {
        const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
        return payload;
    } catch (error) {
        return null;
    }
};

export const decodeToken = (token: string): TokenPayload | null => {
    try {
        const payload = jwt.decode(token) as TokenPayload;
        return payload;
    } catch (error) {
        return null;
    }
};
