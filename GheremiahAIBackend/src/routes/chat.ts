import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateText } from 'ai';
import { authenticate, authenticateApiKey } from '../middleware/auth';
import { rateLimiter } from '../middleware/rate-limit';
import { HttpException } from '../middleware/error-handler';
import { UsageLog } from '../models/UsageLog';
import type { ChatResponse, StreamChunk } from '@gheremiah-ai/shared';

const router = Router();
const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY
});

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

router.post('/', authenticateApiKey, authenticate, rateLimiter, async (req: Request, res: Response) => {
    try {
        const parsed = chatRequestSchema.parse(req.body);
        const userId = req.user?.userId;

        if (!userId) {
            throw new HttpException(401, 'UNAUTHORIZED', 'Not authenticated');
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

            const usageData: StreamChunk = {
                type: 'usage',
                usage: result.usage ? {
                    promptTokens: result.usage.promptTokens,
                    completionTokens: result.usage.completionTokens,
                    totalTokens: result.usage.promptTokens + result.usage.completionTokens,
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

            const response: ChatResponse = {
                id: randomUUID(),
                content: result.text,
                model: parsed.model,
                timestamp: new Date(),
                usage: result.usage ? {
                    promptTokens: result.usage.promptTokens,
                    completionTokens: result.usage.completionTokens,
                    totalTokens: result.usage.promptTokens + result.usage.completionTokens,
                } : undefined,
            };

            if (result.usage) {
                usageEntry.tokensUsed = result.usage.promptTokens + result.usage.completionTokens;
                await usageEntry.save();
            }

            res.json({
                success: true,
                data: response,
                timestamp: new Date(),
            });
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new HttpException(400, 'VALIDATION_ERROR', 'Invalid chat request', {
                errors: error.errors,
            });
        }
        if (error instanceof HttpException) throw error;
        throw new HttpException(500, 'INTERNAL_SERVER_ERROR', 'AI service error');
    }
});

export default router;