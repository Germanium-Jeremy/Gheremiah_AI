import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiKey } from '../models/ApiKey';
import { authenticate } from '../middleware/auth';
import { generateApiKey } from '@gheremiah-ai/shared';
import { HttpException } from '../middleware/error-handler';
import { ErrorCode } from '@gheremiah-ai/shared';

const router: Router = Router();

const createKeySchema = z.object({
    name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
});

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return next(new HttpException(401, ErrorCode.UNAUTHORIZED, 'Not authenticated'));
        }

        const keys = await ApiKey.find({ userId }).select('name lastUsedAt createdAt');

        res.json({
            success: true,
            data: keys.map(k => ({
                id: (k._id as any).toString(),
                name: k.name,
                lastUsedAt: k.lastUsedAt,
                createdAt: k.createdAt,
            })),
            timestamp: new Date(),
        });
    } catch (error) {
        if (error instanceof HttpException) return next(error);
        return next(new HttpException(500, ErrorCode.INTERNAL_SERVER_ERROR, 'Failed to list API keys'));
    }
});

router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name } = createKeySchema.parse(req.body);
        const userId = req.user?.userId;
        if (!userId) {
            return next(new HttpException(401, ErrorCode.UNAUTHORIZED, 'Not authenticated'));
        }

        const key = generateApiKey();
        const apiKey = await ApiKey.create({ key, name, userId });

        res.status(201).json({
            success: true,
            data: {
                id: (apiKey._id as any).toString(),
                name: apiKey.name,
                key: apiKey.key,
                createdAt: apiKey.createdAt,
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
        return next(new HttpException(500, ErrorCode.INTERNAL_SERVER_ERROR, 'Failed to create API key'));
    }
});

router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) {
            return next(new HttpException(401, ErrorCode.UNAUTHORIZED, 'Not authenticated'));
        }

        const existing = await ApiKey.findOne({ _id: id, userId });

        if (!existing) {
            return next(new HttpException(404, ErrorCode.NOT_FOUND, 'API key not found'));
        }

        await ApiKey.findByIdAndDelete(id);

        res.json({
            success: true,
            data: { message: 'API key deleted' },
            timestamp: new Date(),
        });
    } catch (error) {
        if (error instanceof HttpException) return next(error);
        return next(new HttpException(500, ErrorCode.INTERNAL_SERVER_ERROR, 'Failed to delete API key'));
    }
});

export default router;
