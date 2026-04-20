import { Request, Response, NextFunction } from 'express';
import type { ApiErrorResponse, ErrorCode } from '@gheremiah-ai/shared';
import { logger } from '../utils/logger';

export class HttpException extends Error {
    constructor(
        public statusCode: number,
        public code: ErrorCode,
        message: string,
        public details?: Record<string, any>
    ) {
        super(message);
        this.name = 'HttpException';
    }
}

export const errorHandler = (err: Error | HttpException, req: Request, res: Response, next: NextFunction): void => {
    // Log error to JSON file
    logger.logError(err, req);

    if (err instanceof HttpException) {
        const response: ApiErrorResponse = {
            success: false,
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
            },
            timestamp: new Date(),
        };
        res.status(err.statusCode).json(response);
    } else {
        const response: ApiErrorResponse = {
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: process.env.NODE_ENV === 'production' 
                    ? 'Internal server error'
                    : err.message,
            },
            timestamp: new Date(),
        };
        res.status(500).json(response);
    }
};
