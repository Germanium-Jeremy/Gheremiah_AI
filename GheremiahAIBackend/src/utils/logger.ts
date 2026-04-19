import fs from 'fs';
import path from 'path';

const LOG_FILE_PATH = path.join(process.cwd(), 'logs', 'system-logs.json');

interface LogEntry {
    timestamp: string;
    type: 'error' | 'access' | 'info';
    method?: string;
    path?: string;
    statusCode?: number;
    error?: {
        message: string;
        stack?: string;
        code?: string;
    };
    userId?: string;
    ip?: string;
    userAgent?: string;
}

class Logger {
    private logs: LogEntry[] = [];
    private maxLogs = 1000; // Keep last 1000 logs

    constructor() {
        this.loadLogs();
    }

    private loadLogs() {
        try {
            const logsDir = path.dirname(LOG_FILE_PATH);
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }

            if (fs.existsSync(LOG_FILE_PATH)) {
                const data = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
                this.logs = JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading logs:', error);
            this.logs = [];
        }
    }

    private saveLogs() {
        try {
            const logsDir = path.dirname(LOG_FILE_PATH);
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }

            // Keep only the last maxLogs entries
            if (this.logs.length > this.maxLogs) {
                this.logs = this.logs.slice(-this.maxLogs);
            }

            fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(this.logs, null, 2));
        } catch (error) {
            console.error('Error saving logs:', error);
        }
    }

    logAccess(req: any, res: any, statusCode: number) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            type: 'access',
            method: req.method,
            path: req.path,
            statusCode,
            userId: req.user?.userId,
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('user-agent'),
        };

        this.logs.push(entry);
        this.saveLogs();
    }

    logError(error: any, req?: any) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            type: 'error',
            error: {
                message: error.message,
                stack: error.stack,
                code: error.code,
            },
            userId: req?.user?.userId,
            ip: req?.ip || req?.connection?.remoteAddress,
            userAgent: req?.get('user-agent'),
        };

        this.logs.push(entry);
        this.saveLogs();
    }

    logInfo(message: string, metadata?: any) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            type: 'info',
            error: {
                message,
            },
            ...metadata,
        };

        this.logs.push(entry);
        this.saveLogs();
    }

    getLogs(limit?: number): LogEntry[] {
        if (limit) {
            return this.logs.slice(-limit);
        }
        return this.logs;
    }

    getLogsByType(type: 'error' | 'access' | 'info', limit?: number): LogEntry[] {
        const filtered = this.logs.filter(log => log.type === type);
        if (limit) {
            return filtered.slice(-limit);
        }
        return filtered;
    }

    clearLogs() {
        this.logs = [];
        this.saveLogs();
    }
}

export const logger = new Logger();
