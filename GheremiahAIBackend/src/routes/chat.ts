import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateText } from 'ai';
import { authenticate, authenticateApiKey } from '../middleware/auth';
import { rateLimiter } from '../middleware/rate-limit';
import { HttpException } from '../middleware/error-handler';
import { UsageLog } from '../models/UsageLog';
import type { ChatResponse, StreamChunk } from '@gheremiah-ai/shared';
import { ErrorCode } from '@gheremiah-ai/shared';

const router: Router = Router();

const chatRequestSchema = z.object({
    messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1),
    })).min(1),
    stream: z.boolean().optional().default(false),
    model: z.enum(['gemini-2.5-flash', 'gemini-2.0-pro']).optional().default('gemini-2.5-flash'),
    maxTokens: z.number().positive().optional(),
    temperature: z.number().min(0).max(2).optional(),
    systemPrompt: z.string().optional(),
});

router.post('/', authenticateApiKey, authenticate, rateLimiter, async (req: Request, res: Response, next: NextFunction) => {
    const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY
    });

    try {
        const parsed = chatRequestSchema.parse(req.body);
        const userId = req.user?.userId;

        if (!userId) {
            return next(new HttpException(401, ErrorCode.UNAUTHORIZED, 'Not authenticated'));
        }

        const tier = req.user?.user.subscriptionTier || 'free';
        const maxTokens = parsed.maxTokens ?? (tier === 'free' ? 2000 : 8000);

        // Track usage
        const usageEntry = await UsageLog.create({
            userId,
            action: 'chat',
            tokensUsed: 0,
        });

        if (parsed.stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const result = await streamText({
                model: google(parsed.model),
                messages: parsed.messages,
                maxTokens,
                ...(parsed.systemPrompt && { system: parsed.systemPrompt }),
                ...(parsed.temperature !== undefined && { temperature: parsed.temperature }),
            });

            for await (const chunk of result.textStream) {
                const data: StreamChunk = { type: 'content', content: chunk };
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            }

            const usage = await result.usage;
            const usageData: StreamChunk = {
                type: 'usage',
                usage: usage ? {
                    promptTokens: usage.promptTokens,
                    completionTokens: usage.completionTokens,
                    totalTokens: usage.promptTokens + usage.completionTokens,
                } : undefined,
            };
            res.write(`data: ${JSON.stringify(usageData)}\n\n`);
            res.end();
        } else {
            const result = await generateText({
                model: google(parsed.model),
                messages: parsed.messages,
                maxTokens,
                ...(parsed.systemPrompt && { system: parsed.systemPrompt }),
                ...(parsed.temperature !== undefined && { temperature: parsed.temperature }),
            });

            const usage = await result.usage;
            const response: ChatResponse = {
                id: randomUUID(),
                content: result.text,
                model: parsed.model,
                timestamp: new Date(),
                usage: usage ? {
                    promptTokens: usage.promptTokens,
                    completionTokens: usage.completionTokens,
                    totalTokens: usage.promptTokens + usage.completionTokens,
                } : undefined,
            };

            if (usage) {
                usageEntry.tokensUsed = usage.promptTokens + usage.completionTokens;
                await usageEntry.save();
            }

            res.json({
                success: true,
                data: response,
                timestamp: new Date(),
            });
        }
    } catch (error) {
        console.warn("Error: ", error)
        if (error instanceof z.ZodError) {
            return next(new HttpException(400, ErrorCode.VALIDATION_ERROR, 'Invalid chat request', {
                errors: error.errors,
            }));
        }
        if (error instanceof HttpException) return next(error);
        return next(new HttpException(500, ErrorCode.INTERNAL_SERVER_ERROR, 'AI service error'));
    }
});

export default router;