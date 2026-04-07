import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { HttpException } from '../middleware/error-handler';
import { logger } from '../utils/logger';
import { ErrorCode } from '@gheremiah-ai/shared';
import { SystemConfig } from '../models';

const router: Router = Router();

// Middleware to ensure user is admin
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.user.role !== 'admin') {
        return next(new HttpException(403, ErrorCode.FORBIDDEN, 'Admin access required'));
    }
    next();
};

// GET /api/admin/config - Retrieve current system settings
router.get('/config', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        let config = await SystemConfig.findOne();
        if (!config) {
            config = await SystemConfig.create({ activeProvider: 'gemini' });
        }

        res.json({
            success: true,
            data: config,
            timestamp: new Date(),
        });
    } catch (error) {
        return next(new HttpException(500, ErrorCode.INTERNAL_SERVER_ERROR, 'Failed to retrieve system config'));
    }
});

// PATCH /api/admin/config - Update system settings
router.patch('/config', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { activeProvider } = req.body;
        if (!activeProvider || !['gemini', 'ollama'].includes(activeProvider)) {
            return next(new HttpException(400, ErrorCode.VALIDATION_ERROR, 'Invalid activeProvider. Must be gemini or ollama'));
        }

        let config = await SystemConfig.findOne();
        if (!config) {
            config = new SystemConfig({ activeProvider });
        } else {
            config.activeProvider = activeProvider;
            config.updatedAt = new Date();
        }

        await config.save();

        res.json({
            success: true,
            data: config,
            timestamp: new Date(),
        });
    } catch (error) {
        return next(new HttpException(500, ErrorCode.INTERNAL_SERVER_ERROR, 'Failed to update system config'));
    }
});

// GET /api/admin/logs - Get all logs
router.get('/logs', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const type = req.query.type as 'error' | 'access' | 'info' | undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

        let logs;
        if (type) {
            logs = logger.getLogsByType(type, limit).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } else {
            logs = logger.getLogs(limit).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }

        res.json({
            success: true,
            data: logs,
            timestamp: new Date(),
        });
    } catch (error) {
        return next(new HttpException(500, ErrorCode.INTERNAL_SERVER_ERROR, 'Failed to retrieve logs'));
    }
});

// DELETE /api/admin/logs - Clear all logs
router.delete('/logs', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.clearLogs();

        res.json({
            success: true,
            data: { message: 'Logs cleared successfully' },
            timestamp: new Date(),
        });
    } catch (error) {
        return next(new HttpException(500, ErrorCode.INTERNAL_SERVER_ERROR, 'Failed to clear logs'));
    }
});

export default router;
