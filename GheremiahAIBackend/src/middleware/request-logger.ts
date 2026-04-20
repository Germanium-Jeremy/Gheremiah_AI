import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const originalSend = res.send;
    
    res.send = function (data: any) {
        logger.logAccess(req, res, res.statusCode);
        return originalSend.call(this, data);
    };
    
    next();
};
