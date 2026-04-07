import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { LanguageModel } from 'ai';
import { ModelProvider } from './ModelProvider';

export class GeminiProvider implements ModelProvider {
    readonly name = 'gemini';
    private google;

    constructor() {
        this.google = createGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
        });
    }

    getModel(modelName?: string): LanguageModel {
        // Default model if none provided
        const model = modelName || 'gemini-2.5-flash';
        return this.google(model);
    }
}
